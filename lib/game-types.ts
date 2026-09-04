import type { ActivitySettings } from '@/lib/schemas'

/**
 * Shared game contract. Lives apart from `lib/games.ts` so a game component can
 * import these types without importing the registry that imports the game.
 */

export type GameResult = {
  score: number
  maxScore: number
  durationSec: number
}

export type GameProps<C> = {
  content: C
  settings: ActivitySettings
  onFinish: (result: GameResult) => void
}
