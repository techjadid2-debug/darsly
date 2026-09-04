import { redirect } from 'next/navigation'

import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
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

  const { data: activities, error } = await supabase
    .from('activities')
    .select('id, title, schema_type, default_game, is_public, play_count, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">
            {tt('dashboard.title')}
          </h1>
          <ButtonLink href="/create">{tt('dashboard.new')}</ButtonLink>
        </div>

        <div className="mt-6">
          {error ? (
            <ErrorState
              title={tt('dashboard.error.title')}
              body={tt('dashboard.error.body')}
            />
          ) : activities && activities.length > 0 ? (
            // M2 replaces this with the real activity grid.
            <ul className="grid gap-3 sm:grid-cols-2">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-(--radius-card) border border-border bg-surface p-4"
                >
                  <span className="font-medium text-ink">{activity.title}</span>
                </li>
              ))}
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
