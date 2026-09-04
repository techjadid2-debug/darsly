'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { GameRenderer } from '@/components/player/GameRenderer'
import { Button } from '@/components/ui/Button'
import type { GameEntry } from '@/lib/games'
import type { GameResult } from '@/lib/game-types'
import type { ActivitySettings } from '@/lib/schemas'

/**
 * Frames a game: runs it, then shows the score when it finishes.
 * `onResult` is where M6 will POST to /api/results.
 */
export function GameShell({
  game,
  rawContent,
  settings,
  onResult,
}: {
  game: GameEntry
  rawContent: unknown
  settings: ActivitySettings
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
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-(--radius-card) border border-border bg-surface px-6 py-10 text-center"
      >
        <h2 className="text-xl font-semibold text-ink">{tt('play.done.title')}</h2>
        <p className="mt-2 text-2xl font-semibold text-brand">
          {tt('play.done.score', { score: result.score, max: result.maxScore })}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {tt('play.done.time', { sec: result.durationSec })}
        </p>
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
    )
  }

  return (
    <GameRenderer
      key={`${game.id}-${round}`}
      game={game}
      rawContent={rawContent}
      settings={settings}
      onFinish={finish}
    />
  )
}
