'use client'

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Timer } from '@/components/player/Timer'
import { Button } from '@/components/ui/Button'
import { dndAccessibility } from '@/lib/dnd-a11y'
import type { GameProps } from '@/lib/game-types'
import type { PairsContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { useGameClock } from '@/lib/use-game-clock'

type Letter = { id: string; char: string }

/** The answer ignores spacing, so multi-word terms still work. */
function lettersOf(term: string): string[] {
  return [...term.replace(/\s+/g, '')]
}

function solutionOf(term: string): string {
  return lettersOf(term).join('').toLocaleLowerCase()
}

/** Scrambles, retrying a few times so the puzzle does not start already solved. */
function scramble(term: string, seed: string): Letter[] {
  const chars = lettersOf(term)
  const target = solutionOf(term)

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const order = shuffle(
      chars.map((char, index) => ({ char, index })),
      `${seed}-${attempt}`,
    )
    const candidate = order.map((entry) => entry.char).join('').toLocaleLowerCase()
    if (candidate !== target || chars.length < 2) {
      return order.map((entry) => ({ id: `${entry.index}`, char: entry.char }))
    }
  }
  // Every attempt landed on the solution (e.g. "aaa"); accept it.
  return chars.map((char, index) => ({ id: `${index}`, char }))
}

function LetterTile({ id, char }: Letter) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'flex size-12 touch-none select-none items-center justify-center rounded-xl border text-lg font-semibold uppercase',
        isDragging
          ? 'border-brand bg-brand-soft text-brand'
          : 'border-border bg-surface text-ink',
      ].join(' ')}
    >
      {char}
    </button>
  )
}

export default function Anagram({ content, settings, onFinish }: GameProps<PairsContent>) {
  const tt = useTranslate()

  // Every pair is kept: filtering out one-letter terms could empty the game
  // entirely, and a one-letter word simply starts solved.
  const words = useMemo(
    () => (settings.shuffle ? shuffle(content.items) : content.items),
    [content.items, settings.shuffle],
  )

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const current = words[index]

  const [letters, setLetters] = useState<Letter[]>(() =>
    current ? scramble(current.term, current.id) : [],
  )

  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({
      score,
      maxScore: words.length,
      durationSec: elapsedSec(),
      timedOut: true,
    })
  })

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // A short hold before the drag starts, so the page still scrolls on a phone.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Without `coordinateGetter` the keyboard sensor moves by a fixed pixel
    // delta, which means nothing to a sortable list: the tiles were focusable
    // and reorderable by mouse only.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!current) return null

  const solved =
    letters.map((letter) => letter.char).join('').toLocaleLowerCase() ===
    solutionOf(current.term)

  function charOf(id: string): string {
    return letters.find((letter) => letter.id === id)?.char ?? id
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLetters((previous) => {
      const from = previous.findIndex((letter) => letter.id === active.id)
      const to = previous.findIndex((letter) => letter.id === over.id)
      if (from === -1 || to === -1) return previous
      return arrayMove(previous, from, to)
    })
  }

  function advance() {
    const nextScore = score + 1
    setScore(nextScore)

    const next = words[index + 1]
    if (!next) {
      onFinish({ score: nextScore, maxScore: words.length, durationSec: elapsedSec() })
      return
    }
    setIndex(index + 1)
    setLetters(scramble(next.term, next.id))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>{tt('anagram.progress', { current: index + 1, total: words.length })}</span>
        <span className="flex items-center gap-2">
          <Timer remaining={remaining} />
          {tt('play.score', { score })}
        </span>
      </div>

      <p className="text-sm text-ink-soft">{tt('anagram.instruction')}</p>

      <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-base text-ink">
        {tt('anagram.hint', { hint: current.definition })}
      </p>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        accessibility={dndAccessibility(tt, {
          // Both ends of a sortable move are letters.
          item: charOf,
          target: charOf,
        })}
      >
        <SortableContext
          items={letters.map((letter) => letter.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={[
              'flex flex-wrap justify-center gap-2 rounded-(--radius-card) border-2 p-3',
              solved ? 'border-success bg-success/5' : 'border-dashed border-border',
            ].join(' ')}
          >
            {letters.map((letter) => (
              <LetterTile key={letter.id} id={letter.id} char={letter.char} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {solved ? (
        <div className="flex flex-col gap-3">
          <p aria-live="polite" className="text-sm font-medium text-success">
            {tt('play.correct')}
          </p>
          <Button size="lg" onClick={advance}>
            {index === words.length - 1 ? tt('play.finish') : tt('play.next')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
