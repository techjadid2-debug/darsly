'use client'

import { useLocale } from '@/components/LocaleProvider'
import { gameLabel, type GameEntry } from '@/lib/games'

/** Switches the previewed game. Content is untouched — that is the whole point. */
export function GameChips({
  games,
  activeId,
  onSelect,
}: {
  games: readonly GameEntry[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const locale = useLocale()

  return (
    <div className="flex flex-wrap gap-2">
      {games.map((game) => {
        const active = game.id === activeId
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelect(game.id)}
            aria-pressed={active}
            className={[
              'flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
              active
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-border bg-surface text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            <span aria-hidden>{game.icon}</span>
            {gameLabel(game, locale)}
          </button>
        )
      })}
    </div>
  )
}
