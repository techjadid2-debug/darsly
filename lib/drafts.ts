import { makeId } from '@/lib/ids'
import type { McqContent, McqItem, PairItem, PairsContent } from '@/lib/schemas'

/**
 * Editor-side row types. Unlike the stored schemas these allow empty strings,
 * because a row is incomplete for as long as the teacher is still typing it.
 * `toPairsContent` / `toMcqContent` drop the incomplete rows, so what is
 * autosaved and previewed is always valid content.
 */

export type PairDraft = { id: string; term: string; definition: string }
export type McqDraft = {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export function emptyPairDraft(): PairDraft {
  return { id: makeId(), term: '', definition: '' }
}

export function emptyMcqDraft(): McqDraft {
  return { id: makeId(), question: '', options: ['', ''], correctIndex: 0 }
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
