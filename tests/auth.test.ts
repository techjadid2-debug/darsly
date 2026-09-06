import assert from 'node:assert/strict'
import { test } from 'node:test'

import { verifyTeacherPassword } from '@/lib/auth/session'

test('verifyTeacherPassword validates against TEACHER_PASSWORD', () => {
  const original = process.env.TEACHER_PASSWORD
  try {
    process.env.TEACHER_PASSWORD = 'test-secret-pass'
    assert.equal(verifyTeacherPassword('test-secret-pass'), true)
    assert.equal(verifyTeacherPassword('wrong-pass'), false)
    assert.equal(verifyTeacherPassword(''), false)
  } finally {
    process.env.TEACHER_PASSWORD = original
  }
})

test('verifyTeacherPassword uses default password when env is not set', () => {
  const original = process.env.TEACHER_PASSWORD
  try {
    delete process.env.TEACHER_PASSWORD
    assert.equal(verifyTeacherPassword('darsly123'), true)
    assert.equal(verifyTeacherPassword('wrong'), false)
  } finally {
    process.env.TEACHER_PASSWORD = original
  }
})
