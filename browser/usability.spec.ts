import { test, expect, type Page, type Locator } from '@playwright/test';
test.use({ hasTouch: true });
async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await settled(page);
}
async function settled(page: Page): Promise<void> {
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'complete',
  );
}
async function count(page: Page): Promise<number> {
  return Number(
    await page.locator('#batch-status').getAttribute('data-evaluations'),
  );
}
async function at(page: Page, q: string, r: string): Promise<void> {
  await page.locator('#q').fill(q);
  await page.locator('#r').fill(r);
  await page.getByRole('button', { name: 'Apply mode at coordinate' }).click();
}
async function midpoint(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Missing bounds');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function drag(
  page: Page,
  locator: Locator,
  button: 'left' | 'middle' = 'left',
): Promise<void> {
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  const p = await midpoint(locator),
    before = await page.locator('#board').getAttribute('viewBox');
  await page.mouse.move(p.x, p.y);
  await page.mouse.down({ button });
  await page.mouse.move(p.x + 50, p.y + 20, { steps: 4 });
  await page.mouse.up({ button });
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(before);
  await expect(page.locator('#board')).not.toHaveClass(/panning/);
}
test('left drags from occupied cells, frontier and edges pan without activating edit modes', async ({
  page,
}) => {
  await ready(page);
  const before = await count(page);
  await page.getByLabel('Interaction mode').selectOption('add-obstacle');
  await drag(page, page.locator('[data-cell="1,0"] polygon'));
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■',
  );
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await drag(page, page.locator('[data-cell="1,0"] polygon'));
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await drag(page, page.locator('[data-cell="13,0"] polygon'));
  await expect(page.locator('#board-count')).toHaveText('117 existing cells');
  await page.getByLabel('Interaction mode').selectOption('edge');
  const edge = page.locator('[data-edge="1,0|2,0"]');
  await drag(page, edge);
  await expect(page.locator('#edge-features')).toBeEmpty();
  // A vertical SVG line has a zero-width geometric box; click its painted stroke.
  const point = await midpoint(edge);
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('data-edge'),
      point,
    ),
  ).toBe('1,0|2,0');
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#edge-features')).toContainText('1,0|2,0');
  expect(await count(page)).toBe(before);
});
test('middle and Space drags pan; ordinary clicks and subthreshold movement edit once', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Interaction mode').selectOption('add-obstacle');
  const cell = page.locator('[data-cell="1,0"] polygon');
  await drag(page, cell, 'middle');
  await page.locator('#board').focus();
  await page.keyboard.down('Space');
  await drag(page, cell);
  await page.keyboard.up('Space');
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■',
  );
  const p = await midpoint(cell);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 2, p.y + 1);
  await page.mouse.up();
  await settled(page);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■2',
  );
  await cell.click();
  await settled(page);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■3',
  );
  // Once threshold is crossed, returning to the start is still a drag.
  const start = await midpoint(cell);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 30, start.y);
  await page.mouse.move(start.x, start.y);
  await page.mouse.up();
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■3',
  );
  // Capture loss and window blur cancel even a stationary gesture.
  await page.locator('#board').evaluate((node) =>
    node.addEventListener(
      'pointerdown',
      (event) => {
        if (event instanceof PointerEvent)
          node.setAttribute('data-test-pointer', String(event.pointerId));
      },
      { once: true },
    ),
  );
  const stationary = await midpoint(cell);
  await page.mouse.move(stationary.x, stationary.y);
  await page.mouse.down();
  await page
    .locator('#board')
    .evaluate((node) =>
      node.releasePointerCapture(
        Number(node.getAttribute('data-test-pointer')),
      ),
    );
  await page.mouse.up();
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■3',
  );
  await page.mouse.down();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■3',
  );
  await cell.click();
  await settled(page);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■4',
  );
  await page.locator('[data-cell="1,0"]').focus();
  await page.keyboard.press('Space');
  await settled(page);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■5',
  );
});
test('touch drag and cancellation release capture without editing; a later tap activates once', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Interaction mode').selectOption('add-obstacle');
  const client = await page.context().newCDPSession(page),
    cell = page.locator('[data-cell="1,0"] polygon');
  await page.locator('#board').evaluate((node) =>
    node.addEventListener('pointerdown', (event) => {
      if (event instanceof PointerEvent)
        node.setAttribute('data-last-pointer', String(event.pointerId));
    }),
  );
  let p = await midpoint(cell);
  const before = await page.locator('#board').getAttribute('viewBox');
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...p, id: 0 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: p.x + 60, y: p.y + 20, id: 0 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(before);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■',
  );
  p = await midpoint(cell);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...p, id: 0 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  expect(
    await page
      .locator('#board')
      .evaluate((node) =>
        node.hasPointerCapture(Number(node.getAttribute('data-last-pointer'))),
      ),
  ).toBe(false);
  await expect(page.locator('#board')).not.toHaveClass(/panning/);
  await page.touchscreen.tap(p.x, p.y);
  await settled(page);
  await expect(page.locator('[data-cell="1,0"] .obstacle-symbol')).toHaveText(
    '■2',
  );
  await client.detach();
});
test('mathematical edits recalculate automatically while display, target and inspection changes do not', async ({
  page,
}) => {
  await ready(page);
  let previous = await count(page);
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '1', '0');
  await page
    .getByRole('button', { name: 'Add transparent marker', exact: true })
    .click();
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page
    .locator('#contents .stack-row')
    .last()
    .getByRole('button', { name: 'Move earlier' })
    .click();
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page
    .locator('#contents .stack-row')
    .first()
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page.locator('#edge-side button').click();
  await page
    .getByRole('button', { name: 'Add edge marker', exact: true })
    .click();
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '3', '0');
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page.getByLabel('Contact policy').selectOption('generic.any-contact');
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page.getByLabel('Unlimited range').uncheck();
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  previous = await count(page);
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '2', '0');
  await page.getByLabel('Presentation', { exact: true }).selectOption('flat');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.locator('#board').focus();
  await page.keyboard.press('ArrowLeft');
  await page.locator('[data-cell="3,0"] polygon').hover();
  await page.getByText('Complete geometric contacts', { exact: true }).click();
  await page.waitForTimeout(400);
  expect(await count(page)).toBe(previous);
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'complete',
  );
});
test('rapid mathematical edits show pending immediately and publish only the latest configuration', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Unlimited range').uncheck();
  await settled(page);
  const previous = await count(page);
  const snapshot = await page.locator('#radius').evaluate((node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Input');
    for (const value of ['2', '3', '1']) {
      node.value = value;
      node.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return {
      phase: document.getElementById('batch-status')?.dataset.phase,
      inspection: document.getElementById('target-inspection')?.textContent,
      classes: document
        .querySelector('[data-cell="2,0"]')
        ?.getAttribute('class'),
    };
  });
  expect(snapshot.phase).toBe('pending');
  expect(snapshot.inspection).not.toContain('Physical LOS: Blocked');
  expect(snapshot.classes).toContain('pending');
  await settled(page);
  expect(await count(page)).toBe(previous + 1);
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: Out of range',
  );
  await expect(page.locator('#target-inspection')).toContainText('Radius: 1');
  // Cancel a queued valid update with invalid input; it must never publish.
  await page.locator('#radius').evaluate((node) => {
    if (!(node instanceof HTMLInputElement)) throw new Error('Input');
    for (const value of ['2', '-1']) {
      node.value = value;
      node.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  const canceled = await count(page);
  await page.waitForTimeout(400);
  expect(await count(page)).toBe(canceled);
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'pending',
  );
  await page.locator('#radius').fill('1');
  await settled(page);
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: Out of range',
  );
});
test('membership, missing observer and resource failures refresh automatically without false verdicts', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await at(page, '0', '0');
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'unavailable',
  );
  await expect(page.locator('#batch-status')).toContainText(
    'Choose an existing observer',
  );
  await expect(page.locator('#target-inspection')).not.toContainText(
    'Physical LOS: Blocked',
  );
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '1', '0');
  await settled(page);
  await page.getByLabel('Width', { exact: true }).fill('0');
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '0', '0');
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '0', '0');
  await settled(page);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '1000', '0');
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, '1000', '0');
  await settled(page);
  await expect(page.locator('[data-cell="1000,0"]')).toHaveClass(/failed/);
  await expect(page.locator('#target-inspection')).toContainText(
    'Geometry candidate limit exceeded',
  );
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '1000000', '0');
  await expect(page.locator('#batch-status')).toContainText('Batch refused');
  await expect(page.locator('#target-inspection')).not.toContainText(
    'Physical LOS: Clear',
  );
});
test('manual observer/obstacle regression agrees across policies without recalculating target selection', async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await page.getByLabel('Interaction mode').selectOption('add-obstacle');
  await at(page, '7', '3');
  await at(page, '5', '5');
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '7', '2');
  await settled(page);
  await page.getByLabel('Interaction mode').selectOption('inspect');
  for (const policy of [
    'generic.interior-only',
    'generic.interior-and-edge',
    'generic.any-contact',
  ]) {
    await page.getByLabel('Contact policy').selectOption(policy);
    await settled(page);
    const evaluations = await count(page);
    for (const [q, r, near, far] of [
      ['5', '6', '[1/6, 1/3]', '[2/3, 5/6]'],
      ['4', '8', '[1/9, 2/9]', '[4/9, 5/9]'],
    ] as const) {
      await at(page, q, r);
      await expect(page.locator('#target-inspection')).toContainText(
        `Physical LOS: ${policy === 'generic.interior-only' ? 'Clear' : 'Blocked'}`,
      );
      await expect(page.locator('#target-inspection')).toContainText(near);
      await expect(page.locator('#target-inspection')).toContainText(far);
      await expect(page.locator('#target-inspection')).toContainText(
        'Determinant side -1',
      );
      await expect(page.locator('#target-inspection')).toContainText(
        'Determinant side 1',
      );
      expect(await count(page)).toBe(evaluations);
    }
  }
});
