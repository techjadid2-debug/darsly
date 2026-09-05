import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  defaultGameFor,
  gameLabel,
  games,
  gamesForSchema,
  getGame,
  resolveGame,
} from '@/lib/games'
import { isSchemaType, schemaTypes, type SchemaType } from '@/lib/schemas'

/**
 * The registry is the one place adding a game touches, so these tests guard the
 * invariants the rest of the app assumes about it rather than any single entry.
 * Nothing here hardcodes the current six games — a seventh should not need an
 * edit below.
 */

/** Schemas that currently have no game. `sequence` is the one, until M8. */
const orphanSchemas: SchemaType[] = schemaTypes.filter(
  (schemaType) => gamesForSchema(schemaType).length === 0,
)

test('every registry entry has a unique id and a known schema type', () => {
  const ids = games.map((game) => game.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate game id in the registry')

  for (const game of games) {
    assert.ok(isSchemaType(game.schemaType), `${game.id} has an unknown schema type`)
    assert.ok(game.icon.length > 0, `${game.id} has no icon`)
  }
})

test('every game is labelled in both locales', () => {
  for (const game of games) {
    assert.ok(game.label_uz.trim().length > 0, `${game.id} has no Uzbek label`)
    assert.ok(game.label_ru.trim().length > 0, `${game.id} has no Russian label`)
    assert.equal(gameLabel(game, 'uz'), game.label_uz)
    assert.equal(gameLabel(game, 'ru'), game.label_ru)
  }
})

test('getGame looks an entry up and returns undefined for anything else', () => {
  const first = games[0]
  assert.ok(first)
  assert.equal(getGame(first.id)?.id, first.id)
  assert.equal(getGame('no-such-game'), undefined)
  assert.equal(getGame(null), undefined)
  assert.equal(getGame(undefined), undefined)
  assert.equal(getGame(''), undefined)
})

test('gamesForSchema returns only games that can render that schema', () => {
  for (const schemaType of schemaTypes) {
    for (const game of gamesForSchema(schemaType)) {
      assert.equal(game.schemaType, schemaType)
    }
  }

  const total = schemaTypes.reduce((sum, s) => sum + gamesForSchema(s).length, 0)
  assert.equal(total, games.length, 'a game is registered under no schema')
})

test('the default game for a schema is the first one registered for it', () => {
  for (const schemaType of schemaTypes) {
    const candidates = gamesForSchema(schemaType)
    assert.equal(defaultGameFor(schemaType)?.id, candidates[0]?.id)
  }
})

test('a ?game= override wins when it fits the activity schema', () => {
  const pairsGames = gamesForSchema('pairs')
  const [first, second] = pairsGames
  assert.ok(first && second, 'this test needs two games on the pairs schema')

  assert.equal(resolveGame('pairs', second.id, first.id)?.id, second.id)
})

test('an override for the wrong schema falls back to the stored default', () => {
  const mcqGame = defaultGameFor('mcq')
  const pairsGames = gamesForSchema('pairs')
  const [first, second] = pairsGames
  assert.ok(mcqGame && first && second)

  // Someone hand-edits ?game= on a pairs activity to a quiz. The quiz cannot
  // read pairs content, so the stored default has to win.
  assert.equal(resolveGame('pairs', mcqGame.id, second.id)?.id, second.id)
})

test('a stored default that no longer fits falls back to the first game', () => {
  const mcqGame = defaultGameFor('mcq')
  const pairsDefault = defaultGameFor('pairs')
  assert.ok(mcqGame && pairsDefault)

  // A stale row: the schema was changed, or the game was renamed out of the
  // registry. Either way the player must still get something playable.
  assert.equal(resolveGame('pairs', null, mcqGame.id)?.id, pairsDefault.id)
  assert.equal(resolveGame('pairs', null, 'deleted-game')?.id, pairsDefault.id)
})

test('a schema with no games resolves to nothing rather than the wrong game', () => {
  for (const schemaType of orphanSchemas) {
    assert.equal(defaultGameFor(schemaType), undefined)
    assert.equal(resolveGame(schemaType, 'quiz', 'quiz'), undefined)
  }
})
