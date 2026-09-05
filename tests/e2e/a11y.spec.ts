import { expect, test } from '@playwright/test'

/**
 * Regression cover for the accessibility bugs fixed in M8. Each of these was
 * invisible on screen — a sighted mouse user could not have noticed any of
 * them — so a unit test cannot replace driving the real DOM.
 */

test('a flashcard does not expose its answer before it is flipped', async ({ page }) => {
  await page.goto('/dev/game/flashcards?template=en-basics&shuffle=0')

  const card = page.locator('main button[aria-expanded]')
  await expect(card).toHaveAttribute('aria-expanded', 'false')

  // `backfaceVisibility` hides the far face visually but leaves it readable, so
  // the guard that matters is `aria-hidden`, not what is on screen.
  const faces = card.locator('> div > div')
  await expect(faces.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await expect(faces.nth(1)).toHaveAttribute('aria-hidden', 'true')
  await expect(faces.nth(1)).toContainText('apple')

  await card.click()
  await expect(card).toHaveAttribute('aria-expanded', 'true')
  await expect(faces.nth(0)).toHaveAttribute('aria-hidden', 'true')
  await expect(faces.nth(1)).toHaveAttribute('aria-hidden', 'false')
})

test('a face-down memory tile is named by position, not left nameless', async ({ page }) => {
  await page.goto('/dev/game/matching-pairs?template=en-basics&shuffle=0')

  const tiles = page.locator('main li button')
  await expect(tiles.first()).toHaveAttribute('aria-label', '1-katak, yopiq')
  await expect(tiles.nth(1)).toHaveAttribute('aria-label', '2-katak, yopiq')
  await expect(tiles.first()).toHaveText('?')

  // Face up, the tile's own text is its name and the position label is dropped.
  await tiles.first().click()
  await expect(tiles.first()).not.toHaveAttribute('aria-label', /./)
  await expect(tiles.first()).not.toHaveText('?')
})

test('answering a quiz question keeps the options reachable by keyboard', async ({ page }) => {
  await page.goto('/dev/game/quiz?template=math-quiz&shuffle=0')

  const options = page.locator('button[aria-disabled]')
  await expect(options).toHaveCount(4)
  await options.first().click()

  // `disabled` would drop all four out of the tab order exactly when
  // `show_answers` wants them reviewed.
  for (let i = 0; i < 4; i += 1) {
    await expect(options.nth(i)).toHaveAttribute('aria-disabled', 'true')
    await expect(options.nth(i)).not.toHaveAttribute('disabled', '')
  }
  await expect(page.getByText('To‘g‘ri javob')).toBeAttached()
})

test('drag instructions are in the app language, not dnd-kit English', async ({ page }) => {
  await page.goto('/dev/game/group-sort?template=food-groups&shuffle=0')

  const instructions = page.locator('[id^="DndDescribedBy"]')
  await expect(instructions).toContainText('probel')
  await expect(instructions).not.toContainText('space bar')
})

test('anagram letters can be reordered with the keyboard alone', async ({ page }) => {
  await page.goto('/dev/game/anagram?template=en-basics&shuffle=0')

  const tiles = page.locator('[aria-describedby^="DndDescribedBy"]')
  await expect(tiles.first()).toBeVisible()
  const before = await tiles.allInnerTexts()

  // Pick up, move one place, drop — the path a keyboard-only player takes.
  // Each step waits on dnd-kit's own live region rather than a sleep: the
  // sensor needs a tick to arm, and three presses in a row outrun it.
  const live = page.locator('[id^="DndLiveRegion"]')

  await tiles.first().focus()
  await page.keyboard.press('Space')
  await expect(live).not.toBeEmpty()

  // dnd-kit measures coordinates after pick-up and ignores arrow keys until it
  // has: press until the announcement moves rather than guessing a delay. The
  // letter starts at index 0, so extra presses only push it further right.
  const picked = (await live.textContent()) ?? ''
  await expect
    .poll(async () => {
      await page.keyboard.press('ArrowRight')
      return (await live.textContent()) ?? ''
    })
    .not.toBe(picked)

  await page.keyboard.press('Space')
  await expect
    .poll(async () => (await tiles.allInnerTexts()).join(''))
    .not.toBe(before.join(''))
})
