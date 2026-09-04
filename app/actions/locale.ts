'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { isLocale, LOCALE_COOKIE } from '@/lib/i18n'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setLocale(formData: FormData): Promise<void> {
  const next = formData.get('locale')
  if (typeof next !== 'string' || !isLocale(next)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
