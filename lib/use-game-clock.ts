'use client'

import { useEffect, useRef, useState } from 'react'

import type { ActivitySettings } from '@/lib/schemas'

/**
 * Shared clock for every game. Each game owns its own countdown rather than
 * having the shell impose one, because only the game knows the score to report
 * when time runs out — and `GameProps` deliberately stays {content, settings,
 * onFinish}.
 *
 * `settings.timer` of 0 means no countdown; `remaining` is then null.
 */
export function useGameClock(
  settings: ActivitySettings,
  onExpire: () => void,
): { remaining: number | null; elapsedSec: () => number } {
  const startedAt = useRef(Date.now())
  const [remaining, setRemaining] = useState<number | null>(
    settings.timer > 0 ? settings.timer : null,
  )

  // Held in a ref so a new closure each render does not restart the interval.
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  const hasExpired = useRef(false)

  useEffect(() => {
    if (settings.timer <= 0) return

    const interval = setInterval(() => {
      const left = settings.timer - Math.floor((Date.now() - startedAt.current) / 1000)
      setRemaining(Math.max(0, left))
      if (left <= 0 && !hasExpired.current) {
        hasExpired.current = true
        clearInterval(interval)
        expireRef.current()
      }
    }, 250)

    return () => clearInterval(interval)
  }, [settings.timer])

  return {
    remaining,
    elapsedSec: () => Math.round((Date.now() - startedAt.current) / 1000),
  }
}
