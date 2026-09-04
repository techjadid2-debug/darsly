import assert from 'node:assert/strict'
import { test } from 'node:test'

import { convert, groupsToMcq, mcqToPairs, pairsToMcq } from '@/lib/converters'
import {
  groupsContentSchema,
  mcqContentSchema,
  pairsContentSchema,
  type PairsContent,
} from '@/lib/schemas'

const fourPairs: PairsContent = {
  items: [
    { id: 'p1', term: 'olma', definition: 'apple' },
    { id: 'p2', term: 'kitob', definition: 'book' },
    { id: 'p3', term: 'suv', definition: 'water' },
    { id: 'p4', term: 'non', definition: 'bread' },
  ],
}

// ── pairs -> mcq ──────────────────────────────────────────────────────────────

test('four pairs give four unique options per question, with the right answer marked', () => {
  const result = pairsToMcq(fourPairs, 'uz')
  assert.ok(mcqContentSchema.safeParse(result).success)
  assert.equal(result.items.length, 4)

  for (const [index, item] of result.items.entries()) {
    const source = fourPairs.items[index]
    assert.ok(source)
    assert.equal(item.options.length, 4, 'four options')
    assert.equal(new Set(item.options).size, 4, 'no option is repeated')
    assert.equal(
      item.options[item.correct_index],
      source.definition,
      'correct_index points at this pair’s own definition',
    )
    assert.ok(item.question.includes(source.term), 'the term appears in the question')
  }
})

test('the correct answer is not always in the same slot', () => {
  const positions = new Set(
    pairsToMcq(fourPairs, 'uz').items.map((item) => item.correct_index),
  )
  assert.ok(positions.size > 1, 'answers land in more than one position')
})

test('converting the same content twice is deterministic', () => {
  const a = pairsToMcq(fourPairs, 'uz')
  const b = pairsToMcq(fourPairs, 'uz')
  assert.deepEqual(
    a.items.map((item) => [item.question, item.options, item.correct_index]),
    b.items.map((item) => [item.question, item.options, item.correct_index]),
  )
})

test('two pairs still convert, with two options', () => {
  const result = pairsToMcq({ items: fourPairs.items.slice(0, 2) }, 'uz')
  assert.ok(mcqContentSchema.safeParse(result).success)
  assert.equal(result.items.length, 2)
  for (const item of result.items) assert.equal(item.options.length, 2)
})

test('a repeated definition never appears twice in one question', () => {
  // "apple" is the answer for two different terms.
  const withDuplicate: PairsContent = {
    items: [
      { id: 'a', term: 'olma', definition: 'apple' },
      { id: 'b', term: 'olma daraxti', definition: 'apple' },
      { id: 'c', term: 'suv', definition: 'water' },
      { id: 'd', term: 'non', definition: 'bread' },
    ],
  }
  const result = pairsToMcq(withDuplicate, 'uz')
  for (const item of result.items) {
    assert.equal(
      new Set(item.options).size,
      item.options.length,
      'the duplicate definition is not offered alongside itself',
    )
    assert.ok(item.options[item.correct_index])
  }
})

test('the question text follows the requested locale', () => {
  const uz = pairsToMcq(fourPairs, 'uz').items[0]
  const ru = pairsToMcq(fourPairs, 'ru').items[0]
  assert.ok(uz && ru)
  assert.notEqual(uz.question, ru.question)
})

// ── mcq -> pairs ──────────────────────────────────────────────────────────────

test('mcq becomes pairs of question and correct answer', () => {
  const source = pairsToMcq(fourPairs, 'uz')
  const back = mcqToPairs(source)
  assert.ok(pairsContentSchema.safeParse(back).success)
  assert.equal(back.items.length, 4)

  const first = back.items[0]
  const firstSource = source.items[0]
  assert.ok(first && firstSource)
  assert.equal(first.term, firstSource.question)
  assert.equal(first.definition, firstSource.options[firstSource.correct_index])
})

// ── groups -> mcq ─────────────────────────────────────────────────────────────

test('every grouped item becomes a question over the group names', () => {
  const groups = {
    groups: [
      { name: 'Mevalar', items: ['olma', 'anor'] },
      { name: 'Sabzavotlar', items: ['sabzi'] },
      { name: 'Donlar', items: ['bug‘doy'] },
    ],
  }
  assert.ok(groupsContentSchema.safeParse(groups).success)

  const result = groupsToMcq(groups, 'uz')
  assert.ok(mcqContentSchema.safeParse(result).success)
  assert.equal(result.items.length, 4, 'one question per item, not per group')

  const olma = result.items.find((item) => item.question.includes('olma'))
  assert.ok(olma)
  assert.equal(olma.options[olma.correct_index], 'Mevalar')
  assert.equal(olma.options.length, 3, 'all three group names are offered')
})

// ── convert() guards ──────────────────────────────────────────────────────────

test('convert refuses content that is too small to make a fair question', () => {
  const one = { items: [{ id: 'a', term: 'olma', definition: 'apple' }] }
  assert.deepEqual(convert('pairs-to-mcq', one, 'uz'), {
    ok: false,
    reasonKey: 'convert.error.tooFewPairs',
  })

  assert.deepEqual(
    convert('groups-to-mcq', { groups: [{ name: 'A', items: ['x'] }] }, 'uz'),
    { ok: false, reasonKey: 'convert.error.tooFewGroups' },
  )

  assert.deepEqual(convert('pairs-to-mcq', { junk: true }, 'uz'), {
    ok: false,
    reasonKey: 'convert.error.failed',
  })
})

test('convert reports the produced schema and item count', () => {
  const result = convert('pairs-to-mcq', fourPairs, 'uz')
  assert.ok(result.ok)
  assert.equal(result.schemaType, 'mcq')
  assert.equal(result.itemCount, 4)
  assert.ok(mcqContentSchema.safeParse(result.content).success)
})
