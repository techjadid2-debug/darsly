import { gameLabel, getGame } from '@/lib/games'
import { translator, type Locale } from '@/lib/i18n'

export type ResultRow = {
  id: string
  player_name: string | null
  game: string
  score: number
  max_score: number
  duration_sec: number
  created_at: string
}

/** Owner-only view of who played an activity. RLS enforces the "owner-only" part. */
export function ResultsTable({
  rows,
  locale,
}: {
  rows: ResultRow[]
  locale: Locale
}) {
  const tt = translator(locale)

  if (rows.length === 0) {
    return (
      <p className="rounded-(--radius-card) border border-dashed border-border px-4 py-8 text-center text-sm text-ink-soft">
        {tt('results.empty')}
      </p>
    )
  }

  const dateFormat = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  return (
    <div className="overflow-x-auto rounded-(--radius-card) border border-border">
      <table className="w-full min-w-125 border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2 text-left text-ink-soft">
            <th className="px-3 py-2 font-medium">{tt('results.player')}</th>
            <th className="px-3 py-2 font-medium">{tt('results.game')}</th>
            <th className="px-3 py-2 font-medium">{tt('results.score')}</th>
            <th className="px-3 py-2 font-medium">{tt('results.time')}</th>
            <th className="px-3 py-2 font-medium">{tt('results.date')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const game = getGame(row.game)
            return (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2 text-ink">
                  {row.player_name || tt('results.anonymous')}
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {game ? gameLabel(game, locale) : row.game}
                </td>
                <td className="px-3 py-2 tabular-nums text-ink">
                  {row.score} / {row.max_score}
                </td>
                <td className="px-3 py-2 tabular-nums text-ink-soft">
                  {tt('results.seconds', { n: row.duration_sec })}
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {dateFormat.format(new Date(row.created_at))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
