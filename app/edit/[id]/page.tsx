import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Editor, type EditableSchema } from '@/components/editor/Editor'
import { Header } from '@/components/layout/Header'
import { LocaleProvider } from '@/components/LocaleProvider'
import { ErrorState } from '@/components/ui/ErrorState'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { isSchemaType, parseSettings } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

function isEditable(schemaType: string): schemaType is EditableSchema {
  return schemaType === 'pairs' || schemaType === 'mcq'
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const tt = translator(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/edit/${id}`)}`)

  // Scoped to the owner explicitly: the public-read policy would otherwise let
  // anyone open the editor on someone else's public activity.
  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, schema_type, content, default_game, settings')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle()

  const notFound = (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ErrorState
        title={tt('editor.notFound')}
        body={tt('editor.notFoundBody')}
        action={
          <Link href="/dashboard" className="text-sm font-medium text-brand hover:underline">
            {tt('common.dashboard')}
          </Link>
        }
      />
    </div>
  )

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-dvh flex-col">
        <Header locale={locale} signedIn />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {!activity ||
          !isSchemaType(activity.schema_type) ||
          !isEditable(activity.schema_type) ? (
            notFound
          ) : (
            <Editor
              id={activity.id}
              schemaType={activity.schema_type}
              initialTitle={activity.title}
              initialContent={activity.content}
              initialGameId={activity.default_game}
              settings={parseSettings(activity.settings)}
            />
          )}
        </main>
      </div>
    </LocaleProvider>
  )
}
