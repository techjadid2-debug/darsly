import { notFound } from 'next/navigation'

import { LocaleProvider } from '@/components/LocaleProvider'
import { GameShell } from '@/components/player/GameShell'
import { getGame } from '@/lib/games'
import { getLocale } from '@/lib/locale'
import { parseSettings } from '@/lib/schemas'
import { templates } from '@/lib/templates'

/**
 * End-to-end test harness: renders one game over one starter template, with no
 * activity row, no account and no Supabase call behind it. The suite in
 * `tests/e2e` drives the games through this route, so a game regression is
 * caught without standing up a database.
 *
 * The route answers 404 unless `DARSLY_E2E=1` is set on the server, which no
 * deployment sets — Playwright starts its own server with it.
 *
 * `/dev/game/quiz?template=math-quiz&shuffle=0`
 */
export default async function DevGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>
  searchParams: Promise<{ template?: string; shuffle?: string; timer?: string }>
}) {
  if (process.env.DARSLY_E2E !== '1') notFound()

  const { game: gameId } = await params
  const query = await searchParams
  const locale = await getLocale()

  const game = getGame(gameId)
  if (!game) notFound()

  const template = templates.find((entry) => entry.id === query.template)
  // A game can only render content of its own schema, so a mismatched pairing
  // is a broken test URL rather than something to render an error state for.
  if (!template || template.schemaType !== game.schemaType) notFound()

  // Shuffling is on by default, which is right for players and wrong for
  // assertions. `?shuffle=0` pins the order so a spec can name an item.
  const settings = parseSettings({
    shuffle: query.shuffle !== '0',
    timer: Number(query.timer ?? 0),
  })

  return (
    <LocaleProvider locale={locale}>
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-6">
        <h1 className="text-xl font-semibold text-ink">
          {game.id} · {template.id}
        </h1>
        <GameShell game={game} rawContent={template.content} settings={settings} />
      </main>
    </LocaleProvider>
  )
}
