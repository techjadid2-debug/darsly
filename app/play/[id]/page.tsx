import Script from 'next/script'

import Link from 'next/link'

import { LocaleProvider } from '@/components/LocaleProvider'
import { GameShell } from '@/components/player/GameShell'
import { PlayCounter } from '@/components/player/PlayCounter'
import { ErrorState } from '@/components/ui/ErrorState'
import { gameLabel, gamesForSchema, resolveGame } from '@/lib/games'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { isSchemaType, parseSettings } from '@/lib/schemas'
import { getActivityById } from '@/lib/db'

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ game?: string }>
}) {
  const { id } = await params
  const { game: requestedGame } = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)

  const activity = await getActivityById(id)

  if (!activity || !isSchemaType(activity.schema_type)) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <ErrorState title={tt('play.notFound.title')} body={tt('play.notFound.body')} />
      </main>
    )
  }

  const schemaType = activity.schema_type
  const game = resolveGame(schemaType, requestedGame, activity.default_game)
  const alternatives = gamesForSchema(schemaType)

  if (!game) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <ErrorState title={tt('play.invalid.title')} body={tt('play.invalid.body')} />
      </main>
    )
  }

  return (
    <LocaleProvider locale={locale}>
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-6">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <header className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold text-ink">
            {activity.title || tt('dashboard.untitled')}
          </h1>

          {alternatives.length > 1 ? (
            <nav aria-label={tt('play.chooseGame')} className="flex flex-wrap gap-2">
              {alternatives.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/play/${activity.id}?game=${entry.id}`}
                  aria-current={entry.id === game.id ? 'page' : undefined}
                  className={[
                    'flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm',
                    entry.id === game.id
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-border bg-surface text-ink-soft hover:text-ink',
                  ].join(' ')}
                >
                  <span aria-hidden>{entry.icon}</span>
                  {gameLabel(entry, locale)}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>

        <GameShell
          game={game}
          rawContent={activity.content}
          settings={parseSettings(activity.settings)}
          activityId={activity.id}
        />

        {activity.is_public ? <PlayCounter activityId={activity.id} /> : null}
      </main>
    </LocaleProvider>
  )
}
