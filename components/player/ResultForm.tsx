'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'
import type { GameResult } from '@/lib/game-types'
import { getTelegramContext } from '@/lib/telegram-client'

type State = 'idle' | 'sending' | 'sent' | 'error' | 'skipped'

/**
 * Asks the player for a name, then posts the result to /api/results.
 *
 * Inside a Telegram Mini App the player is already identified, so the prompt is
 * skipped and the signed `initData` blob is sent instead — the server verifies
 * it and takes the identity from there.
 */
export function ResultForm({
  activityId,
  gameId,
  result,
}: {
  activityId: string
  gameId: string
  result: GameResult
}) {
  const tt = useTranslate()
  const [name, setName] = useState('')
  const [state, setState] = useState<State>('idle')

  const submit = useCallback(
    async (playerName: string, initData?: string) => {
      setState('sending')
      try {
        const response = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: activityId,
            player_name: playerName.trim() || null,
            game: gameId,
            score: result.score,
            max_score: result.maxScore,
            duration_sec: result.durationSec,
            ...(initData ? { init_data: initData } : {}),
          }),
        })
        setState(response.ok ? 'sent' : 'error')
      } catch {
        setState('error')
      }
    },
    [activityId, gameId, result],
  )

  const autoSent = useRef(false)
  useEffect(() => {
    if (autoSent.current) return
    const telegram = getTelegramContext()
    if (!telegram) return
    autoSent.current = true
    void submit(telegram.displayName, telegram.initData)
  }, [submit])

  if (state === 'sent') {
    return <p className="text-sm font-medium text-success">{tt('result.sent')}</p>
  }
  if (state === 'skipped') return null

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit(name)
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="player-name" className="text-sm text-ink-soft">
        {tt('result.namePrompt')}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="player-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={tt('result.namePlaceholder')}
          maxLength={60}
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-base text-ink"
        />
        <Button type="submit" disabled={state === 'sending' || name.trim().length === 0}>
          {state === 'sending' ? tt('result.sending') : tt('result.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setState('skipped')}>
          {tt('result.skip')}
        </Button>
      </div>
      {state === 'error' ? (
        <p className="text-sm text-danger">{tt('result.failed')}</p>
      ) : null}
    </form>
  )
}
