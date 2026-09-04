import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'

import { verifyTelegramInitData } from '@/lib/telegram'

const BOT_TOKEN = '123456:TEST-BOT-TOKEN-not-a-real-one'

/** Builds a correctly signed initData blob, the way Telegram would. */
function signInitData(
  fields: Record<string, string>,
  botToken = BOT_TOKEN,
): string {
  const dataCheckString = Object.entries(fields)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')

  const params = new URLSearchParams(fields)
  params.set('hash', hash)
  return params.toString()
}

function freshFields(overrides: Record<string, string> = {}) {
  return {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'AAF-test',
    user: JSON.stringify({ id: 987654321, first_name: 'Aziza', last_name: 'Karimova' }),
    ...overrides,
  }
}

test('a correctly signed payload yields the Telegram user', () => {
  const result = verifyTelegramInitData(signInitData(freshFields()), BOT_TOKEN)
  assert.ok(result.ok)
  assert.equal(result.user.id, 987654321)
  assert.equal(result.user.displayName, 'Aziza Karimova')
})

test('a tampered hash is rejected', () => {
  const signed = signInitData(freshFields())
  const params = new URLSearchParams(signed)
  const hash = params.get('hash')
  assert.ok(hash)
  // Flip one hex digit.
  params.set('hash', (hash[0] === 'a' ? 'b' : 'a') + hash.slice(1))

  const result = verifyTelegramInitData(params.toString(), BOT_TOKEN)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'bad-signature')
})

test('changing the user id after signing is rejected', () => {
  const signed = signInitData(freshFields())
  const params = new URLSearchParams(signed)
  // Impersonation attempt: keep the signature, swap the identity.
  params.set('user', JSON.stringify({ id: 1, first_name: 'Impostor' }))

  const result = verifyTelegramInitData(params.toString(), BOT_TOKEN)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'bad-signature')
})

test('a payload signed with a different bot token is rejected', () => {
  const signed = signInitData(freshFields(), 'other:TOKEN')
  const result = verifyTelegramInitData(signed, BOT_TOKEN)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'bad-signature')
})

test('a correctly signed but stale payload is rejected', () => {
  const twoDaysAgo = String(Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60)
  const result = verifyTelegramInitData(
    signInitData(freshFields({ auth_date: twoDaysAgo })),
    BOT_TOKEN,
  )
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'expired')
})

test('a payload with no hash is rejected', () => {
  const result = verifyTelegramInitData('auth_date=1&user=%7B%7D', BOT_TOKEN)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'malformed')
})

test('verification fails closed when no bot token is configured', () => {
  const result = verifyTelegramInitData(signInitData(freshFields()), undefined)
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'no-token')
})

test('a signed payload carrying no user is rejected', () => {
  const result = verifyTelegramInitData(
    signInitData({ auth_date: String(Math.floor(Date.now() / 1000)), query_id: 'x' }),
    BOT_TOKEN,
  )
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.reason, 'no-user')
})

test('the display name falls back to username, then to the id', () => {
  const withUsername = verifyTelegramInitData(
    signInitData(freshFields({ user: JSON.stringify({ id: 5, username: 'aziza' }) })),
    BOT_TOKEN,
  )
  assert.ok(withUsername.ok)
  assert.equal(withUsername.user.displayName, 'aziza')

  const bare = verifyTelegramInitData(
    signInitData(freshFields({ user: JSON.stringify({ id: 5 }) })),
    BOT_TOKEN,
  )
  assert.ok(bare.ok)
  assert.equal(bare.user.displayName, 'id5')
})
