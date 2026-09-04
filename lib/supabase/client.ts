'use client'

import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import type { Database } from '@/lib/types'

/**
 * Browser client. Read-only by convention: all writes to `activities` go
 * through server actions, per the project rules.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey)
}
