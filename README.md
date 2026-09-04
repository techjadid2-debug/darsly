# Darsly

Wordwall-style interactive activity maker for teachers in Uzbekistan. A teacher
enters content **once** — word pairs, questions, categories — and the same
content renders as several different games. UI in Uzbek (default) and Russian.

## Core architecture rule

Content is separate from presentation. One `activities` row can be rendered by
any game whose `schema_type` matches, so "switch game" never requires
re-entering data.

Four content schemas, defined as zod schemas in `lib/schemas.ts` (M2):

| Schema     | Shape |
|------------|-------|
| `pairs`    | `{ items: [{ id, term, definition, image_url? }] }` |
| `mcq`      | `{ items: [{ id, question, options: string[], correct_index }] }` |
| `groups`   | `{ groups: [{ name, items: string[] }] }` |
| `sequence` | `{ items: [{ id, text, blanks: number[] }] }` |

Games are registered in `lib/games.ts`. Adding game #7 means adding one file
under `components/games/<name>/index.tsx` plus one registry entry — nothing else.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 ·
Supabase (Postgres + Auth + RLS) via `@supabase/ssr` · `@dnd-kit/core` ·
`framer-motion` · deployed on Vercel.

No Redux, no tRPC, no ORM. Mutations go through server actions; the browser
never writes to `activities` directly.

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in the three values
pnpm dev
pnpm test                    # unit tests for the content logic
```

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` key |
| `NEXT_PUBLIC_SITE_URL` | Fallback origin; auth redirects prefer the request host |
| `TELEGRAM_BOT_TOKEN` | M7 only, server-side |

There is no `SUPABASE_SERVICE_ROLE_KEY` and no LLM API key: `play_count` is
incremented through a `SECURITY DEFINER` RPC, and content generation is pure
TypeScript (schema converters + file import), not an AI call.

## Database

Migrations live in `supabase/migrations/` and are the source of truth.

- `0001_init.sql` — `profiles`, `activities`, `results`; indexes; the
  `updated_at` trigger; the signup trigger that creates a profile row; RLS.
- `0002_harden_functions.sql` — pins `search_path` and revokes public `EXECUTE`
  on the trigger functions.

RLS in one line: owners have full access to their activities, anyone (including
anonymous visitors) can read public ones, anyone can submit a result to an
activity they are allowed to play, and only the owner can read results back.

## Milestones

| | Scope | Status |
|---|---|---|
| M1 | Setup, auth, migrations, RLS, empty dashboard, first deploy | done |
| M2 | zod schemas, game registry, editor (pairs + mcq), quiz + match-up, `/play` | done |
| M3 | Remaining 4 games, game switching, settings (timer, shuffle) | |
| M4 | Content helper: schema converters, CSV/XLSX import, templates | |
| M5 | `/library`, `is_public`, search/filter, `play_count` | |
| M6 | `/embed`, `/print`, `/api/results` + results view | |
| M7 | Telegram Mini App support | |
