'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { RowControls } from '@/components/editor/RowControls'
import { moveRow, type GroupDraft } from '@/lib/drafts'

export function GroupsTable({
  rows,
  onChange,
}: {
  rows: GroupDraft[]
  onChange: (rows: GroupDraft[]) => void
}) {
  const tt = useTranslate()

  function update(index: number, patch: Partial<GroupDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const field =
    'w-full rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-soft/70'

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <li
          key={row.id}
          className="rounded-(--radius-card) border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              {tt('editor.groupLabel', { n: index + 1 })}
            </span>
            <RowControls
              index={index}
              total={rows.length}
              onMove={(direction) => onChange(moveRow(rows, index, direction))}
              onRemove={() => onChange(rows.filter((_, i) => i !== index))}
            />
          </div>

          <input
            className={`${field} mt-2 h-11`}
            value={row.name}
            placeholder={tt('editor.groupName')}
            aria-label={tt('editor.groupName')}
            onChange={(event) => update(index, { name: event.target.value })}
          />

          <textarea
            className={`${field} mt-2 py-2`}
            rows={4}
            value={row.itemsText}
            placeholder={tt('editor.groupItems')}
            aria-label={tt('editor.groupItems')}
            onChange={(event) => update(index, { itemsText: event.target.value })}
          />
        </li>
      ))}
    </ul>
  )
}
