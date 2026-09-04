import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { t } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: `${t('app.name')} — ${t('app.tagline')}`,
    template: `%s — ${t('app.name')}`,
  },
  description: t('hero.subtitle'),
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
