/**
 * Deterministic shuffling. A seeded variant matters for generated content
 * (M4 converters) and for previews that should not reshuffle on every render;
 * games use the unseeded variant so each play differs.
 */

/** mulberry32 — small, fast, good enough for shuffling quiz options. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Turns any string into a stable 32-bit seed. */
export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Fisher-Yates. Returns a new array; the input is untouched. */
export function shuffle<T>(items: readonly T[], seed?: string): T[] {
  const next = seed === undefined ? Math.random : seededRandom(hashSeed(seed))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    const a = out[i]
    const b = out[j]
    // Guard for noUncheckedIndexedAccess; both indices are always in range.
    if (a !== undefined && b !== undefined) {
      out[i] = b
      out[j] = a
    }
  }
  return out
}
