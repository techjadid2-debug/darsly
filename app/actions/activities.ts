'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { conversions, convert, type ConversionId } from '@/lib/converters'
import { defaultGameFor, getGame } from '@/lib/games'
import { isLocale, t, defaultLocale } from '@/lib/i18n'
import { isGrade, isSubject } from '@/lib/taxonomy'
import {
  contentSchemas,
  emptyContent,
  isSchemaType,
  parseSettings,
  type SchemaType,
} from '@/lib/schemas'
import { getTeacherSession } from '@/lib/auth/session'
import {
  createActivityRecord,
  deleteActivityRecord,
  getActivityById,
  incrementPlayCountRecord,
  updateActivityRecord,
  getSql,
} from '@/lib/db'

export type SaveState = { ok: true; savedAt: number } | { ok: false; reason: string }

/** Creates an empty activity of the given schema and opens the editor on it. */
export async function createActivity(formData: FormData): Promise<void> {
  const raw = formData.get('schemaType')
  if (typeof raw !== 'string' || !isSchemaType(raw)) {
    redirect('/create?error=schema')
  }
  const schemaType: SchemaType = raw

  const signedIn = await getTeacherSession()
  if (!signedIn) redirect(`/login?next=${encodeURIComponent('/create')}`)

  const game = defaultGameFor(schemaType)
  if (!game) redirect('/create?error=schema')

  let newId: string
  try {
    newId = await createActivityRecord({
      schema_type: schemaType,
      content: emptyContent(schemaType),
      default_game: game.id,
      title: '',
    })
  } catch (err) {
    console.error('Failed to create activity:', err)
    redirect('/create?error=create')
  }

  revalidatePath('/dashboard')
  redirect(`/edit/${newId}`)
}

/**
 * Autosave target. Content is validated against the activity's own
 * `schema_type`, read back from the database.
 */
export async function saveActivity(input: {
  id: string
  title: string
  content: unknown
  defaultGame: string
  settings?: unknown
  subject?: string | null
  grade?: string | null
  isPublic?: boolean
}): Promise<SaveState> {
  const signedIn = await getTeacherSession()
  if (!signedIn) return { ok: false, reason: 'not-authenticated' }

  let existing
  try {
    existing = await getActivityById(input.id)
  } catch (err) {
    console.error('Failed to read activity for save:', err)
    return { ok: false, reason: 'read-failed' }
  }

  if (!existing) return { ok: false, reason: 'not-found' }
  if (!isSchemaType(existing.schema_type)) return { ok: false, reason: 'bad-schema' }

  const parsedContent = contentSchemas[existing.schema_type].safeParse(input.content)
  if (!parsedContent.success) return { ok: false, reason: 'invalid-content' }

  const game = getGame(input.defaultGame)
  const defaultGame =
    game && game.schemaType === existing.schema_type
      ? game.id
      : (defaultGameFor(existing.schema_type)?.id ?? input.defaultGame)

  const settings = parseSettings(
    input.settings === undefined ? existing.settings : input.settings,
  )

  const subject =
    input.subject === undefined
      ? existing.subject
      : isSubject(input.subject)
        ? input.subject
        : null
  const grade =
    input.grade === undefined
      ? existing.grade
      : isGrade(input.grade)
        ? input.grade
        : null
  const isPublic = input.isPublic === undefined ? existing.is_public : input.isPublic

  try {
    const updated = await updateActivityRecord(input.id, {
      title: input.title.slice(0, 200),
      content: parsedContent.data,
      default_game: defaultGame,
      settings,
      subject,
      grade,
      is_public: isPublic,
    })

    if (!updated) {
      return { ok: false, reason: 'write-failed' }
    }
  } catch (err) {
    console.error('Failed to update activity:', err)
    return { ok: false, reason: 'write-failed' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/play/${input.id}`)
  return { ok: true, savedAt: Date.now() }
}

/**
 * Deletes one activity by ID.
 */
export async function deleteActivity(formData: FormData): Promise<void> {
  const id = formData.get('id')
  if (typeof id !== 'string') redirect('/dashboard?error=delete')

  const signedIn = await getTeacherSession()
  if (!signedIn) redirect(`/login?next=${encodeURIComponent('/dashboard')}`)

  try {
    const deleted = await deleteActivityRecord(id)
    if (!deleted) redirect('/dashboard?error=delete')
  } catch (err) {
    console.error('Failed to delete activity:', err)
    redirect('/dashboard?error=delete')
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

/**
 * Runs a schema conversion and saves the result as a new activity.
 */
export async function createFromConversion(formData: FormData): Promise<void> {
  const sourceId = formData.get('sourceId')
  const rawConversion = formData.get('conversionId')
  const rawLocale = formData.get('locale')

  if (typeof sourceId !== 'string' || typeof rawConversion !== 'string') {
    redirect('/dashboard')
  }

  const conversion = conversions.find((entry) => entry.id === rawConversion)
  if (!conversion) redirect(`/edit/${sourceId}?error=convert`)
  const conversionId: ConversionId = conversion.id

  const locale =
    typeof rawLocale === 'string' && isLocale(rawLocale) ? rawLocale : defaultLocale

  const signedIn = await getTeacherSession()
  if (!signedIn) redirect(`/login?next=${encodeURIComponent(`/edit/${sourceId}`)}`)

  const source = await getActivityById(sourceId)
  if (!source) redirect(`/edit/${sourceId}?error=convert`)

  const result = convert(conversionId, source.content, locale)
  if (!result.ok) redirect(`/edit/${sourceId}?error=convert`)

  const game = defaultGameFor(result.schemaType)
  if (!game) redirect(`/edit/${sourceId}?error=convert`)

  const suffix = t(conversion.labelKey, locale)
  const baseTitle = source.title.trim()

  const sql = getSql()
  const rows = await sql`
    INSERT INTO activities (
      schema_type, content, default_game, title, subject, grade, lang, settings
    )
    VALUES (
      ${result.schemaType},
      ${JSON.stringify(result.content)},
      ${game.id},
      ${baseTitle ? `${baseTitle} — ${suffix}` : suffix},
      ${source.subject},
      ${source.grade},
      ${source.lang},
      ${JSON.stringify(source.settings)}
    )
    RETURNING id
  `

  const createdId = rows[0]?.id as string
  if (!createdId) redirect(`/edit/${sourceId}?error=convert`)

  revalidatePath('/dashboard')
  redirect(`/edit/${createdId}`)
}

/** Bumps the public play counter. */
export async function recordPlay(activityId: string): Promise<void> {
  try {
    await incrementPlayCountRecord(activityId)
  } catch (err) {
    console.error('Failed to increment play count:', err)
  }
}
