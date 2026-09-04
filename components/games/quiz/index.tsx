'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Timer } from '@/components/player/Timer'
import { Button } from '@/components/ui/Button'
import { useGameClock } from '@/lib/use-game-clock'
import type { GameProps } from '@/lib/game-types'
import type { McqContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'

type PreparedQuestion = {
  id: string
  question: string
  /** Options in display order. */
  options: string[]
  /** Index into `options` of the correct answer. */
  correctIndex: number
}

/**
 * Options are shuffled with the item id as the seed, so their order is stable
 * across re-renders of one question but differs from item to item — the
 * correct answer never sits in a predictable slot.
 */
function prepare(content: McqContent, shuffleItems: boolean): PreparedQuestion[] {
  const items = shuffleItems ? shuffle(content.items) : content.items

  return items.map((item) => {
    const ordered = shuffle(
      item.options.map((label, index) => ({ label, index })),
      item.id,
    )
    return {
      id: item.id,
      question: item.question,
      options: ordered.map((option) => option.label),
      correctIndex: ordered.findIndex(
        (option) => option.index === item.correct_index,
      ),
    }
  })
}

export default function Quiz({ content, settings, onFinish }: GameProps<McqContent>) {
  const tt = useTranslate()
  const questions = useMemo(
    () => prepare(content, settings.shuffle),
    [content, settings.shuffle],
  )

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  // Time up ends the round immediately with whatever has been scored so far.
  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({ score, maxScore: questions.length, durationSec: elapsedSec() })
  })

  const current = questions[index]
  if (!current) return null

  const isLast = index === questions.length - 1
  const answered = picked !== null
  const correctIndex = current.correctIndex

  function choose(optionIndex: number) {
    if (answered) return
    setPicked(optionIndex)
    if (optionIndex === correctIndex) setScore((value) => value + 1)
  }

  function advance() {
    if (isLast) {
      // `score` already includes the answer just given: setScore ran on click.
      onFinish({ score, maxScore: questions.length, durationSec: elapsedSec() })
      return
    }
    setIndex((value) => value + 1)
    setPicked(null)
  }

  function optionClass(optionIndex: number): string {
    const base =
      'flex min-h-12 w-full items-center rounded-xl border px-4 py-3 text-left text-base transition-colors'
    if (!answered) {
      return `${base} border-border bg-surface hover:border-brand hover:bg-brand-soft`
    }
    if (optionIndex === correctIndex && settings.show_answers) {
      return `${base} border-success bg-success/10 text-ink`
    }
    if (optionIndex === picked) {
      return `${base} border-danger bg-danger/10 text-ink`
    }
    return `${base} border-border bg-surface opacity-60`
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          {tt('play.progress', { current: index + 1, total: questions.length })}
        </span>
        <span className="flex items-center gap-2">
          <Timer remaining={remaining} />
          {tt('play.score', { score })}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold leading-snug text-ink">
            {current.question}
          </h2>

          <div className="flex flex-col gap-2">
            {current.options.map((option, optionIndex) => (
              <button
                key={`${current.id}-${optionIndex}`}
                type="button"
                onClick={() => choose(optionIndex)}
                disabled={answered}
                className={optionClass(optionIndex)}
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {answered ? (
        <div className="flex flex-col gap-3">
          <p
            className={
              picked === correctIndex
                ? 'text-sm font-medium text-success'
                : 'text-sm font-medium text-danger'
            }
          >
            {picked === correctIndex ? tt('play.correct') : tt('play.wrong')}
          </p>
          <Button size="lg" onClick={advance}>
            {isLast ? tt('play.finish') : tt('play.next')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
