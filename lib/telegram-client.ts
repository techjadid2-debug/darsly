'use client'

/**
 * Reads the Telegram Mini App context, if the page is running inside one.
 * The `initData` string is passed to the server untouched — the server, not
 * this file, decides whether to believe it.
 */

type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: { user?: { first_name?: string; last_name?: string; username?: string } }
  ready?: () => void
  expand?: () => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export type TelegramContext = {
  initData: string
  /** Only for showing the player their own name; never trusted server-side. */
  displayName: string
}

export function getTelegramContext(): TelegramContext | null {
  if (typeof window === 'undefined') return null

  const webApp = window.Telegram?.WebApp
  const initData = webApp?.initData
  if (!webApp || !initData) return null

  webApp.ready?.()
  webApp.expand?.()

  const user = webApp.initDataUnsafe?.user
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.username ||
    ''

  return { initData, displayName }
}
