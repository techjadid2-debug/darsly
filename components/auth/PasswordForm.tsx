'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signInWithPassword, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { translator, type Locale } from '@/lib/i18n'

const initialState: AuthState = { status: 'idle' }

function SubmitButton({ locale }: { locale: Locale }) {
  const tt = translator(locale)
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full text-base py-3 font-semibold shadow-sm">
      {pending ? tt('login.signingIn') : tt('login.passwordSubmit')}
    </Button>
  )
}

/**
 * Teacher password sign-in. Smartboard-friendly: no email needed, includes
 * show/hide password toggle button for touchscreens and electronic smartboards.
 */
export function PasswordForm({ locale, next }: { locale: Locale; next: string }) {
  const tt = translator(locale)
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useActionState(signInWithPassword, initialState)
  const error = state.status === 'error' ? tt(state.messageKey) : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          {tt('login.password')}
        </label>
        <div className="relative flex items-center">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            autoFocus
            placeholder="••••••••"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'password-error' : undefined}
            className={[
              'h-12 w-full rounded-xl border bg-surface pl-4 pr-12 text-base text-ink transition-colors',
              'placeholder:text-ink-soft/70 focus:outline-hidden focus:ring-2 focus:ring-brand/30',
              error ? 'border-danger focus:border-danger' : 'border-border focus:border-brand',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
            tabIndex={-1}
            className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-soft hover:text-ink transition-colors focus:outline-hidden"
          >
            {showPassword ? (
              // Eye-off icon (slash)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.733 5.076a10.744 10.744 0 0 1 1.267-.076c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              </svg>
            ) : (
              // Eye icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {error ? (
          <p id="password-error" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <SubmitButton locale={locale} />
    </form>
  )
}
