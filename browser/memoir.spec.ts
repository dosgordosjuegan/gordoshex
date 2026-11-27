import { test, expect, type Page, type Locator } from '@playwright/test';
const memoir = 'memoir44.refresh2025';
async function settled(page: Page): Promise<void> {
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'complete',
  );
}
async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await settled(page);
  await page.getByLabel('Contact policy').selectOption(memoir);
  await settled(page);
}
async function at(page: Page, q: string, r: string): Promise<void> {
  await page.locator('#q').fill(q);
  await page.locator('#r').fill(r);
  await page.getByRole('button', { name: 'Apply mode at coordinate' }).click();
}
async function terrain(page: Page, type: string): Promise<void> {
  await page
    .getByRole('button', { name: 'Terrain palette', exact: true })
    .click();
  await page
    .getByRole('button', { name: `Paint ${type}`, exact: true })
    .click();
}
async function unit(page: Page, type: string, side = 'allies'): Promise<void> {
  await page.getByRole('button', { name: 'Unit palette', exact: true }).click();
  await page.getByLabel('Unit affiliation').selectOption(side);
  await page
    .getByRole('button', { name: `Place ${type}`, exact: true })
    .click();
}
async function inspect(page: Page, q: string, r: string): Promise<void> {
  await page.getByLabel('Interaction mode').selectOption('inspect');
  await at(page, q, r);
}
async function center(locator: Locator): Promise<{ x: number; y: number }> {
  const b = await locator.boundingBox();
  if (!b) throw new Error('Bounds');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
test('Memoir selection keeps separate working boards, range semantics and unsupported tools hidden', async ({
  page,
}) => {
  await page.goto('/');
  await settled(page);
  await page.getByLabel('Interaction mode').selectOption('add-obstacle');
  await at(page, '2', '0');
  await settled(page);
  await page.getByLabel('Contact policy').selectOption(memoir);
  await settled(page);
  await expect(page.locator('#profile-note')).toContainText('supported subset');
  await expect(page.getByLabel('No additional range cap')).toBeChecked();
  await expect(page.locator('#edge-controls')).toBeHidden();
  await expect(page.locator('[data-cell="2,0"] .obstacle-symbol')).toHaveCount(
    0,
  );
  await terrain(page, 'Hill');
  await at(page, '2', '0');
  await settled(page);
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/terrain-hill/);
  await page.getByLabel('Contact policy').selectOption('generic.any-contact');
  await settled(page);
  await expect(page.locator('[data-cell="2,0"] .obstacle-symbol')).toHaveText(
    '■',
  );
  await expect(page.getByLabel('Unlimited range')).toBeChecked();
  await page.getByLabel('Contact policy').selectOption(memoir);
  await settled(page);
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/terrain-hill/);
  await expect(page.locator('#edge-controls')).toBeHidden();
});
test('layer replacement, affiliations, installation removal and observer removal preserve independent contents', async ({
  page,
}) => {
  await ready(page);
  await unit(page, 'Armor', 'axis');
  await at(page, '1', '0');
  await page
    .getByRole('button', { name: 'Installation palette', exact: true })
    .click();
  await page.getByRole('button', { name: 'Place Bunker', exact: true }).click();
  await at(page, '1', '0');
  await terrain(page, 'Hill');
  await at(page, '1', '0');
  await settled(page);
  await inspect(page, '1', '0');
  await expect(page.locator('#contents')).toContainText('Axis Armor');
  await expect(page.locator('#contents')).toContainText('Bunker');
  await expect(page.locator('#contents')).toContainText('Hill');
  await page
    .getByRole('button', { name: 'Use this unit as observer', exact: true })
    .click();
  await settled(page);
  await expect(page.locator('#selections')).toContainText('Observer: 1,0');
  await page
    .getByRole('button', { name: 'Remove unit only', exact: true })
    .last()
    .click();
  await settled(page);
  await expect(page.locator('#profile-feedback')).toContainText(
    'observer cell needs a supported standard unit',
  );
  await expect(page.locator('#contents')).toContainText('Bunker');
  await expect(page.locator('#contents')).toContainText('Hill');
  await unit(page, 'Infantry');
  await at(page, '1', '0');
  await settled(page);
  await expect(page.locator('#profile-feedback')).toBeHidden();
  await page
    .getByRole('button', { name: 'Installation palette', exact: true })
    .click();
  await page.getByRole('button', { name: 'Erase Bunker', exact: true }).click();
  await at(page, '1', '0');
  await settled(page);
  await expect(page.locator('#contents .stack-row')).toHaveCount(2);
  await page
    .getByRole('button', {
      name: 'Clear terrain to implicit Open',
      exact: true,
    })
    .last()
    .click();
  await settled(page);
  await expect(page.locator('#contents')).toContainText(
    'Implicit Open terrain',
  );
  await expect(page.locator('#contents')).toContainText('Allies Infantry');
});
test('unit ranges, additional cap and blocked artillery exemption remain separate from visibility', async ({
  page,
}) => {
  await ready(page);
  for (const [type, max] of [
    ['Infantry', 3],
    ['Armor', 3],
    ['Artillery', 6],
  ] as const) {
    await unit(page, type);
    await at(page, '0', '0');
    await settled(page);
    await inspect(page, String(max), '0');
    await expect(page.locator('#target-inspection')).toContainText(
      'Intrinsic maximum range: ' + max,
    );
    await expect(page.locator('#target-inspection')).toContainText(
      'Range: In range',
    );
    await inspect(page, String(max + 1), '0');
    await expect(page.locator('#target-inspection')).toContainText(
      'Range: Out of range',
    );
  }
  await inspect(page, '2', '0');
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'No — artillery LOS exemption',
  );
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(
    /requirements-met.*los-exempt|los-exempt.*requirements-met/,
  );
  await page.getByLabel('No additional range cap').uncheck();
  await page.getByLabel('Additional range cap (inclusive)').fill('1');
  await settled(page);
  await expect(page.locator('#target-inspection')).toContainText(
    'Effective maximum range: 1',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: Out of range',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
});
test('Memoir manual regression shows globally paired blockers and correct independent infantry/artillery ranges', async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await unit(page, 'Infantry');
  await at(page, '7', '2');
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '7', '2');
  await terrain(page, 'Forest');
  await at(page, '7', '3');
  await terrain(page, 'Town');
  await at(page, '5', '5');
  await settled(page);
  for (const [q, r, near, far] of [
    ['5', '6', '[1/6, 1/3]', '[2/3, 5/6]'],
    ['4', '8', '[1/9, 2/9]', '[4/9, 5/9]'],
  ] as const) {
    await inspect(page, q, r);
    await expect(page.locator('#target-inspection')).toContainText(
      'Physical LOS: Blocked',
    );
    await expect(page.locator('#target-inspection')).toContainText(
      'Range: Out of range',
    );
    await expect(page.locator('#target-inspection')).toContainText(
      'both sides anywhere',
    );
    await expect(page.locator('#target-inspection')).toContainText('Forest');
    await expect(page.locator('#target-inspection')).toContainText('Town');
    await page
      .getByText('Exact evidence and semantic data', { exact: true })
      .click();
    await expect(page.locator('#exact-evidence')).toContainText(near);
    await expect(page.locator('#exact-evidence')).toContainText(far);
    await expect(page.locator('.cell.blocker')).toHaveCount(2);
  }
  await unit(page, 'Artillery');
  await at(page, '7', '2');
  await settled(page);
  await inspect(page, '5', '6');
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: In range',
  );
  await inspect(page, '4', '8');
  await expect(page.locator('#target-inspection')).toContainText(
    'Range: In range',
  );
});
test('Memoir painting retains safe panning, zoom and elevation explanations', async ({
  page,
}) => {
  await ready(page);
  await terrain(page, 'Hill');
  await at(page, '0', '0');
  await at(page, '2', '0');
  await settled(page);
  await inspect(page, '2', '0');
  await expect(page.locator('#target-inspection')).toContainText(
    'below both endpoints',
  );
  await terrain(page, 'Hill');
  await at(page, '1', '0');
  await settled(page);
  await inspect(page, '2', '0');
  await expect(page.locator('#target-inspection')).toContainText(
    'Bare hill terrain is exempt',
  );
  await terrain(page, 'Forest');
  const target = page.locator('[data-cell="2,0"] polygon'),
    p = await center(target),
    before = await page.locator('#board').getAttribute('viewBox');
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 50, p.y + 20);
  await page.mouse.up();
  expect(await page.locator('#board').getAttribute('viewBox')).not.toBe(before);
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/terrain-hill/);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByLabel('Presentation', { exact: true }).selectOption('flat');
  await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/terrain-hill/);
});
test('Memoir original graphics and palette work in desktop and mobile views', async ({
  page,
}) => {
  await ready(page);
  await terrain(page, 'Town');
  await at(page, '3', '2');
  await terrain(page, 'Hill');
  await at(page, '4', '3');
  await unit(page, 'Armor', 'axis');
  await at(page, '4', '3');
  await unit(page, 'Artillery');
  await at(page, '3', '4');
  await page
    .getByRole('button', { name: 'Installation palette', exact: true })
    .click();
  await page.getByRole('button', { name: 'Place Bunker', exact: true }).click();
  await at(page, '4', '3');
  await settled(page);
  await inspect(page, '4', '3');
  await page.screenshot({
    path: 'docs/screenshots/m3b-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#board')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: 'docs/screenshots/m3b-mobile.png',
    fullPage: true,
  });
});
test('absent-cell invalidity and isolated-vertex convention are human-readable and keep exact evidence expandable', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await at(page, '1', '0');
  await settled(page);
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Invalid under ruleset',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'positive-length contact with an absent',
  );
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '1', '0');
  await settled(page);
  await terrain(page, 'Forest');
  await at(page, '1', '1');
  await settled(page);
  await inspect(page, '4', '1');
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Clear',
  );
  await terrain(page, 'Forest');
  await at(page, '3', '0');
  await settled(page);
  await inspect(page, '4', '1');
  await expect(page.locator('#target-inspection')).toContainText(
    'Physical LOS: Blocked',
  );
  await expect(page.locator('#target-inspection')).toContainText(
    'not an official publisher ruling',
  );
  expect(await page.locator('#target-inspection').innerText()).not.toContain(
    'memoir44.',
  );
  await page
    .getByText('Exact evidence and semantic data', { exact: true })
    .click();
  await expect(page.locator('#exact-evidence')).toContainText('[1/3, 1/3]');
  await expect(page.locator('#exact-evidence')).toContainText('[2/3, 2/3]');
});

test('manual artillery acceptance keeps physical facts while coloring requirements and withholding out-of-range badges', async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole('button', { name: 'Generate board', exact: true })
    .click();
  await unit(page, 'Artillery');
  await at(page, '2', '4');
  await page.getByLabel('Interaction mode').selectOption('observer');
  await at(page, '2', '4');
  await unit(page, 'Armor', 'axis');
  await at(page, '1', '4');
  await settled(page);
  await inspect(page, '0', '4');
  const cell = page.locator('[data-cell="0,4"]');
  await expect(cell).toHaveClass(/requirements-met/);
  await expect(cell.locator('.status-disc')).toHaveCSS(
    'fill',
    'rgb(24, 119, 70)',
  );
  await expect(cell).toHaveAttribute('data-physical-los', 'blocked');
  await expect(cell).toHaveAttribute('data-range', 'in-range');
  await expect(cell).toHaveAttribute('data-engine-visible', 'false');
  await expect(cell.locator('.exemption-symbol')).toHaveText('A');
  await expect(page.locator('#target-inspection')).toContainText(
    'Exact lattice distance: 2',
  );
  await expect(page.locator('#target-inspection')).toContainText('Axis Armor');
  await expect(page.locator('#target-inspection')).toContainText(
    'No — artillery LOS exemption',
  );
  await page.screenshot({
    path: 'docs/screenshots/m3b-artillery-acceptance.png',
    fullPage: true,
  });
  await page.getByLabel('No additional range cap').uncheck();
  await page.getByLabel('Additional range cap (inclusive)').fill('1');
  await settled(page);
  await expect(cell).toHaveClass(/out-of-range/);
  await expect(cell.locator('.exemption-symbol')).toHaveCount(0);
  await page.getByLabel('No additional range cap').check();
  await unit(page, 'Infantry');
  await at(page, '2', '4');
  await settled(page);
  await expect(cell).toHaveClass(/blocked/);
  await expect(cell.locator('.status-disc')).toHaveCSS(
    'fill',
    'rgb(176, 56, 44)',
  );
  await expect(cell.locator('.exemption-symbol')).toHaveCount(0);
  await unit(page, 'Artillery');
  await at(page, '2', '4');
  await page
    .getByRole('button', { name: 'Remove unit only', exact: true })
    .first()
    .click();
  await at(page, '1', '4');
  await terrain(page, 'Forest');
  await at(page, '1', '4');
  await settled(page);
  await expect(cell).toHaveClass(/requirements-met/);
  await expect(cell).toHaveAttribute('data-physical-los', 'blocked');
  await expect(cell.locator('.exemption-symbol')).toHaveText('A');
  await expect(page.locator('[data-cell="10,4"]')).toHaveClass(/out-of-range/);
  await expect(
    page.locator('[data-cell="10,4"] .exemption-symbol'),
  ).toHaveCount(0);
  await page.getByLabel('Interaction mode').selectOption('remove-cell');
  await at(page, '1', '4');
  await settled(page);
  await expect(cell).toHaveClass(/rule-invalid/);
  await expect(cell.locator('.exemption-symbol')).toHaveCount(0);
  await page.getByLabel('Interaction mode').selectOption('add-cell');
  await at(page, '40', '40');
  await settled(page);
  const failed = page.locator('[data-cell="40,40"]');
  await expect(failed).toHaveClass(/failed/);
  await expect(failed.locator('.exemption-symbol')).toHaveCount(0);
});
test('populated installation graphics and coordinate toggle work in both orientations without recalculation', async ({
  page,
}) => {
  await ready(page);
  await expect(
    page.getByLabel('Coordinate labels', { exact: true }),
  ).not.toBeChecked();
  for (const [index, type] of [
    'Bunker',
    'Sandbags',
    'Wire',
    'Hedgehog',
    'Sea wall',
  ].entries()) {
    await page
      .getByRole('button', { name: 'Installation palette', exact: true })
      .click();
    await page
      .getByRole('button', { name: `Place ${type}`, exact: true })
      .click();
    await at(page, String(index + 2), '2');
    await at(page, '4', '4');
    if (index < 3) await at(page, '8', '4');
  }
  await terrain(page, 'Hill');
  await at(page, '4', '4');
  await unit(page, 'Armor', 'axis');
  await at(page, '4', '4');
  await at(page, '8', '4');
  await settled(page);
  const before = await page
    .locator('#batch-status')
    .getAttribute('data-evaluations');
  await page.getByLabel('Coordinate labels', { exact: true }).check();
  await expect(page.locator('[data-cell="4,4"] .coordinate')).toHaveText('4,4');
  await page.getByLabel('Coordinate labels', { exact: true }).uncheck();
  await expect(page.locator('[data-cell="4,4"] .coordinate')).toHaveCount(0);
  for (const orientation of ['pointy', 'flat']) {
    await page
      .getByLabel('Presentation', { exact: true })
      .selectOption(orientation);
    await page.getByRole('button', { name: 'Fit board', exact: true }).click();
    await expect(
      page.locator('[data-cell="4,4"] .installation-glyph'),
    ).toHaveCount(5);
    await expect(page.locator('[data-cell="4,4"] .unit-glyph')).toHaveCount(1);
    // Actual painted bounds include the transformed stroke, not just SVG path boxes.
    for (const key of ['4,4', '8,4']) {
      const boxes = await page
        .locator(`[data-cell="${key}"]`)
        .evaluate((cell) =>
          [
            ...cell.querySelectorAll(
              '.unit-glyph, .installation-glyph, .status-disc',
            ),
          ].map((node) => {
            if (!(node instanceof SVGGraphicsElement))
              throw new Error('SVG glyph');
            const box = node.getBoundingClientRect(),
              matrix = node.getScreenCTM();
            if (!matrix) throw new Error('SVG transform');
            const stroke = node.classList.contains('unit-glyph')
              ? 0.035
              : node.classList.contains('installation-glyph')
                ? 0.06
                : 0.01;
            const pad = stroke * Math.hypot(matrix.a, matrix.b);
            return {
              left: box.left - pad,
              right: box.right + pad,
              top: box.top - pad,
              bottom: box.bottom + pad,
            };
          }),
        );
      for (const [index, box] of boxes.entries())
        for (const other of boxes.slice(index + 1))
          expect(
            box.left < other.right &&
              box.right > other.left &&
              box.top < other.bottom &&
              box.bottom > other.top,
          ).toBe(false);
    }
    const single = await page
      .locator('[data-cell="2,2"] .installation-glyph')
      .boundingBox();
    expect(single?.width).toBeGreaterThan(12);
    await page.screenshot({
      path: `docs/screenshots/m3b-acceptance-${orientation}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await expect(page.locator('[data-cell="4,4"] .unit-glyph')).toBeVisible();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  }
  expect(
    await page.locator('#batch-status').getAttribute('data-evaluations'),
  ).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Fit board', exact: true }).click();
  await page.screenshot({
    path: 'docs/screenshots/m3b-acceptance-mobile.png',
    fullPage: true,
  });
  await page.getByLabel('Contact policy').selectOption('generic.interior-only');
  await settled(page);
  await expect(
    page.getByLabel('Coordinate labels', { exact: true }),
  ).toBeChecked();
  await expect(page.locator('.requirements-met')).toHaveCount(0);
});
