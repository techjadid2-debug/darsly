'use client'

import { useEffect, useRef, useState } from 'react'

import { useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'
import {
  parseGroupsPaste,
  parseMcqPaste,
  parsePairsPaste,
  parseSequencePaste,
} from '@/lib/parse'
import {
  groupsToDrafts,
  mcqItemsToDrafts,
  pairItemsToDrafts,
  sequenceItemsToDrafts,
  type GroupDraft,
  type McqDraft,
  type PairDraft,
  type SequenceDraft,
} from '@/lib/drafts'

export type PasteSchema = 'pairs' | 'mcq' | 'groups' | 'sequence'

export type PasteResult =
  | { schemaType: 'pairs'; rows: PairDraft[]; skipped: number }
  | { schemaType: 'mcq'; rows: McqDraft[]; skipped: number }
  | { schemaType: 'groups'; rows: GroupDraft[]; skipped: number }
  | { schemaType: 'sequence'; rows: SequenceDraft[]; skipped: number }

function parseFor(schemaType: PasteSchema, text: string): PasteResult {
  if (schemaType === 'pairs') {
    const report = parsePairsPaste(text)
    return { schemaType, rows: pairItemsToDrafts(report.items), skipped: report.skipped }
  }
  if (schemaType === 'mcq') {
    const report = parseMcqPaste(text)
    return { schemaType, rows: mcqItemsToDrafts(report.items), skipped: report.skipped }
  }
  if (schemaType === 'groups') {
    const report = parseGroupsPaste(text)
    return { schemaType, rows: groupsToDrafts(report.items), skipped: report.skipped }
  }
  const report = parseSequencePaste(text)
  return { schemaType, rows: sequenceItemsToDrafts(report.items), skipped: report.skipped }
}

const HINTS = {
  pairs: 'paste.pairsHint',
  mcq: 'paste.mcqHint',
  groups: 'paste.groupsHint',
  sequence: 'paste.sequenceHint',
} as const

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
  schemaType: PasteSchema
  onClose: () => void
  onApply: (result: PasteResult, mode: 'append' | 'replace') => void
}) {
  const tt = useTranslate()
  const [text, setText] = useState('')
  const dialog = useRef<HTMLDivElement>(null)

  // A `fixed inset-0` overlay is only a dialog if it behaves like one: Escape
  // closes it, Tab cannot wander onto the editor behind it, and focus goes back
  // where it came from afterwards.
  useEffect(() => {
    const opener = document.activeElement

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog.current) return

      const focusable = [
        ...dialog.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [onClose])

  const parsed = parseFor(schemaType, text)
  const found = parsed.rows.length

  return (
    <div
      // Clicking the backdrop, not the sheet, closes it.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-paste-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl"
      >
        <h2 id="bulk-paste-title" className="text-lg font-semibold text-ink">
          {tt('paste.title')}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{tt(HINTS[schemaType])}</p>

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
