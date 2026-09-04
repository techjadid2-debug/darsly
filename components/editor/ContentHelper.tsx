'use client'

import { useRef, useState } from 'react'

import { createFromConversion } from '@/app/actions/activities'
import type { PasteResult } from '@/components/editor/BulkPasteDialog'
import { useLocale, useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { conversionsFrom } from '@/lib/converters'
import {
  groupDraftsFrom,
  groupsToDrafts,
  mcqDraftsFrom,
  mcqItemsToDrafts,
  pairDraftsFrom,
  pairItemsToDrafts,
} from '@/lib/drafts'
import { readSpreadsheet } from '@/lib/import-file'
import { rowsToGroups, rowsToMcq, rowsToPairs } from '@/lib/parse'
import { templatesFor } from '@/lib/templates'
import type { SchemaType } from '@/lib/schemas'

type HelperSchema = 'pairs' | 'mcq' | 'groups'

function rowsToResult(schemaType: HelperSchema, rows: string[][]): PasteResult {
  if (schemaType === 'pairs') {
    const report = rowsToPairs(rows)
    return { schemaType, rows: pairItemsToDrafts(report.items), skipped: report.skipped }
  }
  if (schemaType === 'mcq') {
    const report = rowsToMcq(rows)
    return { schemaType, rows: mcqItemsToDrafts(report.items), skipped: report.skipped }
  }
  const report = rowsToGroups(rows)
  return { schemaType, rows: groupsToDrafts(report.items), skipped: report.skipped }
}

/**
 * Content generation without a model: convert existing content into another
 * schema, import a spreadsheet, or start from a ready-made template.
 */
export function ContentHelper({
  activityId,
  schemaType,
  onApply,
}: {
  activityId: string
  schemaType: HelperSchema
  onApply: (result: PasteResult, mode: 'append' | 'replace') => void
}) {
  const tt = useTranslate()
  const locale = useLocale()
  const fileInput = useRef<HTMLInputElement>(null)
  const [importState, setImportState] = useState<'idle' | 'reading' | 'error'>('idle')

  const availableConversions = conversionsFrom(schemaType as SchemaType)
  const availableTemplates = templatesFor(schemaType as SchemaType)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setImportState('reading')
    try {
      const rows = await readSpreadsheet(file)
      const result = rowsToResult(schemaType, rows)
      if (result.rows.length === 0) {
        setImportState('error')
        return
      }
      onApply(result, 'append')
      setImportState('idle')
    } catch {
      setImportState('error')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <details className="rounded-(--radius-card) border border-border bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink">
        {tt('helper.title')}
      </summary>

      <div className="flex flex-col gap-6 border-t border-border px-4 py-4">
        {/* ── file import ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink">{tt('helper.import.title')}</h3>
          <p className="text-sm text-ink-soft">{tt('helper.import.hint')}</p>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.txt,.xlsx,.xlsm,text/csv"
            onChange={(event) => void handleFile(event.target.files?.[0])}
            className="text-sm text-ink file:mr-3 file:h-10 file:cursor-pointer file:rounded-xl file:border file:border-border file:bg-surface-2 file:px-3 file:text-sm file:text-ink"
          />
          {importState === 'reading' ? (
            <p className="text-sm text-ink-soft">{tt('helper.import.reading')}</p>
          ) : null}
          {importState === 'error' ? (
            <p className="text-sm text-danger">{tt('helper.import.failed')}</p>
          ) : null}
        </section>

        {/* ── templates ───────────────────────────────────────────────── */}
        {availableTemplates.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink">
              {tt('helper.templates.title')}
            </h3>
            <p className="text-sm text-ink-soft">{tt('helper.templates.hint')}</p>
            <ul className="flex flex-col gap-2">
              {availableTemplates.map((template) => (
                <li
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <span className="text-sm text-ink">{tt(template.nameKey)}</span>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (template.schemaType === 'pairs') {
                        onApply(
                          {
                            schemaType: 'pairs',
                            rows: pairDraftsFrom(template.content),
                            skipped: 0,
                          },
                          'replace',
                        )
                      } else if (template.schemaType === 'mcq') {
                        onApply(
                          {
                            schemaType: 'mcq',
                            rows: mcqDraftsFrom(template.content),
                            skipped: 0,
                          },
                          'replace',
                        )
                      } else {
                        onApply(
                          {
                            schemaType: 'groups',
                            rows: groupDraftsFrom(template.content),
                            skipped: 0,
                          },
                          'replace',
                        )
                      }
                    }}
                  >
                    {tt('helper.templates.use')}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ── schema conversion ───────────────────────────────────────── */}
        {availableConversions.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink">
              {tt('helper.convert.title')}
            </h3>
            <p className="text-sm text-ink-soft">{tt('helper.convert.hint')}</p>
            <ul className="flex flex-col gap-2">
              {availableConversions.map((conversion) => (
                <li
                  key={conversion.id}
                  className="rounded-xl border border-border px-3 py-3"
                >
                  <p className="text-sm font-medium text-ink">
                    {tt(conversion.labelKey)}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{tt(conversion.hintKey)}</p>
                  <form action={createFromConversion} className="mt-2">
                    <input type="hidden" name="sourceId" value={activityId} />
                    <input type="hidden" name="conversionId" value={conversion.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <Button type="submit" variant="secondary">
                      {tt('convert.create')}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  )
}
