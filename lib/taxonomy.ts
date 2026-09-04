import type { TKey } from '@/lib/i18n'

/**
 * Subject and grade vocabularies for the library filters. Stored as short
 * slugs on the activity row; displayed through i18n so the label follows the
 * viewer's locale rather than the author's.
 */

export const subjects = [
  'math',
  'uzbek',
  'english',
  'russian',
  'biology',
  'chemistry',
  'physics',
  'history',
  'geography',
  'informatics',
  'other',
] as const

export type Subject = (typeof subjects)[number]

export const subjectKeys: Record<Subject, TKey> = {
  math: 'subject.math',
  uzbek: 'subject.uzbek',
  english: 'subject.english',
  russian: 'subject.russian',
  biology: 'subject.biology',
  chemistry: 'subject.chemistry',
  physics: 'subject.physics',
  history: 'subject.history',
  geography: 'subject.geography',
  informatics: 'subject.informatics',
  other: 'subject.other',
}

export function isSubject(value: string | null | undefined): value is Subject {
  return typeof value === 'string' && (subjects as readonly string[]).includes(value)
}

/** School grades in Uzbekistan run 1 to 11. */
export const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const

export type Grade = (typeof grades)[number]

export function isGrade(value: string | null | undefined): value is Grade {
  return typeof value === 'string' && (grades as readonly string[]).includes(value)
}
