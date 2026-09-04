'use client'

import { useTranslate } from '@/components/LocaleProvider'
import type { GameEntry } from '@/lib/games'
import type { GameResult } from '@/lib/game-types'
import {
  groupsContentSchema,
  mcqContentSchema,
  pairsContentSchema,
  sequenceContentSchema,
  type ActivitySettings,
} from '@/lib/schemas'

/**
 * Validates raw jsonb against the schema the chosen game declares, then renders
 * the game with typed content. The switch narrows `game` through its
 * `schemaType` discriminant, so no cast is needed and a game can never receive
 * content of the wrong shape.
 */
export function GameRenderer({
  game,
  rawContent,
  settings,
  onFinish,
}: {
  game: GameEntry
  rawContent: unknown
  settings: ActivitySettings
  onFinish: (result: GameResult) => void
}) {
  const tt = useTranslate()

  const notice = (titleKey: 'play.empty.title' | 'play.invalid.title') => (
    <div className="rounded-(--radius-card) border border-border bg-surface px-5 py-10 text-center">
      <h2 className="font-semibold text-ink">{tt(titleKey)}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {tt(titleKey === 'play.empty.title' ? 'play.empty.body' : 'play.invalid.body')}
      </p>
    </div>
  )

  switch (game.schemaType) {
    case 'mcq': {
      const parsed = mcqContentSchema.safeParse(rawContent)
      if (!parsed.success) return notice('play.invalid.title')
      if (parsed.data.items.length === 0) return notice('play.empty.title')
      const Game = game.Component
      return (
        <Game content={parsed.data} settings={settings} onFinish={onFinish} />
      )
    }
    case 'pairs': {
      const parsed = pairsContentSchema.safeParse(rawContent)
      if (!parsed.success) return notice('play.invalid.title')
      if (parsed.data.items.length === 0) return notice('play.empty.title')
      const Game = game.Component
      return (
        <Game content={parsed.data} settings={settings} onFinish={onFinish} />
      )
    }
    case 'groups': {
      const parsed = groupsContentSchema.safeParse(rawContent)
      if (!parsed.success) return notice('play.invalid.title')
      if (parsed.data.groups.length === 0) return notice('play.empty.title')
      const Game = game.Component
      return (
        <Game content={parsed.data} settings={settings} onFinish={onFinish} />
      )
    }
    case 'sequence': {
      const parsed = sequenceContentSchema.safeParse(rawContent)
      if (!parsed.success) return notice('play.invalid.title')
      if (parsed.data.items.length === 0) return notice('play.empty.title')
      const Game = game.Component
      return (
        <Game content={parsed.data} settings={settings} onFinish={onFinish} />
      )
    }
  }
}
