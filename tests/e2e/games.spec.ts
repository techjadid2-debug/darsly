import { expect, test } from '@playwright/test'

/**
 * Every game renders its content and can be reached, driven through the `/dev`
 * harness so no activity row or account is involved. `?shuffle=0` pins the
 * order — otherwise a spec cannot name an item.
 */

const RENDERS: ReadonlyArray<{ game: string; template: string; expect: string }> = [
  { game: 'quiz', template: 'math-quiz', expect: '7 × 8 = ?' },
  { game: 'match-up', template: 'en-basics', expect: 'olma' },
  { game: 'flashcards', template: 'en-basics', expect: 'olma' },
  { game: 'matching-pairs', template: 'en-basics', expect: 'Ikkita katakchani oching' },
  { game: 'anagram', template: 'en-basics', expect: 'Harflarni surib' },
  { game: 'group-sort', template: 'food-groups', expect: 'Mevalar' },
  { game: 'fill-blanks', template: 'water', expect: 'Bo‘sh joylarga' },
]

for (const { game, template, expect: text } of RENDERS) {
  test(`${game} renders its content`, async ({ page }) => {
    await page.goto(`/dev/game/${game}?template=${template}&shuffle=0`)

    await expect(page.getByRole('heading', { name: `${game} · ${template}` })).toBeVisible()
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible()
  })
}

test('a game whose schema does not match the template is a 404, not a broken render', async ({
  page,
}) => {
  // `quiz` is mcq; `en-basics` is pairs.
  const response = await page.goto('/dev/game/quiz?template=en-basics')
  expect(response?.status()).toBe(404)
})

test('quiz plays through to a score', async ({ page }) => {
  await page.goto('/dev/game/quiz?template=math-quiz&shuffle=0')

  // math-quiz has five questions. Which option is picked does not matter here;
  // reaching the score screen does.
  for (let question = 0; question < 5; question += 1) {
    const options = page.locator('button[aria-disabled]')
    await expect(options.first()).toBeVisible()
    await options.first().click()
    await page.getByRole('button', { name: /Keyingi|Yakunlash/ }).click()
  }

  await expect(page.getByText('Tugadi!')).toBeVisible()
  await expect(page.getByText(/\d+ \/ 5 ball/)).toBeVisible()
})

test('flashcards plays through to a score', async ({ page }) => {
  await page.goto('/dev/game/flashcards?template=en-basics&shuffle=0')

  for (let card = 0; card < 10; card += 1) {
    await page.getByRole('button', { name: 'Bildim' }).click()
  }

  await expect(page.getByText('Tugadi!')).toBeVisible()
  await expect(page.getByText('10 / 10')).toBeVisible()
})

test('fill-blanks scores a sentence filled from the word bank', async ({ page }) => {
  await page.goto('/dev/game/fill-blanks?template=water&shuffle=0')

  // The first sentence hides one word, so the bank holds exactly one chip.
  const bank = page.locator('main ul button')
  await expect(bank).toHaveCount(1)

  const slot = page.getByRole('button', { name: '1-bo‘sh joy' })
  await expect(slot).toBeVisible()
  await bank.first().click()

  // Filling the slot renames it and enables the check.
  await expect(page.getByRole('button', { name: /1-bo‘sh joy: / })).toBeVisible()
  await page.getByRole('button', { name: 'Tekshirish' }).click()
  await expect(page.getByText('To‘g‘ri!')).toBeVisible()
})

test('running out of time says so instead of just ending', async ({ page }) => {
  await page.goto('/dev/game/quiz?template=math-quiz&shuffle=0&timer=1')

  const card = page.getByRole('status')
  await expect(card).toContainText('Vaqt tugadi')
  await expect(card).toContainText('Tugadi!')
})
