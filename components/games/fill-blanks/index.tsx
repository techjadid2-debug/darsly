'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Timer } from '@/components/player/Timer'
import { Button } from '@/components/ui/Button'
import type { GameProps } from '@/lib/game-types'
import type { SequenceContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { useGameClock } from '@/lib/use-game-clock'

type Chip = { id: string; word: string }

/**
 * Fill in the blanks — the one game that reads `sequence` content.
 *
 * The words are tapped from a bank rather than typed: on a phone a keyboard
 * covers half the screen, and a typo would score as a wrong answer when the
 * student knew the word. A sentence scores one point when every blank in it is
 * right, which keeps `maxScore` the number of sentences, as in the other games.
 */
export default function FillBlanks({
  content,
  settings,
  onFinish,
}: GameProps<SequenceContent>) {
  const tt = useTranslate()

  const sentences = useMemo(
    () => (settings.shuffle ? shuffle(content.items) : content.items),
    [content.items, settings.shuffle],
  )

  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<ReadonlyArray<string | null>>([])
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)

  const current = sentences[index]

  const words = useMemo(() => current?.text.split(/\s+/) ?? [], [current])
  /** Word positions to hide, in the order they appear in the sentence. */
  const blanks = useMemo(
    () => (current ? [...current.blanks].sort((a, b) => a - b) : []),
    [current],
  )

  const bank = useMemo<Chip[]>(() => {
    if (!current) return []
    const answers = blanks.map((position, slot) => ({
      id: `${current.id}-${slot}`,
      word: words[position] ?? '',
    }))
    // Always shuffled, whatever `settings.shuffle` says: bank order matching
    // slot order would hand the student the answer.
    return shuffle(answers, `bank-${current.id}`)
  }, [current, blanks, words])

  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({
      score,
      maxScore: sentences.length,
      durationSec: elapsedSec(),
      timedOut: true,
    })
  })

  if (!current) return null

  const slots = placed.length === blanks.length ? placed : blanks.map(() => null)
  const used = new Set(slots.filter((id): id is string => id !== null))
  const complete = slots.every((id) => id !== null)

  /** The word a chip id carries, or '' if the slot is empty. */
  const wordOf = (id: string | null) => bank.find((chip) => chip.id === id)?.word ?? ''

  const isSlotCorrect = (slot: number) => {
    const position = blanks[slot]
    return position !== undefined && wordOf(slots[slot] ?? null) === words[position]
  }
  const allCorrect = slots.every((_, slot) => isSlotCorrect(slot))

  function place(chipId: string) {
    if (checked) return
    const next = [...slots]
    const empty = next.findIndex((id) => id === null)
    if (empty === -1) return
    next[empty] = chipId
    setPlaced(next)
  }

  function clear(slot: number) {
    if (checked) return
    const next = [...slots]
    next[slot] = null
    setPlaced(next)
  }

  function check() {
    setChecked(true)
    if (allCorrect) setScore((value) => value + 1)
  }

  function advance() {
    if (index === sentences.length - 1) {
      // `score` already includes this sentence: setScore ran on check.
      onFinish({ score, maxScore: sentences.length, durationSec: elapsedSec() })
      return
    }
    setIndex((value) => value + 1)
    setPlaced([])
    setChecked(false)
  }

  function slotClass(slot: number): string {
    const base =
      'mx-1 inline-flex min-h-11 min-w-24 items-center justify-center rounded-lg border-2 px-2 align-middle text-base'
    if (!checked) {
      return slots[slot]
        ? `${base} border-brand bg-brand-soft text-ink`
        : `${base} border-dashed border-border text-ink-soft`
    }
    return isSlotCorrect(slot)
      ? `${base} border-success bg-success/10 text-ink`
      : `${base} border-danger bg-danger/10 text-ink`
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>{tt('play.progress', { current: index + 1, total: sentences.length })}</span>
        <span className="flex items-center gap-2">
          <Timer remaining={remaining} />
          {tt('play.score', { score })}
        </span>
      </div>

      <p className="text-sm text-ink-soft">{tt('blanks.instruction')}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-4"
        >
          <p className="text-lg leading-loose text-ink">
            {words.map((word, position) => {
              const slot = blanks.indexOf(position)
              if (slot === -1) return <span key={position}>{word} </span>

              const chipId = slots[slot] ?? null
              return (
                // The trailing space keeps the next word off the slot; the
                // words around it carry their own.
                <span key={position}>
                  <button
                    type="button"
                    onClick={() => clear(slot)}
                    aria-disabled={checked}
                    aria-label={
                      chipId
                        ? tt('blanks.filled', { n: slot + 1, word: wordOf(chipId) })
                        : tt('blanks.blank', { n: slot + 1 })
                    }
                    className={slotClass(slot)}
                  >
                    {chipId ? wordOf(chipId) : '…'}
                  </button>{' '}
                </span>
              )
            })}
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink">{tt('blanks.bank')}</h3>
            <ul className="flex flex-wrap gap-2">
              {bank.map((chip) => (
                <li key={chip.id}>
                  <button
                    type="button"
                    onClick={() => place(chip.id)}
                    disabled={used.has(chip.id) || checked}
                    className="min-h-11 rounded-xl border border-border bg-surface px-4 text-base text-ink transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-40"
                  >
                    {chip.word}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>

      {checked ? (
        <div className="flex flex-col gap-3">
          <p
            aria-live="polite"
            className={
              allCorrect
                ? 'text-sm font-medium text-success'
                : 'text-sm font-medium text-danger'
            }
          >
            {allCorrect ? tt('play.correct') : tt('play.wrong')}
          </p>
          <Button size="lg" onClick={advance}>
            {index === sentences.length - 1 ? tt('play.finish') : tt('play.next')}
          </Button>
        </div>
      ) : (
        <Button size="lg" disabled={!complete} onClick={check}>
          {tt('play.check')}
        </Button>
      )}
    </div>
  )
}
