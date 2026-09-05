import { LocaleProvider } from '@/components/LocaleProvider'
import { PrintButton } from '@/components/print/PrintButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { translator, type Locale, type Translate } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import {
  groupsContentSchema,
  isSchemaType,
  mcqContentSchema,
  pairsContentSchema,
  type SchemaType,
} from '@/lib/schemas'
import { shuffle } from '@/lib/shuffle'
import { createClient } from '@/lib/supabase/server'

const LETTERS: Record<Locale, readonly string[]> = {
  uz: ['A', 'B', 'C', 'D', 'E', 'F'],
  ru: ['А', 'Б', 'В', 'Г', 'Д', 'Е'],
}

const INSTRUCTIONS = {
  pairs: 'print.instructions.pairs',
  mcq: 'print.instructions.mcq',
  groups: 'print.instructions.groups',
  sequence: 'print.instructions.pairs',
} as const satisfies Record<SchemaType, string>

/** A ruled blank line for the student to write on. */
function BlankLine() {
  return <span className="ml-2 inline-block min-w-40 flex-1 border-b border-dashed border-black/50" />
}

type Sheet = { worksheet: React.ReactNode; answerKey: React.ReactNode } | null

function buildSheet(
  schemaType: SchemaType,
  content: unknown,
  tt: Translate,
  seed: string,
  letters: readonly string[],
): Sheet {
  if (schemaType === 'pairs') {
    const parsed = pairsContentSchema.safeParse(content)
    if (!parsed.success || parsed.data.items.length === 0) return null
    const items = parsed.data.items
    return {
      worksheet: (
        <ol className="flex list-decimal flex-col gap-4 pl-6">
          {items.map((item) => (
            <li key={item.id} className="flex items-baseline">
              <span className="font-medium">{item.term}</span>
              <BlankLine />
            </li>
          ))}
        </ol>
      ),
      answerKey: (
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {items.map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.term}</span> — {item.definition}
            </li>
          ))}
        </ol>
      ),
    }
  }

  if (schemaType === 'mcq') {
    const parsed = mcqContentSchema.safeParse(content)
    if (!parsed.success || parsed.data.items.length === 0) return null
    const items = parsed.data.items
    return {
      worksheet: (
        <ol className="flex list-decimal flex-col gap-4 pl-6">
          {items.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.question}</p>
              <ul className="mt-1 flex flex-col gap-0.5 pl-1">
                {item.options.map((option, index) => (
                  <li key={`${item.id}-${index}`}>
                    <span className="inline-block w-6">{letters[index] ?? index + 1})</span>
                    {option}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ),
      answerKey: (
        <ol className="flex list-decimal flex-col gap-1 pl-6">
          {items.map((item) => (
            <li key={item.id}>
              {letters[item.correct_index] ?? item.correct_index + 1}) {' '}
              {item.options[item.correct_index]}
            </li>
          ))}
        </ol>
      ),
    }
  }

  if (schemaType === 'groups') {
    const parsed = groupsContentSchema.safeParse(content)
    if (!parsed.success || parsed.data.groups.length === 0) return null
    const groups = parsed.data.groups
    // Seeded so the printed sheet is identical on every reload.
    const pool = shuffle(
      groups.flatMap((group) => group.items),
      seed,
    )
    return {
      worksheet: (
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-medium">{tt('print.items')}</p>
            <p className="mt-1">{pool.join(' · ')}</p>
          </div>
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.name}>
                <p className="font-medium">{group.name}</p>
                <div className="mt-1 h-16 border border-black/50" />
              </div>
            ))}
          </div>
        </div>
      ),
      answerKey: (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li key={group.name}>
              <span className="font-medium">{group.name}:</span> {group.items.join(', ')}
            </li>
          ))}
        </ul>
      ),
    }
  }

  return null
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const locale = await getLocale()
  const tt = translator(locale)

  const supabase = await createClient()
  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, description, schema_type, content')
    .eq('id', id)
    .maybeSingle()

  if (!activity) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <ErrorState title={tt('play.notFound.title')} body={tt('play.notFound.body')} />
      </main>
    )
  }

  if (!isSchemaType(activity.schema_type)) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <ErrorState title={tt('play.notFound.title')} body={tt('play.notFound.body')} />
      </main>
    )
  }

  const schemaType = activity.schema_type
  const sheet = buildSheet(schemaType, activity.content, tt, activity.id, LETTERS[locale])

  return (
    <LocaleProvider locale={locale}>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex justify-end print:hidden">
          <PrintButton />
        </div>

        {!sheet ? (
          <ErrorState title={tt('print.empty')} body={tt('play.empty.body')} />
        ) : (
          <article className="worksheet">
            <header className="border-b border-black/30 pb-3">
              <h1 className="text-xl font-semibold">
                {activity.title || tt('print.worksheet')}
              </h1>
              <div className="mt-3 flex flex-wrap gap-6 text-sm">
                <span className="flex flex-1 items-baseline">
                  {tt('print.name')}: <BlankLine />
                </span>
                <span className="flex flex-1 items-baseline">
                  {tt('print.date')}: <BlankLine />
                </span>
              </div>
            </header>

            <p className="mt-4 text-sm italic">{tt(INSTRUCTIONS[schemaType])}</p>

            <section className="mt-5">{sheet.worksheet}</section>

            {/* The key starts a fresh sheet so it can be kept back from students. */}
            <section className="mt-10 break-before-page">
              <h2 className="border-b border-black/30 pb-2 text-lg font-semibold">
                {tt('print.answerKey')}
              </h2>
              <div className="mt-4">{sheet.answerKey}</div>
            </section>
          </article>
        )}
      </div>
    </LocaleProvider>
  )
}
