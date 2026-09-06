import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { gameLabel, games } from '@/lib/games'
import { translator, type TKey } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { getTeacherSession } from '@/lib/auth/session'

const STEPS: ReadonlyArray<{ title: TKey; body: TKey }> = [
  { title: 'how.step1.title', body: 'how.step1.body' },
  { title: 'how.step2.title', body: 'how.step2.body' },
  { title: 'how.step3.title', body: 'how.step3.body' },
]

// Read from the registry, not retyped: `lib/games.ts` promises that adding a
// game is one file plus one entry, and a hand-written list here quietly broke
// that by leaving the seventh game off the homepage.

export default async function LandingPage() {
  const locale = await getLocale()
  const tt = translator(locale)

  const signedIn = await getTeacherSession()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} signedIn={signedIn} />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-4 pb-14 pt-12 sm:pt-20">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
            {tt('hero.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-soft sm:text-lg">
            {tt('hero.subtitle')}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard" size="lg">
              {tt('hero.ctaPrimary')}
            </ButtonLink>
            <ButtonLink href="/library" size="lg" variant="secondary">
              {tt('hero.ctaSecondary')}
            </ButtonLink>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-xl font-semibold text-ink">{tt('how.title')}</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-medium text-ink">{tt(step.title)}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{tt(step.body)}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">
          <h2 className="text-xl font-semibold text-ink">{tt('games.title')}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {games.map((game) => (
              <li
                key={game.id}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink"
              >
                {game.icon} {gameLabel(game, locale)}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
