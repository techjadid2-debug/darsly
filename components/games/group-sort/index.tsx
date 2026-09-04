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
import { Timer } from '@/components/player/Timer'
import { Button } from '@/components/ui/Button'
import type { GameProps } from '@/lib/game-types'
import type { GroupsContent } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { useGameClock } from '@/lib/use-game-clock'

const POOL_ID = '__pool__'

type SortItem = { id: string; label: string; correctGroup: string }
/** Which group each item currently sits in; undefined means still in the pool. */
type Placement = Record<string, string | undefined>

function buildItems(content: GroupsContent): SortItem[] {
  return content.groups.flatMap((group, groupIndex) =>
    group.items.map((label, itemIndex) => ({
      id: `${groupIndex}-${itemIndex}`,
      label,
      correctGroup: group.name,
    })),
  )
}

function ItemChip({
  id,
  label,
  state,
}: {
  id: string
  label: string
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
        'min-h-11 touch-none select-none rounded-xl border px-3 py-2 text-left text-sm text-ink',
        tone,
        isDragging ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </button>
  )
}

function DropZone({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="rounded-(--radius-card) border border-border bg-surface p-3">
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <div
        ref={setNodeRef}
        className={[
          'mt-2 flex min-h-20 flex-wrap content-start gap-2 rounded-xl border-2 border-dashed p-2',
          isOver ? 'border-brand bg-brand-soft' : 'border-border',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

export default function GroupSort({
  content,
  settings,
  onFinish,
}: GameProps<GroupsContent>) {
  const tt = useTranslate()

  const items = useMemo(() => buildItems(content), [content])
  const shuffled = useMemo(
    () => (settings.shuffle ? shuffle(items) : items),
    [items, settings.shuffle],
  )
  const groupNames = useMemo(
    () => content.groups.map((group) => group.name),
    [content.groups],
  )

  const [placement, setPlacement] = useState<Placement>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // A short hold before the drag starts, so the page still scrolls on a phone.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const pool = shuffled.filter((item) => !placement[item.id])
  const allPlaced = items.length > 0 && pool.length === 0
  const score = items.filter((item) => placement[item.id] === item.correctGroup).length

  const { remaining, elapsedSec } = useGameClock(settings, () => {
    onFinish({ score, maxScore: items.length, durationSec: elapsedSec() })
  })

  function handleDragStart(event: DragStartEvent) {
    setDragging(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null)
    if (checked) return

    const itemId = String(event.active.id)
    const target = event.over ? String(event.over.id) : POOL_ID

    setPlacement((previous) => ({
      ...previous,
      [itemId]: target === POOL_ID ? undefined : target,
    }))
  }

  function stateFor(item: SortItem): 'idle' | 'correct' | 'wrong' {
    if (!checked) return 'idle'
    return placement[item.id] === item.correctGroup ? 'correct' : 'wrong'
  }

  const draggedItem = dragging
    ? items.find((item) => item.id === dragging)
    : undefined

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span>{tt('groupsort.instruction')}</span>
          <span className="flex shrink-0 items-center gap-2">
            <Timer remaining={remaining} />
            {tt('matchup.remaining', { n: pool.length })}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {groupNames.map((name) => (
            <DropZone key={name} id={name} title={name}>
              {items
                .filter((item) => placement[item.id] === name)
                .map((item) => (
                  <ItemChip
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    state={stateFor(item)}
                  />
                ))}
            </DropZone>
          ))}
        </div>

        <DropZone id={POOL_ID} title={tt('groupsort.pool')}>
          {pool.map((item) => (
            <ItemChip key={item.id} id={item.id} label={item.label} state="idle" />
          ))}
        </DropZone>

        {checked ? (
          <div className="flex flex-col gap-3">
            {settings.show_answers ? (
              <ul className="flex flex-col gap-1 text-sm text-ink-soft">
                {items
                  .filter((item) => placement[item.id] !== item.correctGroup)
                  .map((item) => (
                    <li key={item.id}>
                      <span className="text-ink">{item.label}</span> → {item.correctGroup}
                    </li>
                  ))}
              </ul>
            ) : null}
            <p className="text-sm font-medium text-ink">
              {tt('play.done.score', { score, max: items.length })}
            </p>
            <Button
              size="lg"
              onClick={() =>
                onFinish({ score, maxScore: items.length, durationSec: elapsedSec() })
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
        {draggedItem ? (
          <div className="rounded-xl border border-brand bg-surface px-3 py-2 text-sm text-ink shadow-lg">
            {draggedItem.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
