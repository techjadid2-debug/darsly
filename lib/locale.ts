import { cookies } from 'next/headers'

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n'

/** Reads the viewer's locale from the cookie. Server-side only. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}
