import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#batch-status')).toContainText(
    'Evaluation complete',
  );
}
async function at(page: Page, q: string, r: string): Promise<void> {
  await page.locator('#q').fill(q);
  await page.locator('#r').fill(r);
  await page.getByRole('button', { name: 'Apply mode at coordinate' }).click();
}
async function calculate(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Evaluate all targets' }).click();
  await expect(page.locator('#batch-status')).toContainText(
    'Evaluation complete',
  );
}
test('production app displays complete exact evidence, orientations, zoom and keyboard selection', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await expect(page.locator('#target-inspection')).toContainText(
    'Exact lattice distance: 2',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await expect(page.locator('#target-inspection')).toContainText('[1/4, 3/4]');
  await expect(page.locator('[data-cell="1,0"]')).toHaveClass(/blocker/);
  const before = await page.locator('#board').getAttribute('viewBox');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(before);
  const bounds = await page.locator('#board').boundingBox();
  if (!bounds) throw new Error('Board bounds');
  const beforeDrag = await page.locator('#board').getAttribute('viewBox');
  await page.mouse.move(bounds.x + 8, bounds.y + 8);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 68, bounds.y + 38);
  await page.mouse.up();
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(
    beforeDrag,
  );
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  await page.screenshot({
    path: 'docs/screenshots/m3a-desktop.png',
    fullPage: true,
  });
  const keys = await page
    .locator('[data-cell]:not(.absent)')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('data-cell')).sort(),
    );
  await page.getByLabel('Presentation', { exact: true }).selectOption('flat');
  expect(
    await page
      .locator('[data-cell]:not(.absent)')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-cell')).sort(),
      ),
  ).toEqual(keys);
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await page.locator('[data-cell="3,0"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#selections')).toContainText('Target: 3,0');
  await page.locator('#board').focus();
  const pan = await page.locator('#board').getAttribute('viewBox');
  await page.keyboard.press('ArrowLeft');
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(pan);
  expect(errors).toEqual([]);
});
test('editing stacks, cells, edge features and deleting selections remains consistent', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '1', '0');
  await page
    .getByRole('button', { name: 'Add obstacle to stack', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add transparent marker', exact: true })
    .click();
  await expect(page.locator('#contents .stack-row')).toHaveCount(3);
  await page
    .locator('#contents .stack-row')
    .last()
    .getByRole('button', { name: 'Move earlier' })
    .click();
  await expect(page.locator('#contents .stack-row').nth(1)).toContainText(
    'Transparent marker',
  );
  await page.locator('#edge-side button').click();
  await page
    .getByRole('button', { name: 'Add edge marker', exact: true })
    .click();
  await expect(page.locator('.has-feature')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Remove', exact: true })
    .last()
    .click();
  await expect(page.locator('.has-feature')).toHaveCount(0);
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await at(page, '1', '0');
  await expect(page.locator('[data-cell="1,0"]')).toHaveClass(/absent/);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await page.locator('[data-cell="1,0"] polygon').click();
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await page.locator('[data-cell="13,0"] polygon').click();
  await expect(page.locator('#board-count')).toHaveText('118 existing cells');
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await at(page, '0', '0');
  await expect(page.locator('#selections')).toContainText('Observer: None');
  await page.getByRole('button', { name: 'Evaluate all targets' }).click();
  await expect(page.locator('#batch-status')).toContainText(
    'Choose an existing observer',
  );
  await at(page, '1', '0');
  await expect(page.locator('#selections')).toContainText('Target: None');
});
test('range/policy changes invalidate results; limits refuse rather than truncate', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Unlimited range').uncheck();
  await page.getByLabel('Range (inclusive lattice distance)').fill('1');
  await page.getByLabel('Range (inclusive lattice distance)').press('Tab');
  await calculate(page);
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/out-of-range/);
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: Out of range',
  );
  await page.getByLabel('Contact policy').selectOption('generic.any-contact');
  await expect(page.locator('#batch-status')).toContainText('need evaluation');
  await calculate(page);
  await page
    .getByLabel('Width', { exact: true })
    .fill('100000000000000000000000');
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Generation limit');
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await page.getByLabel('Width', { exact: true }).fill('0');
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await expect(page.locator('#board-count')).toHaveText('0 existing cells');
  await expect(page.locator('[data-cell="0,0"]')).toHaveClass(/absent/);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '9007199254740993', '-9007199254740993');
  await expect(
    page.locator('[data-cell="9007199254740993,-9007199254740993"]'),
  ).not.toHaveClass(/absent/);
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '9007199254740993', '-9007199254740993');
  await calculate(page);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '9007199254741993', '-9007199254740993');
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '9007199254741993', '-9007199254740993');
  await calculate(page);
  await expect(page.locator('#target-inspection')).toContainText(
    'Geometry candidate limit exceeded',
  );
  await expect(
    page.locator('[data-cell="9007199254741993,-9007199254740993"]'),
  ).toHaveClass(/failed/);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '9007199255740993', '-9007199254740993');
  await page.getByRole('button', { name: 'Evaluate all targets' }).click();
  await expect(page.locator('#batch-status')).toContainText('Batch refused');
  await expect(page.locator('#target-inspection')).not.toContainText(
    'Physical LOS: Clear',
  );
});
test('responsive browser view keeps board and controls usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await expect(page.locator('#board')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: 'docs/screenshots/m3a-mobile.png',
    fullPage: true,
  });
});
test('invalid range cannot evaluate a stale configuration; unsafe display edits are atomic', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Unlimited range').uncheck();
  await page.getByLabel('Range (inclusive lattice distance)').fill('-1');
  await page.getByLabel('Range (inclusive lattice distance)').press('Tab');
  await expect(
    page.getByRole('button', { name: 'Evaluate all targets' }),
  ).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('nonnegative');
  await expect(page.locator('#target-inspection')).not.toContainText(
    'Physical LOS: Blocked',
  );
  await page.getByLabel('Unlimited range').check();
  await calculate(page);
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '1000000000000000000000000000000', '0');
  await expect(page.getByRole('alert')).toContainText(
    'safe numeric conversion',
  );
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '2', '0');
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
});
