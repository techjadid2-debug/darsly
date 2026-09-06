import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getGame } from '@/lib/games'
import { insertResultRecord } from '@/lib/db'
import { verifyTelegramInitData } from '@/lib/telegram'

/**
 * Records one play result.
 */
const bodySchema = z.object({
  activity_id: z.guid(),
  player_name: z.string().trim().min(1).max(60).nullish(),
  game: z.string().min(1).max(40),
  score: z.number().int().min(0).max(10_000),
  max_score: z.number().int().min(1).max(10_000),
  duration_sec: z.number().int().min(0).max(86_400),
  /** Telegram Mini App payload. Verified server-side before it is believed. */
  init_data: z.string().max(4096).optional(),
})

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-body' }, { status: 400 })
  }

  const body = parsed.data
  if (body.score > body.max_score) {
    return NextResponse.json({ error: 'score-above-max' }, { status: 400 })
  }
  if (!getGame(body.game)) {
    return NextResponse.json({ error: 'unknown-game' }, { status: 400 })
  }

  // A Telegram id is stored only when the signature checks out. An initData
  // blob that fails verification is not an error — it is simply ignored, and
  // the submission is recorded as an ordinary anonymous one.
  const telegram = body.init_data
    ? verifyTelegramInitData(body.init_data)
    : null
  const telegramUser = telegram?.ok ? telegram.user : null

  try {
    await insertResultRecord({
      activity_id: body.activity_id,
      player_name: telegramUser?.displayName ?? body.player_name ?? null,
      player_tg_id: telegramUser?.id ?? null,
      game: body.game,
      score: body.score,
      max_score: body.max_score,
      duration_sec: body.duration_sec,
    })
  } catch (err) {
    console.error('Failed to insert result:', err)
    return NextResponse.json({ error: 'rejected' }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
