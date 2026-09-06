import { redirect } from 'next/navigation'

import { PasswordForm } from '@/components/auth/PasswordForm'
import { getTeacherSession } from '@/lib/auth/session'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)

  const signedIn = await getTeacherSession()
  if (signedIn) redirect('/dashboard')

  const next = params.next?.startsWith('/') ? params.next : '/dashboard'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">{tt('login.title')}</h1>
        <p className="mt-2 text-sm text-ink-soft">{tt('login.subtitle')}</p>

        <div className="mt-6">
          <PasswordForm locale={locale} next={next} />
        </div>
      </div>
    </main>
  )
}
