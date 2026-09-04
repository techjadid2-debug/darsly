import { redirect } from 'next/navigation'

import { signInWithGoogle } from '@/app/actions/auth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/Button'
import { translator, type TKey } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { createClient } from '@/lib/supabase/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const locale = await getLocale()
  const tt = translator(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const next = params.next?.startsWith('/') ? params.next : '/dashboard'
  const initialErrorKey: TKey | undefined =
    params.error === 'oauth' ? 'login.error.oauthFailed' : undefined

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-ink">{tt('login.title')}</h1>
      <p className="mt-2 text-sm text-ink-soft">{tt('login.subtitle')}</p>

      <div className="mt-7">
        <LoginForm
          locale={locale}
          next={next}
          initialErrorKey={initialErrorKey}
        />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-ink-soft">
          {tt('login.or')}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          {tt('login.google')}
        </Button>
      </form>
    </main>
  )
}
