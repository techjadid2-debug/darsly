import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core'

import type { Translate } from '@/lib/i18n'

/**
 * dnd-kit ships its own screen-reader announcements, hardcoded in English —
 * which in this app means a student on a Russian phone is told "To pick up a
 * draggable item, press the space bar". Every `DndContext` in `components/games`
 * passes the result of this instead.
 *
 * Ids are not text: a draggable id is an item id and a droppable id is a group
 * name or a slot id, so each game supplies its own resolvers. `item` and
 * `target` are separate because the same id can be both — in `match-up` a pair
 * id names the definition being dragged *and* the slot it can land in.
 */
export type DndLabels = {
  item: (id: string) => string
  target: (id: string) => string
}

export function dndAccessibility(
  tt: Translate,
  labels: DndLabels,
): {
  announcements: Announcements
  screenReaderInstructions: ScreenReaderInstructions
} {
  const item = (id: string | number) => labels.item(String(id))
  const target = (id: string | number) => labels.target(String(id))

  return {
    screenReaderInstructions: { draggable: tt('dnd.instructions') },
    announcements: {
      onDragStart: ({ active }) => tt('dnd.picked', { item: item(active.id) }),
      onDragOver: ({ active, over }) =>
        over
          ? tt('dnd.over', { item: item(active.id), target: target(over.id) })
          : undefined,
      onDragEnd: ({ active, over }) =>
        over
          ? tt('dnd.dropped', { item: item(active.id), target: target(over.id) })
          : tt('dnd.returned', { item: item(active.id) }),
      onDragCancel: ({ active }) => tt('dnd.cancelled', { item: item(active.id) }),
    },
  }
}
