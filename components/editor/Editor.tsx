'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { saveActivity } from '@/app/actions/activities'
import { BulkPasteDialog } from '@/components/editor/BulkPasteDialog'
import { GameChips } from '@/components/editor/GameChips'
import { McqTable } from '@/components/editor/McqTable'
import { PairsTable } from '@/components/editor/PairsTable'
import { useTranslate } from '@/components/LocaleProvider'
import { GameShell } from '@/components/player/GameShell'
import { Button } from '@/components/ui/Button'
import {
  emptyMcqDraft,
  emptyPairDraft,
  mcqDraftsFrom,
  pairDraftsFrom,
  toMcqContent,
  toPairsContent,
  type McqDraft,
  type PairDraft,
} from '@/lib/drafts'
import { gamesForSchema, getGame, resolveGame } from '@/lib/games'
import {
  mcqContentSchema,
  pairsContentSchema,
  type ActivitySettings,
} from '@/lib/schemas'

/** Schemas the editor can edit today. M3 widens this to all four. */
export type EditableSchema = 'pairs' | 'mcq'

type Rows =
  | { schemaType: 'pairs'; rows: PairDraft[] }
  | { schemaType: 'mcq'; rows: McqDraft[] }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 800

function initialRows(schemaType: EditableSchema, raw: unknown): Rows {
  if (schemaType === 'pairs') {
    const parsed = pairsContentSchema.safeParse(raw)
    const rows = parsed.success ? pairDraftsFrom(parsed.data) : []
    return { schemaType: 'pairs', rows: rows.length ? rows : [emptyPairDraft()] }
  }
  const parsed = mcqContentSchema.safeParse(raw)
  const rows = parsed.success ? mcqDraftsFrom(parsed.data) : []
  return { schemaType: 'mcq', rows: rows.length ? rows : [emptyMcqDraft()] }
}

function contentOf(state: Rows): unknown {
  return state.schemaType === 'pairs'
    ? toPairsContent(state.rows)
    : toMcqContent(state.rows)
}

export function Editor({
  id,
  schemaType,
  initialTitle,
  initialContent,
  initialGameId,
  settings,
}: {
  id: string
  schemaType: EditableSchema
  initialTitle: string
  initialContent: unknown
  initialGameId: string
  settings: ActivitySettings
}) {
  const tt = useTranslate()

  const [title, setTitle] = useState(initialTitle)
  const [state, setState] = useState<Rows>(() => initialRows(schemaType, initialContent))
  const [gameId, setGameId] = useState(
    () => resolveGame(schemaType, initialGameId, initialGameId)?.id ?? initialGameId,
  )
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [pasteOpen, setPasteOpen] = useState(false)

  const available = useMemo(() => gamesForSchema(schemaType), [schemaType])
  const activeGame = getGame(gameId) ?? available[0]
  const content = useMemo(() => contentOf(state), [state])

  // ── autosave ───────────────────────────────────────────────────────────────
  // The serialized payload is the effect's dependency, so a re-render that
  // changes nothing does not restart the timer.
  const payload = useMemo(
    () => ({ id, title, content, defaultGame: gameId }),
    [id, title, content, gameId],
  )
  const serialized = JSON.stringify(payload)
  const payloadRef = useRef(payload)
  payloadRef.current = payload
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setStatus('saving')
    const timer = setTimeout(() => {
      void saveActivity(payloadRef.current).then((result) => {
        setStatus(result.ok ? 'saved' : 'error')
      })
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [serialized])

  // ── row helpers ────────────────────────────────────────────────────────────
  function addRow() {
    setState((previous) =>
      previous.schemaType === 'pairs'
        ? { schemaType: 'pairs', rows: [...previous.rows, emptyPairDraft()] }
        : { schemaType: 'mcq', rows: [...previous.rows, emptyMcqDraft()] },
    )
  }

  const statusLabel: Record<SaveStatus, string> = {
    idle: '',
    saving: tt('editor.saving'),
    saved: tt('editor.saved'),
    error: tt('editor.saveFailed'),
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* ── left: input ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-title" className="text-sm font-medium text-ink">
            {tt('editor.titleLabel')}
          </label>
          <input
            id="activity-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={tt('editor.titlePlaceholder')}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-soft/70"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">{tt('editor.content')}</h2>
          <span
            aria-live="polite"
            className={
              status === 'error' ? 'text-sm text-danger' : 'text-sm text-ink-soft'
            }
          >
            {statusLabel[status]}
          </span>
        </div>

        {state.schemaType === 'pairs' ? (
          <PairsTable
            rows={state.rows}
            onChange={(rows) => setState({ schemaType: 'pairs', rows })}
          />
        ) : (
          <McqTable
            rows={state.rows}
            onChange={(rows) => setState({ schemaType: 'mcq', rows })}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addRow}>
            + {tt('editor.addRow')}
          </Button>
          <Button variant="secondary" onClick={() => setPasteOpen(true)}>
            {tt('editor.bulkPaste')}
          </Button>
        </div>
      </section>

      {/* ── right: live preview ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">{tt('editor.preview')}</h2>
          <Link
            href={`/play/${id}`}
            className="text-sm font-medium text-brand hover:underline"
          >
            {tt('editor.play')} →
          </Link>
        </div>

        <GameChips games={available} activeId={gameId} onSelect={setGameId} />

        <div className="rounded-(--radius-card) border border-border bg-bg p-4">
          {activeGame ? (
            <GameShell
              key={`${activeGame.id}-${JSON.stringify(content)}`}
              game={activeGame}
              rawContent={content}
              settings={settings}
            />
          ) : null}
        </div>
      </section>

      {pasteOpen ? (
        <BulkPasteDialog
          schemaType={schemaType}
          onClose={() => setPasteOpen(false)}
          onApply={(result, mode) => {
            setState((previous) => {
              if (previous.schemaType === 'pairs' && result.schemaType === 'pairs') {
                const existing = mode === 'replace' ? [] : previous.rows
                return { schemaType: 'pairs', rows: [...existing, ...result.rows] }
              }
              if (previous.schemaType === 'mcq' && result.schemaType === 'mcq') {
                const existing = mode === 'replace' ? [] : previous.rows
                return { schemaType: 'mcq', rows: [...existing, ...result.rows] }
              }
              return previous
            })
            setPasteOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
