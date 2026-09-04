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

`sequence` is defined but no MVP game consumes it, so `/create` does not offer
it yet — an activity of that type would have nothing to play it with.

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
- `0003_play_count_rpc.sql` — `increment_play_count`, the one write an anonymous
  player is allowed to make.

RLS in one line: owners have full access to their activities, anyone (including
anonymous visitors) can read public ones, anyone can submit a result to an
activity they are allowed to play, and only the owner can read results back.

## Milestones

| | Scope | Status |
|---|---|---|
| M1 | Setup, auth, migrations, RLS, empty dashboard, first deploy | done |
| M2 | zod schemas, game registry, editor (pairs + mcq), quiz + match-up, `/play` | done |
| M3 | Remaining 4 games, game switching, settings (timer, shuffle) | done |
| M4 | Content helper: schema converters, CSV/XLSX import, templates | done |
| M5 | `/library`, `is_public`, search/filter, `play_count` | done |
| M6 | `/embed`, `/print`, `/api/results` + results view | done |
| M7 | Telegram Mini App support | done |

## Content generation, without a model

There is no LLM in this project. `lib/converters.ts` turns content a teacher
already has into another schema — pairs into multiple choice (wrong options are
drawn from the other rows' definitions), multiple choice back into pairs,
grouped items into "which group?" questions. Everything is seeded off the
source item's id, so converting twice gives the same activity, and a converted
activity is always a **new** row: the source is never touched.

Alongside it, `lib/import-file.ts` reads CSV and .xlsx in the browser and
`lib/templates.ts` ships starter sets. Bulk paste, file upload and templates all
funnel through the same `rowsTo*` functions in `lib/parse.ts`.

## Telegram Mini App

`/play` and `/embed` load `telegram-web-app.js`. When a result is submitted from
inside Telegram the signed `initData` blob rides along, and `lib/telegram.ts`
verifies it server-side (HMAC-SHA256 under the `WebAppData` key, plus a 24-hour
freshness check) before any `player_tg_id` is stored. A payload that fails
verification is not an error — the result is simply recorded as an ordinary
anonymous one, so a forged blob gains nothing. The bot itself is not built here.

## Known advisor warnings

`increment_play_count` is reported by the Supabase linter as a `SECURITY
DEFINER` function callable by `anon`. That is deliberate and is the point of the
function: an anonymous player must be able to count a play. It does exactly one
thing, only to a public activity, with `search_path` pinned.

Supabase's *leaked password protection* is off. The app itself never shows a
password form — auth is magic link and Google — but the password grant is still
enabled at the Supabase API level, so turning the setting on in the dashboard is
worth doing.
