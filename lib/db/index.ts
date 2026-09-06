import { neon } from '@neondatabase/serverless'
import type { SchemaType } from '@/lib/schemas'

function getDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'Missing POSTGRES_URL or DATABASE_URL environment variable. ' +
        'Connect Vercel Postgres in your Vercel Dashboard or add POSTGRES_URL to .env.local.',
    )
  }
  return url
}

export function getSql() {
  return neon(getDatabaseUrl())
}

let tablesInitialized = false

/** Automatically ensures required tables and indexes exist. */
export async function ensureTables(): Promise<void> {
  if (tablesInitialized) return

  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL DEFAULT '',
      description text,
      schema_type text NOT NULL,
      content jsonb NOT NULL,
      default_game text NOT NULL,
      settings jsonb NOT NULL DEFAULT '{}'::jsonb,
      subject text,
      grade text,
      lang text NOT NULL DEFAULT 'uz',
      is_public boolean NOT NULL DEFAULT false,
      play_count int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS results (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      player_name text,
      player_tg_id bigint,
      game text NOT NULL,
      score int NOT NULL,
      max_score int NOT NULL,
      duration_sec int NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS activities_public_idx ON activities (is_public, subject, grade);
  `
  await sql`
    CREATE INDEX IF NOT EXISTS results_activity_id_idx ON results (activity_id);
  `

  tablesInitialized = true
}

export type ActivityRecord = {
  id: string
  title: string
  description: string | null
  schema_type: SchemaType
  content: unknown
  default_game: string
  settings: unknown
  subject: string | null
  grade: string | null
  lang: string
  is_public: boolean
  play_count: number
  created_at: string
  updated_at: string
}

export type ResultRecord = {
  id: string
  activity_id: string
  player_name: string | null
  player_tg_id: number | null
  game: string
  score: number
  max_score: number
  duration_sec: number
  created_at: string
}

/** Fetches all activities for the teacher dashboard, newest first. */
export async function getAllActivities(): Promise<ActivityRecord[]> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    SELECT id, title, description, schema_type, content, default_game,
           settings, subject, grade, lang, is_public, play_count,
           created_at, updated_at
    FROM activities
    ORDER BY updated_at DESC
  `
  return rows as ActivityRecord[]
}

/** Fetches one activity by ID. */
export async function getActivityById(id: string): Promise<ActivityRecord | null> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    SELECT id, title, description, schema_type, content, default_game,
           settings, subject, grade, lang, is_public, play_count,
           created_at, updated_at
    FROM activities
    WHERE id = ${id}
    LIMIT 1
  `
  return (rows[0] as ActivityRecord) ?? null
}

/** Creates a new activity and returns its ID. */
export async function createActivityRecord(data: {
  schema_type: SchemaType
  content: unknown
  default_game: string
  title?: string
}): Promise<string> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    INSERT INTO activities (schema_type, content, default_game, title)
    VALUES (
      ${data.schema_type},
      ${JSON.stringify(data.content)},
      ${data.default_game},
      ${data.title ?? ''}
    )
    RETURNING id
  `
  return (rows[0]?.id as string) ?? ''
}

/** Updates an existing activity. */
export async function updateActivityRecord(
  id: string,
  data: {
    title: string
    content: unknown
    default_game: string
    settings: unknown
    subject?: string | null
    grade?: string | null
    is_public?: boolean
  },
): Promise<boolean> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    UPDATE activities
    SET title = ${data.title},
        content = ${JSON.stringify(data.content)},
        default_game = ${data.default_game},
        settings = ${JSON.stringify(data.settings)},
        subject = ${data.subject ?? null},
        grade = ${data.grade ?? null},
        is_public = ${data.is_public ?? false},
        updated_at = now()
    WHERE id = ${id}
    RETURNING id
  `
  return rows.length > 0
}

/** Duplicates an existing activity. */
export async function duplicateActivityRecord(id: string, newTitle: string): Promise<string | null> {
  await ensureTables()
  const sql = getSql()
  const existing = await getActivityById(id)
  if (!existing) return null

  const rows = await sql`
    INSERT INTO activities (
      title, description, schema_type, content, default_game,
      settings, subject, grade, lang, is_public
    )
    VALUES (
      ${newTitle},
      ${existing.description},
      ${existing.schema_type},
      ${JSON.stringify(existing.content)},
      ${existing.default_game},
      ${JSON.stringify(existing.settings)},
      ${existing.subject},
      ${existing.grade},
      ${existing.lang},
      ${existing.is_public}
    )
    RETURNING id
  `
  return (rows[0]?.id as string) ?? null
}

/** Deletes an activity by ID. */
export async function deleteActivityRecord(id: string): Promise<boolean> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    DELETE FROM activities
    WHERE id = ${id}
    RETURNING id
  `
  return rows.length > 0
}

/** Atomically increments play_count for an activity. */
export async function incrementPlayCountRecord(id: string): Promise<void> {
  await ensureTables()
  const sql = getSql()
  await sql`
    UPDATE activities
    SET play_count = play_count + 1
    WHERE id = ${id}
  `
}

/** Inserts a game play result. */
export async function insertResultRecord(data: {
  activity_id: string
  player_name?: string | null
  player_tg_id?: number | null
  game: string
  score: number
  max_score: number
  duration_sec: number
}): Promise<string> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    INSERT INTO results (
      activity_id, player_name, player_tg_id, game, score, max_score, duration_sec
    )
    VALUES (
      ${data.activity_id},
      ${data.player_name ?? null},
      ${data.player_tg_id ?? null},
      ${data.game},
      ${data.score},
      ${data.max_score},
      ${data.duration_sec}
    )
    RETURNING id
  `
  return (rows[0]?.id as string) ?? ''
}

/** Gets recent results for an activity (up to 50). */
export async function getResultsForActivity(activityId: string): Promise<ResultRecord[]> {
  await ensureTables()
  const sql = getSql()
  const rows = await sql`
    SELECT id, activity_id, player_name, player_tg_id, game,
           score, max_score, duration_sec, created_at
    FROM results
    WHERE activity_id = ${activityId}
    ORDER BY created_at DESC
    LIMIT 50
  `
  return rows as ResultRecord[]
}

/** Gets public activities for the public library. */
export async function getPublicActivities(params?: {
  subject?: string | null
  grade?: string | null
  schemaType?: string | null
  search?: string | null
  limit?: number
}): Promise<ActivityRecord[]> {
  await ensureTables()
  const sql = getSql()
  const limit = params?.limit ?? 60

  let query = `
    SELECT id, title, description, schema_type, content, default_game,
           subject, grade, lang, play_count, updated_at
    FROM activities
    WHERE is_public = true
  `
  const values: unknown[] = []
  let paramIndex = 1

  if (params?.subject) {
    query += ` AND subject = $${paramIndex++}`
    values.push(params.subject)
  }
  if (params?.grade) {
    query += ` AND grade = $${paramIndex++}`
    values.push(params.grade)
  }
  if (params?.schemaType) {
    query += ` AND schema_type = $${paramIndex++}`
    values.push(params.schemaType)
  }
  if (params?.search) {
    query += ` AND title ILIKE $${paramIndex++}`
    values.push(`%${params.search}%`)
  }

  query += ` ORDER BY play_count DESC, updated_at DESC LIMIT $${paramIndex++}`
  values.push(limit)

  const rows = await sql.query(query, values)
  return rows as unknown as ActivityRecord[]
}
