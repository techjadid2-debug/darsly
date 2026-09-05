import { makeId } from '@/lib/ids'
import type {
  Group,
  GroupsContent,
  McqContent,
  McqItem,
  PairItem,
  PairsContent,
  SequenceContent,
  SequenceItem,
} from '@/lib/schemas'

/**
 * Editor-side row types. Unlike the stored schemas these allow empty strings,
 * because a row is incomplete for as long as the teacher is still typing it.
 * `toPairsContent` / `toMcqContent` drop the incomplete rows, so what is
 * autosaved and previewed is always valid content.
 */

export type PairDraft = { id: string; term: string; definition: string }
/** Group items are edited as one textarea, one item per line. */
export type GroupDraft = { id: string; name: string; itemsText: string }
export type McqDraft = {
  id: string
  question: string
  options: string[]
  correctIndex: number
}
/**
 * A sentence is edited as one string with the words to hide in brackets —
 * `Suv [100] gradusda qaynaydi`. The stored schema wants the plain text plus
 * the word positions, which is exact but unpleasant to type; the brackets are
 * the editor's format and never reach the database.
 */
export type SequenceDraft = { id: string; markedText: string }

export function emptyPairDraft(): PairDraft {
  return { id: makeId(), term: '', definition: '' }
}

export function emptyMcqDraft(): McqDraft {
  return { id: makeId(), question: '', options: ['', ''], correctIndex: 0 }
}

export function emptySequenceDraft(): SequenceDraft {
  return { id: makeId(), markedText: '' }
}

/** `Suv [100] gradusda qaynaydi` → text without brackets, plus `blanks: [1]`. */
export function parseMarkedSentence(marked: string): { text: string; blanks: number[] } {
  const words = marked.trim().split(/\s+/).filter(Boolean)
  const blanks: number[] = []

  const text = words.map((word, index) => {
    const inner = /^\[(.+)\]$/.exec(word)?.[1]
    if (inner === undefined) return word
    blanks.push(index)
    return inner
  })

  return { text: text.join(' '), blanks }
}

/** The inverse, for loading stored content back into the editor. */
export function markSentence(item: SequenceItem): string {
  const blanks = new Set(item.blanks)
  return item.text
    .split(/\s+/)
    .map((word, index) => (blanks.has(index) ? `[${word}]` : word))
    .join(' ')
}

export function pairDraftsFrom(content: PairsContent): PairDraft[] {
  return content.items.map((item) => ({
    id: item.id,
    term: item.term,
    definition: item.definition,
  }))
}

export function mcqDraftsFrom(content: McqContent): McqDraft[] {
  return content.items.map((item) => ({
    id: item.id,
    question: item.question,
    options: [...item.options],
    correctIndex: item.correct_index,
  }))
}

export function pairItemsToDrafts(items: PairItem[]): PairDraft[] {
  return items.map((item) => ({
    id: item.id,
    term: item.term,
    definition: item.definition,
  }))
}

export function mcqItemsToDrafts(items: McqItem[]): McqDraft[] {
  return items.map((item) => ({
    id: item.id,
    question: item.question,
    options: [...item.options],
    correctIndex: item.correct_index,
  }))
}

export function toPairsContent(rows: readonly PairDraft[]): PairsContent {
  return {
    items: rows
      .filter((row) => row.term.trim() && row.definition.trim())
      .map((row) => ({
        id: row.id,
        term: row.term.trim(),
        definition: row.definition.trim(),
      })),
  }
}

export function sequenceDraftsFrom(content: SequenceContent): SequenceDraft[] {
  return content.items.map((item) => ({ id: item.id, markedText: markSentence(item) }))
}

export function sequenceItemsToDrafts(items: SequenceItem[]): SequenceDraft[] {
  return items.map((item) => ({ id: item.id, markedText: markSentence(item) }))
}

/**
 * A sentence with no brackets has nothing to answer, so it is dropped the same
 * way a pair with no definition is — the teacher is still typing it.
 */
export function toSequenceContent(rows: readonly SequenceDraft[]): SequenceContent {
  const items = []

  for (const row of rows) {
    const { text, blanks } = parseMarkedSentence(row.markedText)
    if (!text || blanks.length === 0) continue
    items.push({ id: row.id, text, blanks })
  }

  return { items }
}

export function toMcqContent(rows: readonly McqDraft[]): McqContent {
  const items: McqItem[] = []

  for (const row of rows) {
    const question = row.question.trim()
    if (!question) continue

    // Dropping blank options shifts positions, so track where the correct one lands.
    let correctIndex = 0
    const options: string[] = []
    row.options.forEach((option, index) => {
      const value = option.trim()
      if (!value) return
      if (index === row.correctIndex) correctIndex = options.length
      options.push(value)
    })

    if (options.length < 2) continue
    items.push({ id: row.id, question, options, correct_index: correctIndex })
  }

  return { items }
}

/** Moves a row one step up or down. Returns the same array if it cannot move. */
export function moveRow<T>(rows: readonly T[], from: number, direction: -1 | 1): T[] {
  const to = from + direction
  if (to < 0 || to >= rows.length) return [...rows]
  const next = [...rows]
  const a = next[from]
  const b = next[to]
  if (a === undefined || b === undefined) return next
  next[from] = b
  next[to] = a
  return next
}

export function emptyGroupDraft(): GroupDraft {
  return { id: makeId(), name: '', itemsText: '' }
}

export function groupDraftsFrom(content: GroupsContent): GroupDraft[] {
  return content.groups.map((group) => ({
    id: makeId(),
    name: group.name,
    itemsText: group.items.join('\n'),
  }))
}

export function groupsToDrafts(groups: Group[]): GroupDraft[] {
  return groups.map((group) => ({
    id: makeId(),
    name: group.name,
    itemsText: group.items.join('\n'),
  }))
}

/**
 * A group's name is its identity downstream: `group-sort` uses it as the
 * dnd-kit droppable id and `/print` as a React key, so two rows sharing a name
 * would collide there and be scored as one group. They are merged here instead
 * — dropping the second row would silently lose items the teacher typed.
 */
export function toGroupsContent(rows: readonly GroupDraft[]): GroupsContent {
  const merged = new Map<string, string[]>()

  for (const row of rows) {
    const name = row.name.trim()
    if (name.length === 0) continue

    const items = row.itemsText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (items.length === 0) continue

    const existing = merged.get(name)
    if (existing) existing.push(...items)
    else merged.set(name, items)
  }

  return { groups: [...merged].map(([name, items]) => ({ name, items })) }
}
