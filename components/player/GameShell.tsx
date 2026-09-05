'use client'

import { MotionConfig, motion } from 'framer-motion'
import { useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { GameRenderer } from '@/components/player/GameRenderer'
import { ResultForm } from '@/components/player/ResultForm'
import { Button } from '@/components/ui/Button'
import type { GameEntry } from '@/lib/games'
import type { GameResult } from '@/lib/game-types'
import type { ActivitySettings } from '@/lib/schemas'

/**
 * Frames a game: runs it, then shows the score when it finishes.
 *
 * `activityId` turns the result screen into a submission form. The editor
 * preview leaves it out, so practice runs never reach the results table.
 */
export function GameShell({
  game,
  rawContent,
  settings,
  activityId,
  onResult,
}: {
  game: GameEntry
  rawContent: unknown
  settings: ActivitySettings
  activityId?: string | undefined
  onResult?: (result: GameResult) => void
}) {
  const tt = useTranslate()
  const [result, setResult] = useState<GameResult | null>(null)
  // Bumping the key remounts the game, which resets all of its internal state.
  const [round, setRound] = useState(0)

  function finish(next: GameResult) {
    setResult(next)
    onResult?.(next)
  }

  if (result) {
    return (
      <MotionConfig reducedMotion="user">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          data-theme-variant={settings.theme}
          // The game is replaced wholesale by this card, which a screen reader
          // would otherwise not mention at all.
          role="status"
          className="rounded-(--radius-card) border border-border bg-surface px-6 py-10 text-center"
        >
          {result.timedOut ? (
            <p className="mb-2 text-sm font-medium text-danger">{tt('play.timeUp')}</p>
          ) : null}
          <h2 className="text-xl font-semibold text-ink">{tt('play.done.title')}</h2>
          <p className="mt-2 text-2xl font-semibold text-brand">
            {tt('play.done.score', { score: result.score, max: result.maxScore })}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {tt('play.done.time', { sec: result.durationSec })}
          </p>
          {activityId ? (
            <div className="mt-6 text-left">
              <ResultForm activityId={activityId} gameId={game.id} result={result} />
            </div>
          ) : null}

          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                setResult(null)
                setRound((value) => value + 1)
              }}
            >
              {tt('play.restart')}
            </Button>
          </div>
        </motion.div>
      </MotionConfig>
    )
  }

  // One wrapper for every game, so a student who asked their phone to reduce
  // motion is not spun through a card flip to get an answer.
  return (
    <MotionConfig reducedMotion="user">
      <div data-theme-variant={settings.theme}>
        <GameRenderer
          key={`${game.id}-${round}`}
          game={game}
          rawContent={rawContent}
          settings={settings}
          onFinish={finish}
        />
      </div>
    </MotionConfig>
  )
}
