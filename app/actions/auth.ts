'use server'

import { redirect } from 'next/navigation'
import {
  clearTeacherSession,
  createTeacherSession,
  verifyTeacherPassword,
} from '@/lib/auth/session'
import type { TKey } from '@/lib/i18n'

export type AuthState =
  | { status: 'idle' }
  | { status: 'error'; messageKey: TKey }

/**
 * Signs in the teacher using the configured password.
 */
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get('password')

  if (typeof password !== 'string' || password.length === 0) {
    return { status: 'error', messageKey: 'login.error.badCredentials' }
  }

  const isValid = verifyTeacherPassword(password)
  if (!isValid) {
    return { status: 'error', messageKey: 'login.error.badCredentials' }
  }

  await createTeacherSession()

  const next = formData.get('next')
  const nextPath = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'

  redirect(nextPath)
}

export async function signOut(): Promise<void> {
  await clearTeacherSession()
  redirect('/')
}
