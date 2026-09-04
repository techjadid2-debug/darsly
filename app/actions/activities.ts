'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { defaultGameFor, getGame } from '@/lib/games'
import {
  contentSchemas,
  emptyContent,
  isSchemaType,
  parseSettings,
  type SchemaType,
} from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

export type SaveState = { ok: true; savedAt: number } | { ok: false; reason: string }

/** Creates an empty activity of the given schema and opens the editor on it. */
export async function createActivity(formData: FormData): Promise<void> {
  const raw = formData.get('schemaType')
  if (typeof raw !== 'string' || !isSchemaType(raw)) {
    redirect('/create?error=schema')
  }
  const schemaType: SchemaType = raw

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent('/create')}`)

  const game = defaultGameFor(schemaType)
  if (!game) redirect('/create?error=schema')

  const { data, error } = await supabase
    .from('activities')
    .insert({
      owner_id: user.id,
      schema_type: schemaType,
      content: emptyContent(schemaType) as never,
      default_game: game.id,
      title: '',
    })
    .select('id')
    .single()

  if (error || !data) redirect('/create?error=create')

  revalidatePath('/dashboard')
  redirect(`/edit/${data.id}`)
}

/**
 * Autosave target. Content is validated against the activity's own
 * `schema_type`, read back from the database rather than trusted from the
 * client, so a bad payload can never be stored.
 */
export async function saveActivity(input: {
  id: string
  title: string
  content: unknown
  defaultGame: string
  settings?: unknown
}): Promise<SaveState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, reason: 'not-authenticated' }

  // Scoped to the owner. RLS also lets anyone read a public activity, so an
  // id-only lookup would succeed for someone else's activity and the update
  // below would then silently match zero rows while reporting success.
  const { data: existing, error: readError } = await supabase
    .from('activities')
    .select('schema_type, settings')
    .eq('id', input.id)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (readError || !existing) return { ok: false, reason: 'not-found' }
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

  // `.select()` makes the update report which rows it actually touched, so a
  // write blocked by RLS is reported as a failure instead of a silent success.
  const { data: written, error: writeError } = await supabase
    .from('activities')
    .update({
      title: input.title.slice(0, 200),
      content: parsedContent.data as never,
      default_game: defaultGame,
      settings: settings as never,
    })
    .eq('id', input.id)
    .eq('owner_id', user.id)
    .select('id')

  if (writeError || !written || written.length === 0) {
    return { ok: false, reason: 'write-failed' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/play/${input.id}`)
  return { ok: true, savedAt: Date.now() }
}

export async function deleteActivity(formData: FormData): Promise<void> {
  const id = formData.get('id')
  if (typeof id !== 'string') return

  const supabase = await createClient()
  await supabase.from('activities').delete().eq('id', id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
