import { headers } from 'next/headers'

import { env } from '@/lib/env'

/**
 * The origin the current request arrived on. Preferred over a hardcoded
 * NEXT_PUBLIC_SITE_URL for auth redirects, so magic links and OAuth callbacks
 * work unchanged on localhost, Vercel preview URLs and production.
 */
export async function getSiteUrl(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  if (!host) return env.siteUrl

  const proto =
    headerList.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https')

  return `${proto}://${host}`
}
