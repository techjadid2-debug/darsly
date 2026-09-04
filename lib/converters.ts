import { makeId } from '@/lib/ids'
import { t, type Locale, type TKey } from '@/lib/i18n'
import {
  groupsContentSchema,
  mcqContentSchema,
  pairsContentSchema,
  type GroupsContent,
  type McqContent,
  type McqItem,
  type PairsContent,
  type SchemaType,
} from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'

/**
 * Schema converters — the whole of Darsly's content generation. Pure
 * TypeScript, no model call, no network, no API key: a teacher enters content
 * once and these turn it into the shape another family of games can play.
 *
 * Everything is seeded off the source item's id, so converting twice produces
 * the same activity.
 */

export const MAX_OPTIONS = 4

export type ConversionId = 'pairs-to-mcq' | 'mcq-to-pairs' | 'groups-to-mcq'

export type Conversion = {
  id: ConversionId
  from: SchemaType
  to: SchemaType
  labelKey: TKey
  hintKey: TKey
}

export const conversions: readonly Conversion[] = [
  {
    id: 'pairs-to-mcq',
    from: 'pairs',
    to: 'mcq',
    labelKey: 'convert.pairs-to-mcq',
    hintKey: 'convert.pairs-to-mcq.hint',
  },
  {
    id: 'mcq-to-pairs',
    from: 'mcq',
    to: 'pairs',
    labelKey: 'convert.mcq-to-pairs',
    hintKey: 'convert.mcq-to-pairs.hint',
  },
  {
    id: 'groups-to-mcq',
    from: 'groups',
    to: 'mcq',
    labelKey: 'convert.groups-to-mcq',
    hintKey: 'convert.groups-to-mcq.hint',
  },
]

export function conversionsFrom(schemaType: SchemaType): Conversion[] {
  return conversions.filter((conversion) => conversion.from === schemaType)
}

export type ConversionResult =
  | { ok: true; schemaType: SchemaType; content: unknown; itemCount: number }
  | { ok: false; reasonKey: TKey }

/**
 * Builds one multiple-choice question.
 *
 * Distractors are deduplicated **by value** against the correct answer, so a
 * question can never offer the right answer twice — which would make it
 * unanswerable. Fewer candidates simply means fewer options.
 */
function buildQuestion(
  id: string,
  question: string,
  correct: string,
  candidates: readonly string[],
  seed: string,
): McqItem | null {
  const distractors = [
    ...new Set(candidates.filter((candidate) => candidate !== correct)),
  ]
  if (distractors.length === 0) return null

  const picked = shuffle(distractors, `d-${seed}`).slice(0, MAX_OPTIONS - 1)
  const options = shuffle([correct, ...picked], `o-${seed}`)
  const correctIndex = options.indexOf(correct)
  if (correctIndex === -1) return null

  return { id, question, options, correct_index: correctIndex }
}

/** Each pair becomes a question; wrong options come from other pairs. */
export function pairsToMcq(content: PairsContent, locale: Locale): McqContent {
  const definitions = content.items.map((item) => item.definition)

  const items = content.items.flatMap((item) => {
    const built = buildQuestion(
      makeId(),
      t('convert.q.pairs', locale, { term: item.term }),
      item.definition,
      definitions,
      item.id,
    )
    return built ? [built] : []
  })

  return { items }
}

/** The question becomes the term, its correct answer the definition. */
export function mcqToPairs(content: McqContent): PairsContent {
  return {
    items: content.items.flatMap((item) => {
      const answer = item.options[item.correct_index]
      if (!answer) return []
      return [{ id: makeId(), term: item.question, definition: answer }]
    }),
  }
}

/** Each grouped item becomes a "which group?" question over the group names. */
export function groupsToMcq(content: GroupsContent, locale: Locale): McqContent {
  const names = content.groups.map((group) => group.name)

  const items = content.groups.flatMap((group, groupIndex) =>
    group.items.flatMap((label, itemIndex) => {
      const built = buildQuestion(
        makeId(),
        t('convert.q.groups', locale, { item: label }),
        group.name,
        names,
        `${groupIndex}-${itemIndex}-${label}`,
      )
      return built ? [built] : []
    }),
  )

  return { items }
}

/**
 * Runs a conversion against raw jsonb, validating both the input it reads and
 * the output it produces. A conversion never mutates the source activity.
 */
export function convert(
  id: ConversionId,
  rawContent: unknown,
  locale: Locale,
): ConversionResult {
  if (id === 'pairs-to-mcq') {
    const parsed = pairsContentSchema.safeParse(rawContent)
    if (!parsed.success) return { ok: false, reasonKey: 'convert.error.failed' }
    if (parsed.data.items.length < 2) {
      return { ok: false, reasonKey: 'convert.error.tooFewPairs' }
    }
    const content = pairsToMcq(parsed.data, locale)
    if (!mcqContentSchema.safeParse(content).success || content.items.length === 0) {
      return { ok: false, reasonKey: 'convert.error.failed' }
    }
    return { ok: true, schemaType: 'mcq', content, itemCount: content.items.length }
  }

  if (id === 'mcq-to-pairs') {
    const parsed = mcqContentSchema.safeParse(rawContent)
    if (!parsed.success) return { ok: false, reasonKey: 'convert.error.failed' }
    if (parsed.data.items.length < 2) {
      return { ok: false, reasonKey: 'convert.error.tooFewItems' }
    }
    const content = mcqToPairs(parsed.data)
    if (!pairsContentSchema.safeParse(content).success || content.items.length === 0) {
      return { ok: false, reasonKey: 'convert.error.failed' }
    }
    return { ok: true, schemaType: 'pairs', content, itemCount: content.items.length }
  }

  const parsed = groupsContentSchema.safeParse(rawContent)
  if (!parsed.success) return { ok: false, reasonKey: 'convert.error.failed' }
  if (parsed.data.groups.length < 2) {
    return { ok: false, reasonKey: 'convert.error.tooFewGroups' }
  }
  const content = groupsToMcq(parsed.data, locale)
  if (!mcqContentSchema.safeParse(content).success || content.items.length === 0) {
    return { ok: false, reasonKey: 'convert.error.failed' }
  }
  return { ok: true, schemaType: 'mcq', content, itemCount: content.items.length }
}
