import Link from 'next/link'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { gameLabel, games, getGame } from '@/lib/games'
import { t, translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { countItems, isSchemaType } from '@/lib/schemas'
import { getTeacherSession } from '@/lib/auth/session'
import { getPublicActivities } from '@/lib/db'
import { grades, isGrade, isSubject, subjectKeys, subjects } from '@/lib/taxonomy'

const PAGE_SIZE = 60

export async function generateMetadata() {
  return { title: t('library.title', await getLocale()) }
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; grade?: string; game?: string }>
}) {
  const params = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)

  const signedIn = await getTeacherSession()

  const subject = isSubject(params.subject) ? params.subject : undefined
  const grade = isGrade(params.grade) ? params.grade : undefined
  const selectedGame = getGame(params.game)
  const search = params.q?.trim() ?? ''

  let activities = null
  let error = null

  try {
    activities = await getPublicActivities({
      subject,
      grade,
      schemaType: selectedGame?.schemaType,
      search: search || null,
      limit: PAGE_SIZE,
    })
  } catch (err) {
    console.error('Failed to load public activities:', err)
    error = err
  }

  const field =
    'h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink'

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn={signedIn} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold text-ink">{tt('library.title')}</h1>
        <p className="mt-2 text-sm text-ink-soft">{tt('library.subtitle')}</p>

        {/* A plain GET form: filters survive sharing the URL and work without JS. */}
        <form method="get" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="sr-only">
              {tt('library.search')}
            </label>
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder={tt('library.searchPlaceholder')}
              className={field}
            />
          </div>

          <select name="subject" defaultValue={subject ?? ''} className={field}
            aria-label={tt('editor.subject')}>
            <option value="">{tt('editor.subject')} — {tt('library.filter.all')}</option>
            {subjects.map((value) => (
              <option key={value} value={value}>
                {tt(subjectKeys[value])}
              </option>
            ))}
          </select>

          <select name="grade" defaultValue={grade ?? ''} className={field}
            aria-label={tt('editor.grade')}>
            <option value="">{tt('editor.grade')} — {tt('library.filter.all')}</option>
            {grades.map((value) => (
              <option key={value} value={value}>
                {tt('grade.value', { n: value })}
              </option>
            ))}
          </select>

          <select name="game" defaultValue={selectedGame?.id ?? ''} className={field}
            aria-label={tt('library.filter.game')}>
            <option value="">
              {tt('library.filter.game')} — {tt('library.filter.all')}
            </option>
            {games.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {gameLabel(entry, locale)}
              </option>
            ))}
          </select>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {tt('library.apply')}
            </button>
            <Link
              href="/library"
              className="flex h-11 items-center rounded-xl border border-border px-4 text-sm text-ink-soft hover:text-ink"
            >
              {tt('library.reset')}
            </Link>
          </div>
        </form>

        <div className="mt-7">
          {error ? (
            <ErrorState
              title={tt('dashboard.error.title')}
              body={tt('dashboard.error.body')}
            />
          ) : activities && activities.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => {
                const game = getGame(activity.default_game)
                const count = isSchemaType(activity.schema_type)
                  ? countItems(activity.schema_type, activity.content)
                  : 0

                return (
                  <li
                    key={activity.id}
                    className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-4"
                  >
                    <h2 className="font-medium text-ink">
                      {activity.title || tt('dashboard.untitled')}
                    </h2>

                    <p className="text-sm text-ink-soft">
                      {game ? `${game.icon} ${gameLabel(game, locale)} · ` : ''}
                      {tt('dashboard.itemCount', { n: count })}
                    </p>

                    <p className="flex flex-wrap gap-1.5 text-xs text-ink-soft">
                      {isSubject(activity.subject) ? (
                        <span className="rounded-full border border-border px-2 py-0.5">
                          {tt(subjectKeys[activity.subject])}
                        </span>
                      ) : null}
                      {isGrade(activity.grade) ? (
                        <span className="rounded-full border border-border px-2 py-0.5">
                          {tt('grade.value', { n: activity.grade })}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {tt('library.playCount', { n: activity.play_count })}
                      </span>
                    </p>

                    <Link
                      href={`/play/${activity.id}`}
                      className="mt-auto pt-1 text-sm font-medium text-brand hover:underline"
                    >
                      {tt('library.open')} →
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title={tt('library.empty.title')}
              body={tt('library.empty.body')}
            />
          )}
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
