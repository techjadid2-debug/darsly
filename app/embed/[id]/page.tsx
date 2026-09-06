import Script from 'next/script'

import { LocaleProvider } from '@/components/LocaleProvider'
import { GameShell } from '@/components/player/GameShell'
import { PlayCounter } from '@/components/player/PlayCounter'
import { ErrorState } from '@/components/ui/ErrorState'
import { resolveGame } from '@/lib/games'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { isSchemaType, parseSettings } from '@/lib/schemas'
import { getActivityById } from '@/lib/db'

/**
 * The player with no chrome, for embedding in an iframe on a school site or
 * an LMS.
 */
export default async function EmbedPage({
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
      <main className="p-4">
        <ErrorState title={tt('play.notFound.title')} body={tt('play.notFound.body')} />
      </main>
    )
  }

  const game = resolveGame(activity.schema_type, requestedGame, activity.default_game)
  if (!game) {
    return (
      <main className="p-4">
        <ErrorState title={tt('play.invalid.title')} body={tt('play.invalid.body')} />
      </main>
    )
  }

  return (
    <LocaleProvider locale={locale}>
      <main className="mx-auto w-full max-w-2xl p-4">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
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
