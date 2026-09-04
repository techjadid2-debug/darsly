'use client'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'
import type { GameProps } from '@/lib/game-types'
import type { PairsContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'

const POOL_ID = '__pool__'

/** Where each term's slot currently holds a definition (by pair id). */
type Placement = Record<string, string | undefined>

function DefinitionChip({
  id,
  text,
  state,
}: {
  id: string
  text: string
  state: 'idle' | 'correct' | 'wrong'
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })

  const tone =
    state === 'correct'
      ? 'border-success bg-success/10'
      : state === 'wrong'
        ? 'border-danger bg-danger/10'
        : 'border-border bg-surface'

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={[
        'min-h-11 rounded-xl border px-3 py-2 text-left text-sm text-ink',
        'touch-none select-none',
        tone,
        isDragging ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {text}
    </button>
  )
}

function TermSlot({
  termId,
  term,
  children,
  state,
}: {
  termId: string
  term: string
  children: React.ReactNode
  state: 'idle' | 'correct' | 'wrong'
}) {
  const tt = useTranslate()
  const { setNodeRef, isOver } = useDroppable({ id: termId })

  const tone =
    state === 'correct'
      ? 'border-success'
      : state === 'wrong'
        ? 'border-danger'
        : isOver
          ? 'border-brand bg-brand-soft'
          : 'border-border'

  return (
    <li className="rounded-(--radius-card) border border-border bg-surface p-3">
      <p className="text-base font-medium text-ink">{term}</p>
      <div
        ref={setNodeRef}
        className={`mt-2 flex min-h-12 items-center rounded-xl border-2 border-dashed px-2 ${tone}`}
      >
        {children ?? (
          <span className="px-1 text-sm text-ink-soft">{tt('matchup.dropHere')}</span>
        )}
      </div>
    </li>
  )
}

function DefinitionPool({ children }: { children: React.ReactNode }) {
  const tt = useTranslate()
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID })

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ink-soft">{tt('matchup.pool')}</h3>
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-14 flex-wrap gap-2 rounded-(--radius-card) border border-dashed p-2',
          isOver ? 'border-brand bg-brand-soft' : 'border-border',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

export default function MatchUp({
  content,
  settings,
  onFinish,
}: GameProps<PairsContent>) {
  const tt = useTranslate()

  const pairs = useMemo(
    () => (settings.shuffle ? shuffle(content.items) : content.items),
    [content.items, settings.shuffle],
  )
  const definitions = useMemo(
    () => shuffle(content.items, `defs-${content.items.length}`),
    [content.items],
  )

  const [startedAt] = useState(() => Date.now())
  const [placement, setPlacement] = useState<Placement>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // A short hold before the drag starts, so the page still scrolls on a phone.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  )

  const placedIds = new Set(
    Object.values(placement).filter((value): value is string => Boolean(value)),
  )
  const pool = definitions.filter((pair) => !placedIds.has(pair.id))
  const allPlaced = pairs.length > 0 && pool.length === 0
  const score = pairs.filter((pair) => placement[pair.id] === pair.id).length

  function handleDragStart(event: DragStartEvent) {
    setDragging(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null)
    if (checked) return

    const definitionId = String(event.active.id)
    const target = event.over ? String(event.over.id) : POOL_ID

    setPlacement((previous) => {
      const next: Placement = {}
      // Drop the definition out of whichever slot it was in.
      for (const [termId, held] of Object.entries(previous)) {
        if (held !== definitionId) next[termId] = held
      }
      if (target !== POOL_ID) {
        // A slot holds one definition; anything already there returns to the pool.
        next[target] = definitionId
      }
      return next
    })
  }

  function stateFor(termId: string): 'idle' | 'correct' | 'wrong' {
    if (!checked) return 'idle'
    if (!placement[termId]) return 'wrong'
    return placement[termId] === termId ? 'correct' : 'wrong'
  }

  const draggedPair = dragging
    ? content.items.find((pair) => pair.id === dragging)
    : undefined

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span>{tt('matchup.instruction')}</span>
          <span className="shrink-0">{tt('matchup.remaining', { n: pool.length })}</span>
        </div>

        <ul className="flex flex-col gap-3">
          {pairs.map((pair) => {
            const heldId = placement[pair.id]
            const held = heldId
              ? content.items.find((item) => item.id === heldId)
              : undefined
            return (
              <TermSlot
                key={pair.id}
                termId={pair.id}
                term={pair.term}
                state={stateFor(pair.id)}
              >
                {held ? (
                  <DefinitionChip
                    id={held.id}
                    text={held.definition}
                    state={checked ? stateFor(pair.id) : 'idle'}
                  />
                ) : null}
              </TermSlot>
            )
          })}
        </ul>

        <DefinitionPool>
          {pool.map((pair) => (
            <DefinitionChip
              key={pair.id}
              id={pair.id}
              text={pair.definition}
              state="idle"
            />
          ))}
        </DefinitionPool>

        {checked ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-ink">
              {tt('play.done.score', { score, max: pairs.length })}
            </p>
            <Button
              size="lg"
              onClick={() =>
                onFinish({
                  score,
                  maxScore: pairs.length,
                  durationSec: Math.round((Date.now() - startedAt) / 1000),
                })
              }
            >
              {tt('play.finish')}
            </Button>
          </div>
        ) : (
          <Button size="lg" disabled={!allPlaced} onClick={() => setChecked(true)}>
            {tt('play.check')}
          </Button>
        )}
      </div>

      <DragOverlay>
        {draggedPair ? (
          <div className="rounded-xl border border-brand bg-surface px-3 py-2 text-sm text-ink shadow-lg">
            {draggedPair.definition}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
