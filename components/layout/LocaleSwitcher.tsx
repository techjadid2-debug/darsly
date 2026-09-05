import { setLocale } from '@/app/actions/locale'
import { locales, t, type Locale } from '@/lib/i18n'

export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    // "UZ"/"RU" is legible on screen but announces as two letters, and the
    // control itself had no name at all.
    <div
      role="group"
      aria-label={t('common.language', current)}
      className="flex items-center rounded-lg border border-border p-0.5"
    >
      {locales.map((locale) => (
        <form action={setLocale} key={locale}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            aria-current={locale === current ? 'true' : undefined}
            aria-label={t(`common.locale.${locale}`, current)}
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
