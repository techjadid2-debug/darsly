import { setLocale } from '@/app/actions/locale'
import { locales, type Locale } from '@/lib/i18n'

export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex items-center rounded-lg border border-border p-0.5">
      {locales.map((locale) => (
        <form action={setLocale} key={locale}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            aria-current={locale === current ? 'true' : undefined}
            className={[
              'rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors',
              locale === current
                ? 'bg-brand-soft text-brand'
                : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            {locale}
          </button>
        </form>
      ))}
    </div>
  )
}
