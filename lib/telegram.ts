import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

/**
 * Server-side verification of a Telegram Mini App `initData` blob.
 *
 * `player_tg_id` is only ever taken from a payload that passes this check.
 * Anything the browser claims about who the player is — including the id and
 * the name — is discarded in favour of what the signature vouches for.
 *
 * Algorithm per Telegram's docs: the secret key is HMAC-SHA256 of the bot
 * token under the literal key "WebAppData", and the signed message is the
 * remaining fields sorted by name as `key=value` lines.
 */

const MAX_AGE_SECONDS = 24 * 60 * 60

const userSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
})

export type TelegramUser = {
  id: number
  displayName: string
}

export type VerifyResult =
  | { ok: true; user: TelegramUser }
  | { ok: false; reason: 'no-token' | 'malformed' | 'bad-signature' | 'expired' | 'no-user' }

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

export function verifyTelegramInitData(
  initData: string,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
): VerifyResult {
  if (!botToken) return { ok: false, reason: 'no-token' }

  let params: URLSearchParams
  try {
    params = new URLSearchParams(initData)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const hash = params.get('hash')
  if (!hash) return { ok: false, reason: 'malformed' }

  // Everything except `hash` is signed, sorted by field name.
  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (!safeEqualHex(computed, hash)) return { ok: false, reason: 'bad-signature' }

  // A valid signature is replayable forever without a freshness check.
  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate)) return { ok: false, reason: 'malformed' }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate
  if (ageSeconds > MAX_AGE_SECONDS || ageSeconds < -60) {
    return { ok: false, reason: 'expired' }
  }

  const rawUser = params.get('user')
  if (!rawUser) return { ok: false, reason: 'no-user' }

  let parsedUser: unknown
  try {
    parsedUser = JSON.parse(rawUser)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const user = userSchema.safeParse(parsedUser)
  if (!user.success) return { ok: false, reason: 'no-user' }

  const displayName =
    [user.data.first_name, user.data.last_name].filter(Boolean).join(' ').trim() ||
    user.data.username ||
    `id${user.data.id}`

  return { ok: true, user: { id: user.data.id, displayName: displayName.slice(0, 60) } }
}
