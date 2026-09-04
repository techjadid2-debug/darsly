'use client'

import { useEffect, useRef } from 'react'

import { recordPlay } from '@/app/actions/activities'

/**
 * Counts one play, once per mount. Runs from the client rather than the server
 * component so a prerender or a crawler fetch does not inflate the number; the
 * write itself goes through a server action, never a client-side Supabase call.
 */
export function PlayCounter({ activityId }: { activityId: string }) {
  const counted = useRef(false)

  useEffect(() => {
    if (counted.current) return
    counted.current = true
    void recordPlay(activityId)
  }, [activityId])

  return null
}
