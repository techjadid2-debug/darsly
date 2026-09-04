import { translator, type Locale } from '@/lib/i18n'

export function Footer({ locale }: { locale: Locale }) {
  const tt = translator(locale)
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-8 text-sm text-ink-soft">
        <span className="font-medium text-ink">{tt('app.name')}</span>
        <span>{tt('footer.builtFor')}</span>
      </div>
    </footer>
  )
}
