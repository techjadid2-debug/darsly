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
