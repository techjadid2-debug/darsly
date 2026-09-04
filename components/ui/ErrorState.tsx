import type { ReactNode } from 'react'

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-danger/30 bg-danger/5 px-6 py-12 text-center"
    >
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-sm text-sm text-ink-soft">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
