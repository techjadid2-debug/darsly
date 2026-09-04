'use client'

import Papa from 'papaparse'

import { normalizeRows } from '@/lib/parse'

/**
 * Reads a spreadsheet in the browser and returns rows of cells, which the
 * `rowsTo*` functions in `lib/parse.ts` then turn into content — the same path
 * bulk paste takes.
 *
 * The xlsx reader is imported lazily so its parser is only downloaded when a
 * teacher actually picks an .xlsx file.
 */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
    // The default export returns every sheet; `readSheet` returns the rows of
    // the first one, which is what a teacher's spreadsheet actually holds.
    const { readSheet } = await import('read-excel-file/browser')
    const rows = await readSheet(file)
    return normalizeRows(rows)
  }

  const text = await file.text()
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
    // Papa detects comma, semicolon or tab on its own, which covers the
    // regional CSV variants Excel produces.
  })
  return normalizeRows(parsed.data)
}
