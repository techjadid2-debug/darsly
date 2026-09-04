import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { gameLabel, getGame } from '@/lib/games'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { countItems, isSchemaType } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const locale = await getLocale()
  const tt = translator(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware already guards this route; this is the defence in depth.
  if (!user) redirect('/login?next=/dashboard')

  // Scoped to the owner explicitly. RLS alone is not enough here: the
  // public-read policy is OR'd with the owner policy, so an unscoped select
  // would list every other teacher's public activity as if it were yours.
  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, title, schema_type, content, default_game, is_public, play_count, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">{tt('dashboard.title')}</h1>
          <ButtonLink href="/create">{tt('dashboard.new')}</ButtonLink>
        </div>

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

                    <div className="mt-auto flex gap-3 text-sm font-medium">
                      <Link href={`/edit/${activity.id}`} className="text-brand hover:underline">
                        {tt('dashboard.edit')}
                      </Link>
                      <Link
                        href={`/play/${activity.id}`}
                        className="text-ink-soft hover:text-ink hover:underline"
                      >
                        {tt('dashboard.play')}
                      </Link>
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
