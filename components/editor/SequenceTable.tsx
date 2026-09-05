'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { RowControls } from '@/components/editor/RowControls'
import { moveRow, parseMarkedSentence, type SequenceDraft } from '@/lib/drafts'

export function SequenceTable({
  rows,
  onChange,
}: {
  rows: SequenceDraft[]
  onChange: (rows: SequenceDraft[]) => void
}) {
  const tt = useTranslate()

  function update(index: number, markedText: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, markedText } : row)))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">{tt('editor.blanksHint')}</p>

      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          // A sentence with no brackets has nothing to answer, so it is not
          // saved — say so here rather than letting it silently vanish.
          const { blanks } = parseMarkedSentence(row.markedText)
          const incomplete = row.markedText.trim().length > 0 && blanks.length === 0

          return (
            <li
              key={row.id}
              className="rounded-(--radius-card) border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                  {tt('editor.rowLabel', { n: index + 1 })}
                </span>
                <RowControls
                  index={index}
                  total={rows.length}
                  onMove={(direction) => onChange(moveRow(rows, index, direction))}
                  onRemove={() => onChange(rows.filter((_, i) => i !== index))}
                />
              </div>

              <input
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-soft/70"
                value={row.markedText}
                placeholder={tt('editor.sentencePlaceholder')}
                aria-label={tt('editor.sentence')}
                onChange={(event) => update(index, event.target.value)}
              />

              {incomplete ? (
                <p className="mt-2 text-sm text-danger">{tt('editor.blanksHint')}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
