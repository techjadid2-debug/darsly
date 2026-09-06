import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DeleteActivityButton } from '@/components/dashboard/DeleteActivityButton'
import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { gameLabel, getGame } from '@/lib/games'
import { t, translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { countItems, isSchemaType } from '@/lib/schemas'
import { getTeacherSession } from '@/lib/auth/session'
import { getAllActivities } from '@/lib/db'

export async function generateMetadata() {
  return { title: t('dashboard.title', await getLocale()) }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const pageError = (await searchParams).error
  const locale = await getLocale()
  const tt = translator(locale)

  const signedIn = await getTeacherSession()
  if (!signedIn) redirect('/login?next=/dashboard')

  let activities = null
  let error = null
  try {
    activities = await getAllActivities()
  } catch (err) {
    console.error('Error fetching activities:', err)
    error = err
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">{tt('dashboard.title')}</h1>
          <ButtonLink href="/create">{tt('dashboard.new')}</ButtonLink>
        </div>

        {pageError === 'delete' ? (
          <div className="mt-6">
            <ErrorState
              title={tt('dashboard.delete.failed.title')}
              body={tt('dashboard.delete.failed.body')}
            />
          </div>
        ) : null}

        <div className="mt-6">
          {error ? (
            <ErrorState
              title={tt('dashboard.error.title')}
              body={tt('dashboard.error.body')}
            />
          ) : activities && activities.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {activities.map((activity) => {
                const game = getGame(activity.default_game)
                const count = isSchemaType(activity.schema_type)
                  ? countItems(activity.schema_type, activity.content)
                  : 0

                return (
                  <li
                    key={activity.id}
                    className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-4"
                  >
                    <div>
                      <h2 className="font-medium text-ink">
                        {activity.title || tt('dashboard.untitled')}
                      </h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        {game ? `${game.icon} ${gameLabel(game, locale)} · ` : ''}
                        {tt('dashboard.itemCount', { n: count })}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-3 text-sm font-medium">
                      <Link href={`/edit/${activity.id}`} className="text-brand hover:underline">
                        {tt('dashboard.edit')}
                      </Link>
                      <Link
                        href={`/play/${activity.id}`}
                        className="text-ink-soft hover:text-ink hover:underline"
                      >
                        {tt('dashboard.play')}
                      </Link>
                      <DeleteActivityButton
                        id={activity.id}
                        labels={{
                          delete: tt('dashboard.delete'),
                          confirm: tt('dashboard.delete.confirm', {
                            title: activity.title || tt('dashboard.untitled'),
                          }),
                          yes: tt('dashboard.delete.yes'),
                          cancel: tt('common.cancel'),
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title={tt('dashboard.empty.title')}
              body={tt('dashboard.empty.body')}
              action={
                <ButtonLink href="/create" size="lg">
                  {tt('dashboard.empty.cta')}
                </ButtonLink>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}
