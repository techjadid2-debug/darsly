import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Editor, type EditableSchema } from '@/components/editor/Editor'
import { Header } from '@/components/layout/Header'
import { LocaleProvider } from '@/components/LocaleProvider'
import { ResultsTable } from '@/components/ResultsTable'
import { ErrorState } from '@/components/ui/ErrorState'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { getSiteUrl } from '@/lib/site-url'
import { isSchemaType, parseSettings } from '@/lib/schemas'
import { getTeacherSession } from '@/lib/auth/session'
import { getActivityById, getResultsForActivity } from '@/lib/db'

function isEditable(schemaType: string): schemaType is EditableSchema {
  return schemaType === 'pairs' || schemaType === 'mcq' || schemaType === 'groups'
}

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: pageError } = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)
  const siteUrl = await getSiteUrl()

  const signedIn = await getTeacherSession()
  if (!signedIn) redirect(`/login?next=${encodeURIComponent(`/edit/${id}`)}`)

  const activity = await getActivityById(id)
  const results = activity ? await getResultsForActivity(id) : []

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
            <>
              {pageError === 'convert' ? (
                <div className="mb-4">
                  <ErrorState
                    title={tt('convert.error.failed')}
                    body={tt('helper.convert.hint')}
                  />
                </div>
              ) : null}
              <Editor
                id={activity.id}
                schemaType={activity.schema_type}
                initialTitle={activity.title}
                initialContent={activity.content}
                initialGameId={activity.default_game}
                initialSettings={parseSettings(activity.settings)}
                initialSubject={activity.subject}
                initialGrade={activity.grade}
                initialIsPublic={activity.is_public}
                siteUrl={siteUrl}
              />

              <section className="mt-10">
                <h2 className="mb-3 text-lg font-semibold text-ink">
                  {tt('results.title')}
                </h2>
                <ResultsTable rows={results ?? []} locale={locale} />
              </section>
            </>
          )}
        </main>
      </div>
    </LocaleProvider>
  )
}
