'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { RowControls } from '@/components/editor/RowControls'
import { moveRow, type PairDraft } from '@/lib/drafts'

export function PairsTable({
  rows,
  onChange,
}: {
  rows: PairDraft[]
  onChange: (rows: PairDraft[]) => void
}) {
  const tt = useTranslate()

  function update(index: number, patch: Partial<PairDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const field =
    'h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-soft/70'

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => (
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

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              className={field}
              value={row.term}
              placeholder={tt('editor.term')}
              aria-label={tt('editor.term')}
              onChange={(event) => update(index, { term: event.target.value })}
            />
            <input
              className={field}
              value={row.definition}
              placeholder={tt('editor.definition')}
              aria-label={tt('editor.definition')}
              onChange={(event) => update(index, { definition: event.target.value })}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
