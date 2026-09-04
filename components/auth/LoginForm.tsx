'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signInWithEmail, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { translator, type Locale, type TKey } from '@/lib/i18n'

const initialState: AuthState = { status: 'idle' }

function SubmitButton({ locale }: { locale: Locale }) {
  const tt = translator(locale)
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? tt('login.sending') : tt('login.sendLink')}
    </Button>
  )
}

export function LoginForm({
  locale,
  next,
  initialErrorKey,
}: {
  locale: Locale
  next: string
  initialErrorKey?: TKey | undefined
}) {
  const tt = translator(locale)
  const [state, formAction] = useActionState(signInWithEmail, initialState)

  if (state.status === 'sent') {
    return (
      <div className="rounded-(--radius-card) border border-success/30 bg-success/5 p-5 text-center">
        <h2 className="font-semibold text-ink">{tt('login.sent.title')}</h2>
        <p className="mt-1 text-sm text-ink-soft">{tt('login.sent.body')}</p>
      </div>
    )
  }

  const errorKey =
    state.status === 'error' ? state.messageKey : initialErrorKey

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Input
        label={tt('login.email')}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder={tt('login.emailPlaceholder')}
        error={errorKey ? tt(errorKey) : undefined}
      />
      <SubmitButton locale={locale} />
    </form>
  )
}
