'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signInWithPassword, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { translator, type Locale } from '@/lib/i18n'

const initialState: AuthState = { status: 'idle' }

function SubmitButton({ locale }: { locale: Locale }) {
  const tt = translator(locale)
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full text-base py-3">
      {pending ? tt('login.signingIn') : tt('login.passwordSubmit')}
    </Button>
  )
}

/**
 * Teacher password sign-in. Smartboard-friendly: no email needed, just the passcode.
 */
export function PasswordForm({ locale, next }: { locale: Locale; next: string }) {
  const tt = translator(locale)
  const [state, formAction] = useActionState(signInWithPassword, initialState)
  const error = state.status === 'error' ? tt(state.messageKey) : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Input
        label={tt('login.password')}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        placeholder="••••••••"
        error={error}
      />
      <SubmitButton locale={locale} />
    </form>
  )
}
