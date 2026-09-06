import { cookies } from 'next/headers'
import crypto from 'node:crypto'

const SESSION_COOKIE_NAME = 'darsly_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function getSecretKey(): string {
  return process.env.SESSION_SECRET || process.env.TEACHER_PASSWORD || 'darsly-secret-key-salt-2026'
}

function getExpectedToken(): string {
  const secret = getSecretKey()
  return crypto.createHmac('sha256', secret).update('teacher_authenticated_v1').digest('hex')
}

/** Checks whether the current request comes from an authenticated teacher. */
export async function getTeacherSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!cookie?.value) return false

  const expected = getExpectedToken()
  try {
    return (
      cookie.value.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(cookie.value), Buffer.from(expected))
    )
  } catch {
    return false
  }
}

/** Creates a 30-day session cookie for the teacher. */
export async function createTeacherSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = getExpectedToken()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/** Clears the session cookie on logout. */
export async function clearTeacherSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/** Verifies the password against the configured TEACHER_PASSWORD. */
export function verifyTeacherPassword(password: string): boolean {
  const configuredPassword = process.env.TEACHER_PASSWORD || 'darsly123'
  if (!password || !configuredPassword) return false

  // Constant-time compare to prevent timing attacks
  const bufA = Buffer.from(password)
  const bufB = Buffer.from(configuredPassword)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
