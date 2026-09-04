import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import type { Database } from '@/lib/types'

/** Server client for Server Components, Route Handlers and Server Actions. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, which cannot set cookies.
          // Safe to ignore: middleware refreshes the session on every request.
        }
      },
    },
  })
}
