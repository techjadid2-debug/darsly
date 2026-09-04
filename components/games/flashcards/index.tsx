'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Timer } from '@/components/player/Timer'
import { Button } from '@/components/ui/Button'
import type { GameProps } from '@/lib/game-types'
import type { PairsContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { useGameClock } from '@/lib/use-game-clock'

const faceStyle: React.CSSProperties = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

export default function Flashcards({
  content,
  settings,
  onFinish,
}: GameProps<PairsContent>) {
  const tt = useTranslate()
  const cards = useMemo(
    () => (settings.shuffle ? shuffle(content.items) : content.items),
    [content.items, settings.shuffle],
  )

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)

  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({ score: known, maxScore: cards.length, durationSec: elapsedSec() })
  })

  const card = cards[index]
  if (!card) return null

  function answer(knewIt: boolean) {
    const nextKnown = knewIt ? known + 1 : known
    setKnown(nextKnown)

    if (index === cards.length - 1) {
      onFinish({
        score: nextKnown,
        maxScore: cards.length,
        durationSec: elapsedSec(),
      })
      return
    }
    setIndex((value) => value + 1)
    setFlipped(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>{tt('play.progress', { current: index + 1, total: cards.length })}</span>
        <span className="flex items-center gap-2">
          <Timer remaining={remaining} />
          {tt('flash.known', { n: known })}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-label={tt('flash.tapToFlip')}
        className="relative block h-56 w-full [perspective:1200px]"
      >
        <motion.div
          key={card.id}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          className="relative size-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            style={faceStyle}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-border bg-surface p-5"
          >
            <span className="text-2xl font-semibold text-ink">{card.term}</span>
            <span className="text-xs text-ink-soft">{tt('flash.tapToFlip')}</span>
          </div>

          <div
            style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
            className="absolute inset-0 flex items-center justify-center rounded-(--radius-card) border border-brand bg-brand-soft p-5"
          >
            <span className="text-center text-xl font-medium text-ink">
              {card.definition}
            </span>
          </div>
        </motion.div>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="lg" onClick={() => answer(false)}>
          {tt('flash.didnt')}
        </Button>
        <Button size="lg" onClick={() => answer(true)}>
          {tt('flash.knew')}
        </Button>
      </div>
    </div>
  )
}
