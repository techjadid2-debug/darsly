'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { RowControls } from '@/components/editor/RowControls'
import { moveRow, type McqDraft } from '@/lib/drafts'

export function McqTable({
  rows,
  onChange,
}: {
  rows: McqDraft[]
  onChange: (rows: McqDraft[]) => void
}) {
  const tt = useTranslate()

  function update(index: number, patch: Partial<McqDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function setOption(rowIndex: number, optionIndex: number, value: string) {
    const row = rows[rowIndex]
    if (!row) return
    update(rowIndex, {
      options: row.options.map((option, i) => (i === optionIndex ? value : option)),
    })
  }

  function removeOption(rowIndex: number, optionIndex: number) {
    const row = rows[rowIndex]
    if (!row || row.options.length <= 2) return
    const options = row.options.filter((_, i) => i !== optionIndex)
    // Keep the correct answer pointing at the same option after the shift.
    const correctIndex =
      row.correctIndex === optionIndex
        ? 0
        : row.correctIndex > optionIndex
          ? row.correctIndex - 1
          : row.correctIndex
    update(rowIndex, { options, correctIndex })
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

          <input
            className={`${field} mt-2`}
            value={row.question}
            placeholder={tt('editor.question')}
            aria-label={tt('editor.question')}
            onChange={(event) => update(index, { question: event.target.value })}
          />

          <ul className="mt-2 flex flex-col gap-2">
            {row.options.map((option, optionIndex) => (
              <li key={`${row.id}-${optionIndex}`} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${row.id}`}
                  checked={row.correctIndex === optionIndex}
                  onChange={() => update(index, { correctIndex: optionIndex })}
                  aria-label={tt('editor.markCorrect')}
                  className="size-5 shrink-0 accent-[var(--color-brand)]"
                />
                <input
                  className={field}
                  value={option}
                  placeholder={tt('editor.option', { n: optionIndex + 1 })}
                  aria-label={tt('editor.option', { n: optionIndex + 1 })}
                  onChange={(event) => setOption(index, optionIndex, event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index, optionIndex)}
                  disabled={row.options.length <= 2}
                  aria-label={tt('editor.removeOption')}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-soft hover:border-danger hover:text-danger disabled:opacity-40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => update(index, { options: [...row.options, ''] })}
            className="mt-2 text-sm font-medium text-brand hover:underline"
          >
            + {tt('editor.addOption')}
          </button>
        </li>
      ))}
    </ul>
  )
}
