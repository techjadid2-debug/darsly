import { parseMarkedSentence } from '@/lib/drafts'
import { makeId } from '@/lib/ids'
import type { Group, McqItem, PairItem, SequenceItem } from '@/lib/schemas'

/**
 * Import plumbing shared by bulk paste and file upload.
 *
 * Both paths reduce to `string[][]` — rows of cells — and then to content by
 * the `rowsTo*` functions below, so pasting from Excel and uploading the same
 * spreadsheet produce identical results.
 */

const SEPARATORS = ['\t', ';', ' — ', ' – ', ' - ', ','] as const

/** Splits one line into cells using the first separator that appears in it. */
export function splitColumns(line: string): string[] {
  const separator = SEPARATORS.find((candidate) => line.includes(candidate))
  if (!separator) return [line.trim()]
  return line
    .split(separator)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
}

/** Pasted text to rows of cells. */
export function textToRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitColumns)
}

/** Cleans cells coming out of a CSV or spreadsheet reader. */
export function normalizeRows(rows: ReadonlyArray<ReadonlyArray<unknown>>): string[][] {
  return rows
    .map((row) =>
      row
        .map((cell) => (cell === null || cell === undefined ? '' : String(cell).trim()))
        .filter((cell) => cell.length > 0),
    )
    .filter((row) => row.length > 0)
}

export type PasteReport<T> = {
  items: T[]
  /** Rows skipped because they did not have enough cells. */
  skipped: number
}

/** `term | definition` per row. */
export function rowsToPairs(rows: string[][]): PasteReport<PairItem> {
  const items: PairItem[] = []
  let skipped = 0

  for (const row of rows) {
    const term = row[0]
    const definition = row[1]
    if (!term || !definition) {
      skipped += 1
      continue
    }
    items.push({ id: makeId(), term, definition })
  }

  return { items, skipped }
}

/**
 * `question | correct answer | wrong | wrong …` per row.
 * The first answer cell is the correct one; it is shuffled into place when the
 * question is played, so its position here does not leak.
 */
export function rowsToMcq(rows: string[][]): PasteReport<McqItem> {
  const items: McqItem[] = []
  let skipped = 0

  for (const row of rows) {
    const question = row[0]
    const options = row.slice(1)
    if (!question || options.length < 2) {
      skipped += 1
      continue
    }
    items.push({ id: makeId(), question, options, correct_index: 0 })
  }

  return { items, skipped }
}

/**
 * `group name | item | item …` per row. A group name appearing on more than
 * one row has its items merged, so a teacher can paste or upload in batches.
 */
export function rowsToGroups(rows: string[][]): PasteReport<Group> {
  const byName = new Map<string, string[]>()
  let skipped = 0

  for (const row of rows) {
    const name = row[0]
    const items = row.slice(1)
    if (!name || items.length === 0) {
      skipped += 1
      continue
    }
    const existing = byName.get(name)
    if (existing) existing.push(...items)
    else byName.set(name, [...items])
  }

  return {
    items: [...byName.entries()].map(([name, items]) => ({ name, items })),
    skipped,
  }
}

/**
 * Sequence content is one sentence per line, not columns — a sentence has
 * commas and tabs in it, so splitting it would mangle the text. The whole row
 * is rejoined and the brackets carry the blanks.
 */
export function rowsToSequence(rows: string[][]): PasteReport<SequenceItem> {
  const items: SequenceItem[] = []
  let skipped = 0

  rows.forEach((row, index) => {
    const { text, blanks } = parseMarkedSentence(row.join(' '))
    if (!text || blanks.length === 0) {
      skipped += 1
      return
    }
    items.push({ id: `seq-${index}`, text, blanks })
  })

  return { items, skipped }
}

export const parsePairsPaste = (text: string) => rowsToPairs(textToRows(text))
export const parseMcqPaste = (text: string) => rowsToMcq(textToRows(text))
export const parseGroupsPaste = (text: string) => rowsToGroups(textToRows(text))
export const parseSequencePaste = (text: string) => rowsToSequence(textToRows(text))
