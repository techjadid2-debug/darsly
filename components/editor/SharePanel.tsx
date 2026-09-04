'use client'

import { useEffect, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'

function CopyRow({ label, value }: { label: string; value: string }) {
  const tt = useTranslate()
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
          className="h-11 shrink-0 rounded-xl border border-border px-3 text-sm text-ink-soft hover:text-ink"
        >
          {copied ? tt('share.copied') : tt('share.copy')}
        </button>
      </div>
    </div>
  )
}

/**
 * Share links. The origin is read in the browser so the snippet is correct on
 * localhost, a Vercel preview and production without any configuration.
 */
export function SharePanel({
  activityId,
  isPublic,
  siteUrl,
}: {
  activityId: string
  isPublic: boolean
  /** Origin as the server saw it, so the links render on first paint. */
  siteUrl: string
}) {
  const tt = useTranslate()
  const [origin, setOrigin] = useState(siteUrl)

  // The browser is the authority once it is running — a proxy or a custom
  // domain can make the server's view differ from the address bar.
  useEffect(() => setOrigin(window.location.origin), [])

  const playUrl = `${origin}/play/${activityId}`
  const embedUrl = `${origin}/embed/${activityId}`
  const snippet = `<iframe src="${embedUrl}" width="100%" height="600" style="border:1px solid #ddd;border-radius:12px" allowfullscreen></iframe>`

  return (
    <details className="rounded-(--radius-card) border border-border bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink">
        {tt('share.title')}
      </summary>

      <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
        {!isPublic ? (
          <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink-soft">
            {tt('share.needsPublic')}
          </p>
        ) : null}

        {origin ? (
          <>
            <CopyRow label={tt('share.link')} value={playUrl} />
            <CopyRow label={tt('share.embed')} value={snippet} />
          </>
        ) : null}

        <a
          href={`/print/${activityId}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-brand hover:underline"
        >
          {tt('share.print')} →
        </a>
      </div>
    </details>
  )
}
