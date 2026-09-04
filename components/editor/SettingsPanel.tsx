'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { themes, type ActivitySettings } from '@/lib/schemas'

/** Timer choices in seconds; 0 means no time limit. */
const TIMER_CHOICES = [0, 30, 60, 120, 300] as const

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: ActivitySettings
  onChange: (settings: ActivitySettings) => void
}) {
  const tt = useTranslate()

  const themeLabel: Record<(typeof themes)[number], string> = {
    default: tt('theme.default'),
    warm: tt('theme.warm'),
    cool: tt('theme.cool'),
  }

  return (
    <details className="rounded-(--radius-card) border border-border bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink">
        {tt('settings.title')}
      </summary>

      <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="setting-timer" className="text-sm text-ink">
            {tt('settings.timer')}
          </label>
          <select
            id="setting-timer"
            value={settings.timer}
            onChange={(event) =>
              onChange({ ...settings, timer: Number(event.target.value) })
            }
            className="h-11 rounded-xl border border-border bg-surface px-3 text-base text-ink"
          >
            {TIMER_CHOICES.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds === 0
                  ? tt('settings.timerOff')
                  : tt('settings.timerValue', { n: seconds })}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={settings.shuffle}
            onChange={(event) => onChange({ ...settings, shuffle: event.target.checked })}
            className="size-5 accent-[var(--color-brand)]"
          />
          {tt('settings.shuffle')}
        </label>

        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={settings.show_answers}
            onChange={(event) =>
              onChange({ ...settings, show_answers: event.target.checked })
            }
            className="size-5 accent-[var(--color-brand)]"
          />
          {tt('settings.showAnswers')}
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink">{tt('settings.theme')}</span>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => onChange({ ...settings, theme })}
                aria-pressed={settings.theme === theme}
                data-theme-variant={theme}
                className={[
                  'flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm',
                  settings.theme === theme
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border bg-surface text-ink-soft hover:text-ink',
                ].join(' ')}
              >
                <span aria-hidden className="size-3 rounded-full bg-brand" />
                {themeLabel[theme]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  )
}
