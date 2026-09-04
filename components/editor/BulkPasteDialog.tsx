'use client'

import { useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { parseMcqPaste, parsePairsPaste } from '@/lib/parse'
import { mcqItemsToDrafts, pairItemsToDrafts, type McqDraft, type PairDraft } from '@/lib/drafts'

type Result =
  | { schemaType: 'pairs'; rows: PairDraft[]; skipped: number }
  | { schemaType: 'mcq'; rows: McqDraft[]; skipped: number }

/**
 * Bulk import from a spreadsheet. Teachers paste two or more columns straight
 * out of Excel; `lib/parse.ts` splits on tabs first, then on common hand-typed
 * separators.
 */
export function BulkPasteDialog({
  schemaType,
  onClose,
  onApply,
}: {
  schemaType: 'pairs' | 'mcq'
  onClose: () => void
  onApply: (result: Result, mode: 'append' | 'replace') => void
}) {
  const tt = useTranslate()
  const [text, setText] = useState('')

  const parsed: Result =
    schemaType === 'pairs'
      ? (() => {
          const report = parsePairsPaste(text)
          return {
            schemaType: 'pairs' as const,
            rows: pairItemsToDrafts(report.items),
            skipped: report.skipped,
          }
        })()
      : (() => {
          const report = parseMcqPaste(text)
          return {
            schemaType: 'mcq' as const,
            rows: mcqItemsToDrafts(report.items),
            skipped: report.skipped,
          }
        })()

  const found = parsed.rows.length

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl">
        <h2 className="text-lg font-semibold text-ink">{tt('paste.title')}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {tt(schemaType === 'pairs' ? 'paste.pairsHint' : 'paste.mcqHint')}
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tt('paste.placeholder')}
          rows={8}
          className="mt-3 w-full rounded-xl border border-border bg-bg p-3 font-mono text-sm text-ink"
        />

        <p className="mt-2 text-sm text-ink-soft">
          {found === 0 && text.trim()
            ? tt('paste.nothing')
            : tt('paste.summary', { found, skipped: parsed.skipped })}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button
            variant="secondary"
            disabled={found === 0}
            onClick={() => onApply(parsed, 'replace')}
          >
            {tt('paste.replace')}
          </Button>
          <Button disabled={found === 0} onClick={() => onApply(parsed, 'append')}>
            {tt('paste.append')}
          </Button>
        </div>
      </div>
    </div>
  )
}
