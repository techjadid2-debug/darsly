'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'
import type { TKey } from '@/lib/i18n'

export type AuthState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; messageKey: TKey }

const emailSchema = z.email()

/** Sends a magic link. Returns state for `useActionState`. */
export async function signInWithEmail(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) {
    return { status: 'error', messageKey: 'login.error.invalidEmail' }
  }

  const next = formData.get('next')
  const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'

  const supabase = await createClient()
  const siteUrl = await getSiteUrl()

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (error) return { status: 'error', messageKey: 'login.error.sendFailed' }
  return { status: 'sent' }
}

/**
 * Signs in with an email and password. The password grant is enabled at the
 * Supabase API level; this is the form for it.
 *
 * The error is deliberately the same whether the address is unknown or the
 * password is wrong — telling them apart would let anyone probe which teachers
 * have accounts.
 */
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get('email'))
  const password = formData.get('password')

  if (!email.success || typeof password !== 'string' || password.length === 0) {
    return { status: 'error', messageKey: 'login.error.badCredentials' }
  }

  const next = formData.get('next')
  const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password,
  })

  if (error) return { status: 'error', messageKey: 'login.error.badCredentials' }

  // Outside any try/catch: `redirect` works by throwing.
  redirect(nextPath)
}

/** Starts the Google OAuth flow by redirecting to Supabase's consent URL. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = formData.get('next')
  const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'

  const supabase = await createClient()
  const siteUrl = await getSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth')
  }
  redirect(data.url)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
