import { makeId } from '@/lib/ids'
import type { Group, McqItem, PairItem } from '@/lib/schemas'

/**
 * Bulk paste. Teachers will not type twenty rows by hand — they paste from
 * Excel, Word or a text file. Excel copies tab-separated, so tabs win; the
 * other separators are fallbacks for content typed by hand.
 */

const SEPARATORS = ['\t', ';', ' — ', ' – ', ' - ', ','] as const

/** Splits one line into columns using the first separator that appears in it. */
export function splitColumns(line: string): string[] {
  const separator = SEPARATORS.find((candidate) => line.includes(candidate))
  if (!separator) return [line.trim()]
  return line
    .split(separator)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
}

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export type PasteReport<T> = {
  items: T[]
  /** Lines that were skipped because they did not have enough columns. */
  skipped: number
}

/** `term <tab> definition` per line. */
export function parsePairsPaste(text: string): PasteReport<PairItem> {
  const items: PairItem[] = []
  let skipped = 0

  for (const line of toLines(text)) {
    const columns = splitColumns(line)
    const term = columns[0]
    const definition = columns[1]
    if (!term || !definition) {
      skipped += 1
      continue
    }
    items.push({ id: makeId(), term, definition })
  }

  return { items, skipped }
}

/**
 * `question <tab> correct answer <tab> wrong <tab> wrong …` per line.
 * The first answer column is the correct one; it is shuffled into place when
 * the question is played, so its position here does not leak.
 */
export function parseMcqPaste(text: string): PasteReport<McqItem> {
  const items: McqItem[] = []
  let skipped = 0

  for (const line of toLines(text)) {
    const columns = splitColumns(line)
    const question = columns[0]
    const options = columns.slice(1)
    if (!question || options.length < 2) {
      skipped += 1
      continue
    }
    items.push({ id: makeId(), question, options, correct_index: 0 })
  }

  return { items, skipped }
}

/**
 * `group name <tab> item <tab> item …` per line. A group name that appears on
 * more than one line has its items merged, so a teacher can paste in batches.
 */
export function parseGroupsPaste(text: string): PasteReport<Group> {
  const byName = new Map<string, string[]>()
  let skipped = 0

  for (const line of toLines(text)) {
    const columns = splitColumns(line)
    const name = columns[0]
    const items = columns.slice(1)
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
