import assert from 'node:assert/strict'
import { test } from 'node:test'

import { moveRow, toMcqContent, toPairsContent } from '@/lib/drafts'
import { parseMcqPaste, parsePairsPaste, splitColumns } from '@/lib/parse'
import { mcqContentSchema, pairsContentSchema, countItems } from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'

// ── bulk paste ────────────────────────────────────────────────────────────────

test('pairs paste splits Excel tab-separated columns', () => {
  const { items, skipped } = parsePairsPaste('olma\tapple\nkitob\tbook\n')
  assert.equal(items.length, 2)
  assert.equal(skipped, 0)
  assert.equal(items[0]?.term, 'olma')
  assert.equal(items[0]?.definition, 'apple')
})

test('pairs paste falls back to hand-typed separators', () => {
  const { items } = parsePairsPaste('suv - water\nnon; bread\nyer, earth')
  assert.deepEqual(
    items.map((item) => [item.term, item.definition]),
    [
      ['suv', 'water'],
      ['non', 'bread'],
      ['yer', 'earth'],
    ],
  )
})

test('pairs paste reports lines that have only one column', () => {
  const { items, skipped } = parsePairsPaste('olma\tapple\njustoneword\n\nkitob\tbook')
  assert.equal(items.length, 2)
  assert.equal(skipped, 1, 'the blank line is ignored, the single-column line is skipped')
})

test('pairs paste output validates against the stored schema', () => {
  const { items } = parsePairsPaste('olma\tapple')
  assert.ok(pairsContentSchema.safeParse({ items }).success)
})

test('mcq paste treats the first answer column as correct', () => {
  const { items } = parseMcqPaste('2+2?\t4\t3\t5')
  const item = items[0]
  assert.ok(item)
  assert.equal(item.question, '2+2?')
  assert.deepEqual(item.options, ['4', '3', '5'])
  assert.equal(item.correct_index, 0)
  assert.ok(mcqContentSchema.safeParse({ items }).success)
})

test('mcq paste skips a line with fewer than two options', () => {
  const { items, skipped } = parseMcqPaste('2+2?\t4\nbad line only\n3+3?\t6\t5')
  assert.equal(items.length, 1)
  assert.equal(skipped, 2)
})

test('splitColumns prefers tabs over other separators', () => {
  assert.deepEqual(splitColumns('a, b\tc, d'), ['a, b', 'c, d'])
})

// ── draft -> content ──────────────────────────────────────────────────────────

test('incomplete pair rows are dropped, not saved', () => {
  const content = toPairsContent([
    { id: '1', term: 'olma', definition: 'apple' },
    { id: '2', term: '', definition: 'orphan' },
    { id: '3', term: 'kitob', definition: '' },
    { id: '4', term: '  suv  ', definition: '  water  ' },
  ])
  assert.equal(content.items.length, 2)
  assert.equal(content.items[1]?.term, 'suv', 'values are trimmed')
  assert.ok(pairsContentSchema.safeParse(content).success)
})

test('dropping a blank option keeps correct_index pointing at the same answer', () => {
  const content = toMcqContent([
    {
      id: '1',
      question: 'Capital of Uzbekistan?',
      // index 1 is blank and disappears; the correct answer shifts from 2 to 1.
      options: ['Samarqand', '', 'Toshkent', 'Buxoro'],
      correctIndex: 2,
    },
  ])
  const item = content.items[0]
  assert.ok(item)
  assert.deepEqual(item.options, ['Samarqand', 'Toshkent', 'Buxoro'])
  assert.equal(item.correct_index, 1)
  assert.equal(item.options[item.correct_index], 'Toshkent')
  assert.ok(mcqContentSchema.safeParse(content).success)
})

test('an mcq row with fewer than two real options is dropped', () => {
  const content = toMcqContent([
    { id: '1', question: 'Only one?', options: ['yes', '  '], correctIndex: 0 },
  ])
  assert.equal(content.items.length, 0)
})

test('a half-typed row never produces invalid stored content', () => {
  const content = toPairsContent([{ id: '1', term: 'o', definition: '' }])
  assert.ok(pairsContentSchema.safeParse(content).success)
  assert.equal(content.items.length, 0)
})

// ── reorder ───────────────────────────────────────────────────────────────────

test('moveRow swaps neighbours and refuses to run off either end', () => {
  const rows = ['a', 'b', 'c']
  assert.deepEqual(moveRow(rows, 1, -1), ['b', 'a', 'c'])
  assert.deepEqual(moveRow(rows, 1, 1), ['a', 'c', 'b'])
  assert.deepEqual(moveRow(rows, 0, -1), ['a', 'b', 'c'])
  assert.deepEqual(moveRow(rows, 2, 1), ['a', 'b', 'c'])
  assert.deepEqual(rows, ['a', 'b', 'c'], 'the input array is never mutated')
})

// ── shuffle ───────────────────────────────────────────────────────────────────

test('a seeded shuffle is stable and keeps every element', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8]
  const a = shuffle(input, 'seed-1')
  const b = shuffle(input, 'seed-1')
  assert.deepEqual(a, b, 'same seed gives the same order')
  assert.deepEqual([...a].sort((x, y) => x - y), input, 'nothing is lost or duplicated')
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6, 7, 8], 'the input array is never mutated')
  assert.notDeepEqual(shuffle(input, 'seed-2'), a, 'a different seed reorders')
})

// ── countItems ────────────────────────────────────────────────────────────────

test('countItems handles every schema and rejects junk', () => {
  assert.equal(countItems('pairs', { items: [{ id: '1', term: 'a', definition: 'b' }] }), 1)
  assert.equal(
    countItems('groups', { groups: [{ name: 'g', items: ['a', 'b', 'c'] }] }),
    3,
  )
  assert.equal(countItems('pairs', { nonsense: true }), 0)
})
