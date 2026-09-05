'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

import { deleteActivity } from '@/app/actions/activities'

/**
 * Two-step delete. Deleting an activity throws away content the teacher typed
 * by hand and there is no undo, so the first click only arms the action.
 *
 * The labels arrive as props rather than through `useTranslate`: the dashboard
 * is a server component that already holds a bound translator, and there is no
 * `LocaleProvider` above it to read.
 */
export function DeleteActivityButton({
  id,
  labels,
}: {
  id: string
  labels: { delete: string; confirm: string; yes: string; cancel: string }
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-ink-soft hover:text-danger hover:underline"
      >
        {labels.delete}
      </button>
    )
  }

  return (
    <form action={deleteActivity} className="flex w-full flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm font-normal text-ink-soft">{labels.confirm}</p>
      <div className="flex gap-3">
        <ConfirmButton label={labels.yes} />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-ink-soft hover:text-ink hover:underline"
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  )
}

/** Split out so `useFormStatus` can see the enclosing form. */
function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-medium text-danger hover:underline disabled:opacity-55"
    >
      {label}
    </button>
  )
}
