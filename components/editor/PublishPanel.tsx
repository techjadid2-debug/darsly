'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { grades, subjectKeys, subjects } from '@/lib/taxonomy'

/** Subject, grade and the public/private switch — what the library filters on. */
export function PublishPanel({
  subject,
  grade,
  isPublic,
  onChange,
}: {
  subject: string | null
  grade: string | null
  isPublic: boolean
  onChange: (patch: {
    subject?: string | null
    grade?: string | null
    isPublic?: boolean
  }) => void
}) {
  const tt = useTranslate()
  const select =
    'h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink'

  return (
    <div className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-subject" className="text-sm text-ink">
            {tt('editor.subject')}
          </label>
          <select
            id="activity-subject"
            className={select}
            value={subject ?? ''}
            onChange={(event) =>
              onChange({ subject: event.target.value === '' ? null : event.target.value })
            }
          >
            <option value="">{tt('editor.notSet')}</option>
            {subjects.map((value) => (
              <option key={value} value={value}>
                {tt(subjectKeys[value])}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-grade" className="text-sm text-ink">
            {tt('editor.grade')}
          </label>
          <select
            id="activity-grade"
            className={select}
            value={grade ?? ''}
            onChange={(event) =>
              onChange({ grade: event.target.value === '' ? null : event.target.value })
            }
          >
            <option value="">{tt('editor.notSet')}</option>
            {grades.map((value) => (
              <option key={value} value={value}>
                {tt('grade.value', { n: value })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(event) => onChange({ isPublic: event.target.checked })}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          <span className="block text-sm text-ink">{tt('editor.publish')}</span>
          <span className="block text-sm text-ink-soft">{tt('editor.publishHint')}</span>
        </span>
      </label>
    </div>
  )
}
