import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isLocale, locales, t, translationKeys, translator } from '@/lib/i18n'

/**
 * `ru` is typed `Record<TKey, string>`, so a missing key is already a build
 * error. What the type cannot see is the content of a translation: a Russian
 * string that drops `{n}` compiles fine and then silently renders "с" with no
 * number in front of it. These tests cover that gap.
 */

const placeholdersIn = (template: string): Set<string> =>
  new Set(template.match(/\{\w+\}/g) ?? [])

test('every translation carries the same placeholders in both locales', () => {
  for (const key of translationKeys) {
    const uz = placeholdersIn(t(key, 'uz'))
    const ru = placeholdersIn(t(key, 'ru'))

    assert.deepEqual(
      [...ru].sort(),
      [...uz].sort(),
      `placeholders differ between locales for "${key}"`,
    )
  }
})

test('no translation is blank in either locale', () => {
  for (const key of translationKeys) {
    for (const locale of locales) {
      assert.ok(t(key, locale).trim().length > 0, `"${key}" is blank in ${locale}`)
    }
  }
})

test('the dictionary is not empty and both locales are complete', () => {
  assert.ok(translationKeys.length > 100)
  for (const key of translationKeys) {
    for (const locale of locales) {
      assert.equal(typeof t(key, locale), 'string', `"${key}" missing in ${locale}`)
    }
  }
})

test('t fills the placeholders it is given', () => {
  assert.equal(t('grade.value', 'uz', { n: 7 }), t('grade.value', 'uz').replace('{n}', '7'))
  assert.equal(t('grade.value', 'ru', { n: 7 }), t('grade.value', 'ru').replace('{n}', '7'))
})

test('a placeholder with no matching param is left alone, not blanked', () => {
  // Rendering the literal `{n}` is ugly but debuggable; rendering "undefined"
  // or an empty gap is neither.
  const raw = t('grade.value', 'uz')
  assert.equal(t('grade.value', 'uz', { other: 1 }), raw)
  assert.ok(raw.includes('{n}'))
})

test('t defaults to Uzbek', () => {
  assert.equal(t('app.name'), t('app.name', 'uz'))
})

test('translator binds a locale once and behaves like t', () => {
  const tt = translator('ru')
  assert.equal(tt('common.signIn'), t('common.signIn', 'ru'))
  assert.equal(tt('grade.value', { n: 3 }), t('grade.value', 'ru', { n: 3 }))
})

test('isLocale accepts only the supported locales', () => {
  assert.equal(isLocale('uz'), true)
  assert.equal(isLocale('ru'), true)
  assert.equal(isLocale('en'), false)
  assert.equal(isLocale(''), false)
  assert.equal(isLocale(undefined), false)
})
