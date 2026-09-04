import type { ComponentType } from 'react'

import MatchUp from '@/components/games/match-up'
import Quiz from '@/components/games/quiz'
import type { GameProps } from '@/lib/game-types'
import { t, type Locale } from '@/lib/i18n'
import type { ContentOf, SchemaType } from '@/lib/schemas'

/**
 * The game registry. The player picks a component from here, so adding game #7
 * is one new file under `components/games/<id>/index.tsx` plus one entry below
 * — nothing else changes.
 *
 * `GameEntry` is a discriminated union on `schemaType`, which is what lets the
 * player narrow an entry to a component with the right content type without
 * casting.
 */

type Entry<S extends SchemaType> = {
  id: string
  label_uz: string
  label_ru: string
  schemaType: S
  Component: ComponentType<GameProps<ContentOf<S>>>
  icon: string
}

export type GameEntry =
  | Entry<'pairs'>
  | Entry<'mcq'>
  | Entry<'groups'>
  | Entry<'sequence'>

export const games: readonly GameEntry[] = [
  {
    id: 'quiz',
    label_uz: t('game.quiz', 'uz'),
    label_ru: t('game.quiz', 'ru'),
    schemaType: 'mcq',
    Component: Quiz,
    icon: '❓',
  },
  {
    id: 'match-up',
    label_uz: t('game.match-up', 'uz'),
    label_ru: t('game.match-up', 'ru'),
    schemaType: 'pairs',
    Component: MatchUp,
    icon: '🔗',
  },
]

export function getGame(id: string | null | undefined): GameEntry | undefined {
  if (!id) return undefined
  return games.find((game) => game.id === id)
}

export function gamesForSchema(schemaType: SchemaType): GameEntry[] {
  return games.filter((game) => game.schemaType === schemaType)
}

/** First registered game for a schema — what a new activity defaults to. */
export function defaultGameFor(schemaType: SchemaType): GameEntry | undefined {
  return games.find((game) => game.schemaType === schemaType)
}

export function gameLabel(game: GameEntry, locale: Locale): string {
  return locale === 'ru' ? game.label_ru : game.label_uz
}

/**
 * Resolves which game to render: the `?game=` override when it exists and fits
 * the activity's schema, otherwise the activity's stored default, otherwise the
 * first game registered for that schema.
 */
export function resolveGame(
  schemaType: SchemaType,
  requested: string | null | undefined,
  storedDefault: string,
): GameEntry | undefined {
  const override = getGame(requested)
  if (override && override.schemaType === schemaType) return override

  const stored = getGame(storedDefault)
  if (stored && stored.schemaType === schemaType) return stored

  return defaultGameFor(schemaType)
}
