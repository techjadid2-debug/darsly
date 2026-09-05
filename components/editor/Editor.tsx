'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { saveActivity } from '@/app/actions/activities'
import { BulkPasteDialog, type PasteResult } from '@/components/editor/BulkPasteDialog'
import { ContentHelper } from '@/components/editor/ContentHelper'
import { GameChips } from '@/components/editor/GameChips'
import { GroupsTable } from '@/components/editor/GroupsTable'
import { McqTable } from '@/components/editor/McqTable'
import { PairsTable } from '@/components/editor/PairsTable'
import { PublishPanel } from '@/components/editor/PublishPanel'
import { SettingsPanel } from '@/components/editor/SettingsPanel'
import { SharePanel } from '@/components/editor/SharePanel'
import { useTranslate } from '@/components/LocaleProvider'
import { GameShell } from '@/components/player/GameShell'
import { Button } from '@/components/ui/Button'
import {
  emptyGroupDraft,
  emptyMcqDraft,
  emptyPairDraft,
  groupDraftsFrom,
  mcqDraftsFrom,
  pairDraftsFrom,
  toGroupsContent,
  toMcqContent,
  toPairsContent,
  type GroupDraft,
  type McqDraft,
  type PairDraft,
} from '@/lib/drafts'
import { gamesForSchema, getGame, resolveGame } from '@/lib/games'
import {
  countItems,
  groupsContentSchema,
  mcqContentSchema,
  pairsContentSchema,
  type ActivitySettings,
} from '@/lib/schemas'

/** Schemas the editor can edit. `sequence` has no game in the MVP set. */
export type EditableSchema = 'pairs' | 'mcq' | 'groups'

type Rows =
  | { schemaType: 'pairs'; rows: PairDraft[] }
  | { schemaType: 'mcq'; rows: McqDraft[] }
  | { schemaType: 'groups'; rows: GroupDraft[] }

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 800
/** One silent retry rides out a transient blip before the teacher is asked. */
const RETRY_DELAY_MS = 2000

function initialRows(schemaType: EditableSchema, raw: unknown): Rows {
  if (schemaType === 'pairs') {
    const parsed = pairsContentSchema.safeParse(raw)
    const rows = parsed.success ? pairDraftsFrom(parsed.data) : []
    return { schemaType, rows: rows.length ? rows : [emptyPairDraft()] }
  }
  if (schemaType === 'mcq') {
    const parsed = mcqContentSchema.safeParse(raw)
    const rows = parsed.success ? mcqDraftsFrom(parsed.data) : []
    return { schemaType, rows: rows.length ? rows : [emptyMcqDraft()] }
  }
  const parsed = groupsContentSchema.safeParse(raw)
  const rows = parsed.success ? groupDraftsFrom(parsed.data) : []
  return { schemaType, rows: rows.length ? rows : [emptyGroupDraft(), emptyGroupDraft()] }
}

function contentOf(state: Rows): unknown {
  switch (state.schemaType) {
    case 'pairs':
      return toPairsContent(state.rows)
    case 'mcq':
      return toMcqContent(state.rows)
    case 'groups':
      return toGroupsContent(state.rows)
  }
}

function applyPaste(previous: Rows, result: PasteResult, mode: 'append' | 'replace'): Rows {
  if (previous.schemaType === 'pairs' && result.schemaType === 'pairs') {
    const existing = mode === 'replace' ? [] : previous.rows
    return { schemaType: 'pairs', rows: [...existing, ...result.rows] }
  }
  if (previous.schemaType === 'mcq' && result.schemaType === 'mcq') {
    const existing = mode === 'replace' ? [] : previous.rows
    return { schemaType: 'mcq', rows: [...existing, ...result.rows] }
  }
  if (previous.schemaType === 'groups' && result.schemaType === 'groups') {
    const existing = mode === 'replace' ? [] : previous.rows
    return { schemaType: 'groups', rows: [...existing, ...result.rows] }
  }
  return previous
}

export function Editor({
  id,
  schemaType,
  initialTitle,
  initialContent,
  initialGameId,
  initialSettings,
  initialSubject,
  initialGrade,
  initialIsPublic,
  siteUrl,
}: {
  id: string
  schemaType: EditableSchema
  initialTitle: string
  initialContent: unknown
  initialGameId: string
  initialSettings: ActivitySettings
  initialSubject: string | null
  initialGrade: string | null
  initialIsPublic: boolean
  siteUrl: string
}) {
  const tt = useTranslate()

  const [title, setTitle] = useState(initialTitle)
  const [state, setState] = useState<Rows>(() => initialRows(schemaType, initialContent))
  const [settings, setSettings] = useState<ActivitySettings>(initialSettings)
  const [subject, setSubject] = useState<string | null>(initialSubject)
  const [grade, setGrade] = useState<string | null>(initialGrade)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
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
    () => ({ id, title, content, defaultGame: gameId, settings, subject, grade, isPublic }),
    [id, title, content, gameId, settings, subject, grade, isPublic],
  )
  const serialized = JSON.stringify(payload)
  const payloadRef = useRef(payload)
  payloadRef.current = payload
  const isFirstRender = useRef(true)

  // Held so a fresh edit supersedes a scheduled retry rather than racing it.
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (attempt = 0): Promise<void> => {
    setStatus('saving')
    const result = await saveActivity(payloadRef.current)
    if (result.ok) {
      setStatus('saved')
      return
    }
    // Stay in 'saving' through the automatic attempt: it is still trying, and
    // saying otherwise would ask the teacher to act on a blip that self-heals.
    if (attempt === 0) {
      retryTimer.current = setTimeout(() => void save(1), RETRY_DELAY_MS)
      return
    }
    setStatus('error')
  }, [])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (retryTimer.current) clearTimeout(retryTimer.current)
    setStatus('saving')
    const timer = setTimeout(() => void save(), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [serialized, save])

  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
    },
    [],
  )

  // The debounce is a window where the last keystrokes exist only in this tab,
  // and a failed save is that same window held open indefinitely. Both are
  // worth a browser warning; 'saved' and 'idle' are not.
  const unsaved = status === 'saving' || status === 'error'
  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  function addRow() {
    setState((previous) => {
      switch (previous.schemaType) {
        case 'pairs':
          return { schemaType: 'pairs', rows: [...previous.rows, emptyPairDraft()] }
        case 'mcq':
          return { schemaType: 'mcq', rows: [...previous.rows, emptyMcqDraft()] }
        case 'groups':
          return { schemaType: 'groups', rows: [...previous.rows, emptyGroupDraft()] }
      }
    })
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

        <PublishPanel
          subject={subject}
          grade={grade}
          isPublic={isPublic}
          onChange={(patch) => {
            if (patch.subject !== undefined) setSubject(patch.subject)
            if (patch.grade !== undefined) setGrade(patch.grade)
            if (patch.isPublic !== undefined) setIsPublic(patch.isPublic)
          }}
        />

        <SettingsPanel settings={settings} onChange={setSettings} />

        <SharePanel activityId={id} isPublic={isPublic} siteUrl={siteUrl} />

        <ContentHelper
          activityId={id}
          schemaType={schemaType}
          onApply={(result, mode) =>
            setState((previous) => applyPaste(previous, result, mode))
          }
        />

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">{tt('editor.content')}</h2>
          <span className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={status === 'error' ? 'text-sm text-danger' : 'text-sm text-ink-soft'}
            >
              {statusLabel[status]}
            </span>
            {status === 'error' ? (
              <button
                type="button"
                onClick={() => void save()}
                className="text-sm font-medium text-brand hover:underline"
              >
                {tt('common.retry')}
              </button>
            ) : null}
          </span>
        </div>

        {state.schemaType === 'pairs' ? (
          <PairsTable
            rows={state.rows}
            onChange={(rows) => setState({ schemaType: 'pairs', rows })}
          />
        ) : state.schemaType === 'mcq' ? (
          <McqTable
            rows={state.rows}
            onChange={(rows) => setState({ schemaType: 'mcq', rows })}
          />
        ) : (
          <GroupsTable
            rows={state.rows}
            onChange={(rows) => setState({ schemaType: 'groups', rows })}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addRow}>
            + {schemaType === 'groups' ? tt('editor.addGroup') : tt('editor.addRow')}
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
          {countItems(schemaType, content) === 0 ? (
            // A half-typed first row would otherwise render the game's own
            // "nothing here" state, which reads like the game is broken.
            <p className="py-6 text-center text-sm text-ink-soft">
              {tt('editor.emptyPreview')}
            </p>
          ) : activeGame ? (
            <GameShell
              key={`${activeGame.id}-${JSON.stringify(content)}-${JSON.stringify(settings)}`}
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
            setState((previous) => applyPaste(previous, result, mode))
            setPasteOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
