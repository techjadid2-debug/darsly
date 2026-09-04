'use client'

import { useTranslate } from '@/components/LocaleProvider'

/** Countdown pill. Renders nothing when the activity has no time limit. */
export function Timer({ remaining }: { remaining: number | null }) {
  const tt = useTranslate()
  if (remaining === null) return null

  const urgent = remaining <= 10

  return (
    <span
      role="timer"
      aria-live={urgent ? 'assertive' : 'off'}
      className={[
        'rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums',
        urgent ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-ink-soft',
      ].join(' ')}
    >
      {tt('play.timeLeft', { sec: remaining })}
    </span>
  )
}
