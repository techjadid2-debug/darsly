import { z } from 'zod'

/**
 * The four content schemas. Content is stored as jsonb and is deliberately
 * separate from presentation: any game whose `schemaType` matches an activity's
 * `schema_type` can render it, so switching games never means re-entering data.
 *
 * Every game component receives content that has been parsed by one of these
 * schemas — never raw jsonb.
 */

export const schemaTypes = ['pairs', 'mcq', 'groups', 'sequence'] as const
export type SchemaType = (typeof schemaTypes)[number]

export function isSchemaType(value: string): value is SchemaType {
  return (schemaTypes as readonly string[]).includes(value)
}

// ─── PAIRS ────────────────────────────────────────────────────────────────────

export const pairItemSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  image_url: z.url().optional(),
})

export const pairsContentSchema = z.object({
  items: z.array(pairItemSchema),
})

// ─── MCQ ──────────────────────────────────────────────────────────────────────

export const mcqItemSchema = z
  .object({
    id: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correct_index: z.number().int().min(0),
  })
  .refine((item) => item.correct_index < item.options.length, {
    message: 'correct_index must point at one of the options',
    path: ['correct_index'],
  })

export const mcqContentSchema = z.object({
  items: z.array(mcqItemSchema),
})

// ─── GROUPS ───────────────────────────────────────────────────────────────────

export const groupSchema = z.object({
  name: z.string().min(1),
  items: z.array(z.string().min(1)),
})

export const groupsContentSchema = z.object({
  groups: z.array(groupSchema),
})

// ─── SEQUENCE ─────────────────────────────────────────────────────────────────

export const sequenceItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  blanks: z.array(z.number().int().min(0)),
})

export const sequenceContentSchema = z.object({
  items: z.array(sequenceItemSchema),
})

// ─── inferred types ───────────────────────────────────────────────────────────

export type PairItem = z.infer<typeof pairItemSchema>
export type McqItem = z.infer<typeof mcqItemSchema>
export type Group = z.infer<typeof groupSchema>
export type SequenceItem = z.infer<typeof sequenceItemSchema>

export type PairsContent = z.infer<typeof pairsContentSchema>
export type McqContent = z.infer<typeof mcqContentSchema>
export type GroupsContent = z.infer<typeof groupsContentSchema>
export type SequenceContent = z.infer<typeof sequenceContentSchema>

/** Maps a schema type to the content shape a game of that type receives. */
export type ContentOf<S extends SchemaType> = S extends 'pairs'
  ? PairsContent
  : S extends 'mcq'
    ? McqContent
    : S extends 'groups'
      ? GroupsContent
      : SequenceContent

export const contentSchemas = {
  pairs: pairsContentSchema,
  mcq: mcqContentSchema,
  groups: groupsContentSchema,
  sequence: sequenceContentSchema,
} as const

/** An empty, valid document for each schema — what a new activity starts as. */
export function emptyContent(schemaType: SchemaType): unknown {
  return schemaType === 'groups' ? { groups: [] } : { items: [] }
}

/** How many playable items a content document holds, whatever its shape. */
export function countItems(schemaType: SchemaType, content: unknown): number {
  const parsed = contentSchemas[schemaType].safeParse(content)
  if (!parsed.success) return 0
  const data = parsed.data
  return 'groups' in data
    ? data.groups.reduce((total, group) => total + group.items.length, 0)
    : data.items.length
}

// ─── settings ─────────────────────────────────────────────────────────────────

export const themes = ['default', 'warm', 'cool'] as const

export const activitySettingsSchema = z.object({
  /** Countdown in seconds for the whole game. 0 means no timer. */
  timer: z.number().int().min(0).max(3600).default(0),
  shuffle: z.boolean().default(true),
  show_answers: z.boolean().default(true),
  theme: z.enum(themes).default('default'),
})

export type ActivitySettings = z.infer<typeof activitySettingsSchema>

/** Settings come out of jsonb, so anything missing falls back to the default. */
export function parseSettings(raw: unknown): ActivitySettings {
  const parsed = activitySettingsSchema.safeParse(raw)
  return parsed.success ? parsed.data : activitySettingsSchema.parse({})
}
