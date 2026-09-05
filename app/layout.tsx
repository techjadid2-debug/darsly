import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { t } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

/**
 * `metadata` cannot read the locale cookie, so calling `t()` there pinned the
 * tab title, the meta description and every share preview to Uzbek — including
 * for a reader who had switched the app to Russian.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: {
      default: `${t('app.name', locale)} — ${t('app.tagline', locale)}`,
      template: `%s — ${t('app.name', locale)}`,
    },
    description: t('hero.subtitle', locale),
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Students pinch-zoom on small phones; do not lock them out.
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
