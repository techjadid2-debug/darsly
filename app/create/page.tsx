import { redirect } from 'next/navigation'

import { createActivity } from '@/app/actions/activities'
import { Header } from '@/components/layout/Header'
import { ErrorState } from '@/components/ui/ErrorState'
import { gamesForSchema, gameLabel } from '@/lib/games'
import { translator, type TKey } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { SchemaType } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

/** Every schema now has at least one game, so all four are offered. */
const CHOICES: ReadonlyArray<{
  schemaType: SchemaType
  name: TKey
  hint: TKey
  icon: string
}> = [
  { schemaType: 'pairs', name: 'schema.pairs.name', hint: 'schema.pairs.hint', icon: '🔗' },
  { schemaType: 'mcq', name: 'schema.mcq.name', hint: 'schema.mcq.hint', icon: '❓' },
  {
    schemaType: 'groups',
    name: 'schema.groups.name',
    hint: 'schema.groups.hint',
    icon: '🗂️',
  },
  {
    schemaType: 'sequence',
    name: 'schema.sequence.name',
    hint: 'schema.sequence.hint',
    icon: '␣',
  },
]

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent('/create')}`)

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold text-ink">{tt('create.title')}</h1>
        <p className="mt-2 text-sm text-ink-soft">{tt('create.subtitle')}</p>

        {params.error ? (
          <div className="mt-5">
            <ErrorState
              title={tt('create.failed')}
              body={tt('dashboard.error.body')}
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHOICES.map((choice) => (
            <form action={createActivity} key={choice.schemaType}>
              <input type="hidden" name="schemaType" value={choice.schemaType} />
              <button
                type="submit"
                className="flex h-full w-full flex-col items-start gap-2 rounded-(--radius-card) border border-border bg-surface p-5 text-left transition-colors hover:border-brand hover:bg-brand-soft"
              >
                <span aria-hidden className="text-2xl">
                  {choice.icon}
                </span>
                <span className="font-medium text-ink">{tt(choice.name)}</span>
                <span className="text-sm text-ink-soft">{tt(choice.hint)}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {gamesForSchema(choice.schemaType).map((game) => (
                    <span
                      key={game.id}
                      className="rounded-full border border-border px-2 py-0.5 text-xs text-ink-soft"
                    >
                      {game.icon} {gameLabel(game, locale)}
                    </span>
                  ))}
                </span>
              </button>
            </form>
          ))}
        </div>
      </main>
    </div>
  )
}
