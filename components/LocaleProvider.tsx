'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { defaultLocale, translator, type Locale, type Translate } from '@/lib/i18n'

const LocaleContext = createContext<Locale>(defaultLocale)

/**
 * Makes the viewer's locale available to client components without prop
 * drilling. Games in particular need it: their props are fixed by the
 * `GameProps` contract, which carries content and settings only.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>
}

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useTranslate(): Translate {
  const locale = useLocale()
  return useMemo(() => translator(locale), [locale])
}
