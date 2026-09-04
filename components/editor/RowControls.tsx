'use client'

import { useTranslate } from '@/components/LocaleProvider'

/** Reorder / delete buttons shared by every editor table. */
export function RowControls({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number
  total: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const tt = useTranslate()
  const button =
    'flex size-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:text-ink disabled:opacity-40'

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={button}
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={tt('editor.moveUp')}
      >
        ↑
      </button>
      <button
        type="button"
        className={button}
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label={tt('editor.moveDown')}
      >
        ↓
      </button>
      <button
        type="button"
        className={`${button} hover:border-danger hover:text-danger`}
        onClick={onRemove}
        aria-label={tt('editor.remove')}
      >
        ✕
      </button>
    </div>
  )
}
