import Link from 'next/link'

import { signOut } from '@/app/actions/auth'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { Button, ButtonLink } from '@/components/ui/Button'
import { translator, type Locale } from '@/lib/i18n'

export function Header({
  locale,
  signedIn,
}: {
  locale: Locale
  signedIn: boolean
}) {
  const tt = translator(locale)

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="text-base font-semibold text-ink">
          {tt('app.name')}
        </Link>

        <div className="flex items-center gap-2">
          <LocaleSwitcher current={locale} />
          {signedIn ? (
            <>
              <ButtonLink href="/dashboard" variant="ghost">
                {tt('common.dashboard')}
              </ButtonLink>
              <form action={signOut}>
                <Button type="submit" variant="secondary">
                  {tt('common.signOut')}
                </Button>
              </form>
            </>
          ) : (
            <ButtonLink href="/login" variant="secondary">
              {tt('common.signIn')}
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  )
}
