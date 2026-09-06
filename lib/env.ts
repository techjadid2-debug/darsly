/**
 * Typed access to the environment variables the app needs.
 */
export const env = {
  postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
  teacherPassword: process.env.TEACHER_PASSWORD || 'darsly123',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const
