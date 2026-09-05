'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Timer } from '@/components/player/Timer'
import type { GameProps } from '@/lib/game-types'
import type { PairsContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { useGameClock } from '@/lib/use-game-clock'

/** How long a mismatched couple stays visible before flipping back. */
const REVEAL_MS = 800

type Tile = { key: string; pairId: string; label: string }

function buildTiles(content: PairsContent): Tile[] {
  const tiles = content.items.flatMap((pair) => [
    { key: `${pair.id}-t`, pairId: pair.id, label: pair.term },
    { key: `${pair.id}-d`, pairId: pair.id, label: pair.definition },
  ])
  return shuffle(tiles)
}

export default function MatchingPairs({
  content,
  settings,
  onFinish,
}: GameProps<PairsContent>) {
  const tt = useTranslate()
  const tiles = useMemo(() => buildTiles(content), [content])
  const totalPairs = content.items.length

  const [revealed, setRevealed] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [locked, setLocked] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({
      score: matched.size,
      maxScore: totalPairs,
      durationSec: elapsedSec(),
      timedOut: true,
    })
  })

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  function flip(tile: Tile) {
    if (locked) return
    if (matched.has(tile.pairId)) return
    if (revealed.includes(tile.key)) return

    const next = [...revealed, tile.key]
    setRevealed(next)
    if (next.length < 2) return

    // Two are face up: decide, then either keep them or flip both back.
    setLocked(true)
    const [firstKey, secondKey] = next
    const first = tiles.find((candidate) => candidate.key === firstKey)
    const second = tiles.find((candidate) => candidate.key === secondKey)
    const isMatch = Boolean(first && second && first.pairId === second.pairId)

    timeoutRef.current = setTimeout(() => {
      setRevealed([])
      setLocked(false)
      if (!isMatch || !first) return

      const nextMatched = new Set(matched).add(first.pairId)
      setMatched(nextMatched)
      if (nextMatched.size === totalPairs) {
        onFinish({
          score: nextMatched.size,
          maxScore: totalPairs,
          durationSec: elapsedSec(),
        })
      }
    }, REVEAL_MS)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
        <span>{tt('memory.instruction')}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Timer remaining={remaining} />
          <span aria-live="polite">
            {tt('memory.found', { found: matched.size, total: totalPairs })}
          </span>
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {tiles.map((tile, index) => {
          const isMatched = matched.has(tile.pairId)
          const isUp = isMatched || revealed.includes(tile.key)

          return (
            <li key={tile.key}>
              <motion.button
                type="button"
                onClick={() => flip(tile)}
                disabled={isMatched}
                animate={{ scale: isUp ? 1 : 0.98 }}
                // Face up, the tile's own text is its name. Face down, it has
                // none at all — every tile would announce as a bare "button" —
                // so it is named by position, which gives away nothing.
                aria-label={isUp ? undefined : tt('memory.tile.down', { n: index + 1 })}
                className={[
                  'flex min-h-20 w-full items-center justify-center rounded-xl border p-2 text-center text-sm transition-colors',
                  isMatched
                    ? 'border-success bg-success/10 text-ink'
                    : isUp
                      ? 'border-brand bg-brand-soft text-ink'
                      : 'border-border bg-surface-2 text-ink-soft/40',
                ].join(' ')}
              >
                {/* Only rendered face up: a hidden label would put every answer
                    in the page source. The tile keeps its size via min-h-20. */}
                {isUp ? <span>{tile.label}</span> : <span aria-hidden>?</span>}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
