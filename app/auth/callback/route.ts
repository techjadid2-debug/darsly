import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Exchanges the one-time code from a magic link or OAuth redirect for a
 * session cookie, then forwards the user to wherever they were headed.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const next = nextParam?.startsWith('/') ? nextParam : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  // On Vercel the request arrives at the proxy, so trust the forwarded host.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const base = forwardedHost ? `https://${forwardedHost}` : origin
  return NextResponse.redirect(`${base}${next}`)
}
