import { test, expect, type Page } from '@playwright/test';
import { resources, type Language } from '../web/i18n.js';
async function settled(page: Page): Promise<void> {
  await expect(page.locator('#batch-status')).toHaveAttribute(
    'data-phase',
    'complete',
  );
}
async function at(page: Page, q: string, r: string): Promise<void> {
  await page.locator('#q').fill(q);
  await page.locator('#r').fill(r);
  await page.locator('#coordinate button').click();
}
async function boardFacts(page: Page) {
  return page.evaluate(() => ({
    cells: [...document.querySelectorAll('[data-cell]')].map((n) => [
      n.getAttribute('data-cell'),
      n.getAttribute('class'),
      n.getAttribute('data-physical-los'),
      n.getAttribute('data-range'),
      n.getAttribute('data-engine-visible'),
    ]),
    view: document.getElementById('board')?.getAttribute('viewBox'),
    evaluations: document
      .getElementById('batch-status')
      ?.getAttribute('data-evaluations'),
    ruleset: document.querySelector<HTMLSelectElement>('#ruleset')?.value,
    sightline: document.querySelector('.sightline')?.outerHTML,
    raw: [...document.querySelectorAll('#target-inspection pre')].map(
      (n) => n.textContent,
    ),
  }));
}
for (const language of ['en', 'es'] as const)
  test.describe(language, () => {
    test.use({ locale: language === 'es' ? 'es-CO' : 'en-US' });
    const labels = resources[language];
    test('browser preference, explicit language persistence and state-preserving switching', async ({
      page,
    }) => {
      await page.goto('/');
      await settled(page);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await page.locator('#ruleset').selectOption('memoir44.refresh2025');
      await settled(page);
      await page.locator('#zoom-in').click();
      await page.locator('#q').fill('123456789012345678901234567890');
      const before = await boardFacts(page);
      const other: Language = language === 'en' ? 'es' : 'en';
      await page.locator('#language').focus();
      await page.locator('#language').selectOption(other);
      await expect(page.locator('html')).toHaveAttribute('lang', other);
      expect(await boardFacts(page)).toEqual(before);
      await expect(page.locator('#q')).toHaveValue(
        '123456789012345678901234567890',
      );
      await expect(page.locator('#language')).toBeFocused();
      const alternate = resources[other];
      await expect(page.locator('#profile-note')).toHaveText(
        alternate['memoir.profile-note']!,
      );
      await expect(page.locator('#target-inspection')).toContainText(
        alternate['memoir44.interior-obstruction']!,
      );
      expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([
        'gordoshex.language',
      ]);
      await page.reload();
      await settled(page);
      await expect(page.locator('html')).toHaveAttribute('lang', other);
      await expect(page.locator('#ruleset')).toHaveValue(
        'generic.interior-only',
      );
    });
    test('localized generic editing and stable contents focus retain complete blocker evidence', async ({
      page,
    }) => {
      await page.goto('/');
      await settled(page);
      await expect(page.locator('#target-inspection')).toContainText(
        labels['generic.obstacle-blocks']!,
      );
      await at(page, '1', '0');
      const add = page.locator('#contents').getByRole('button', {
        name: labels['inspection.add-obstacle'],
        exact: true,
      });
      await add.click();
      await settled(page);
      await expect(page.locator('#contents .stack-row')).toHaveCount(2);
      await expect(add).toBeFocused();
      const moving = page
        .locator('#contents .stack-row')
        .last()
        .getByRole('button', { name: labels['inspection.up'], exact: true });
      const identity = await moving.getAttribute('data-focus-key');
      await moving.click();
      await settled(page);
      const focused = await page.evaluate(() => ({
        key:
          document.activeElement instanceof HTMLElement
            ? document.activeElement.dataset.focusKey
            : null,
        disabled: document.activeElement?.matches(':disabled'),
      }));
      expect(focused.key).toBe(identity?.replace(':earlier', ':later'));
      expect(focused.disabled).toBe(false);
      for (const policy of [
        'generic.interior-only',
        'generic.interior-and-edge',
        'generic.any-contact',
      ]) {
        await page.locator('#ruleset').selectOption(policy);
        await settled(page);
        await at(page, '2', '0');
        await expect(page.locator('[data-cell="2,0"]')).toHaveClass(/blocked/);
        await expect(
          page.locator('#target-inspection .evidence.blocking'),
        ).toHaveCount(2);
        await expect(page.locator('#target-inspection')).toContainText(
          '[1/4, 3/4]',
        );
      }
    });
    test('keyboard navigation preserves identities and focus through editing and evaluation', async ({
      page,
    }) => {
      await page.goto('/');
      await settled(page);
      expect(await page.locator('#board [tabindex="0"]').count()).toBe(0);
      await page.locator('#board').focus();
      await page.keyboard.press('Home');
      const first = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-cell'),
      );
      expect(first).toBeTruthy();
      await page.keyboard.press('PageDown');
      expect(
        await page.evaluate(() =>
          document.activeElement?.getAttribute('data-cell'),
        ),
      ).not.toBe(first);
      await page.keyboard.press('Enter');
      await expect(
        page.locator(
          '#board [data-cell="' +
            (await page.evaluate(() =>
              document.activeElement?.getAttribute('data-cell'),
            )) +
            '"]',
        ),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() =>
          document.getElementById('board')?.contains(document.activeElement),
        ),
      ).toBe(false);
      await page.locator('#ruleset').selectOption('memoir44.refresh2025');
      await settled(page);
      await page
        .getByRole('button', {
          name: labels['memoir.tab.installation'],
          exact: true,
        })
        .click();
      const bunker = page.getByRole('button', {
        name:
          labels['memoir.place'] + ' ' + labels['memoir.installation.bunker'],
        exact: true,
      });
      await bunker.click();
      await expect(bunker).toBeFocused();
      await page.locator('[data-cell="3,0"]').focus();
      await page.keyboard.press('Enter');
      await settled(page);
      await expect(page.locator('[data-cell="3,0"]')).toBeFocused();
      await expect(
        page.locator('[data-cell="3,0"] .installation-bunker'),
      ).toHaveCount(1);
      await page.locator('#mode').selectOption('inspect');
      await at(page, '2', '0');
      await expect(page.locator('#target-inspection')).toContainText(
        labels['memoir44.interior-obstruction']!,
      );
      await page.locator('#mode').selectOption('remove-cell');
      await at(page, '1', '0');
      await settled(page);
      await expect(page.locator('[data-cell="2,0"]')).toHaveClass(
        /rule-invalid/,
      );
      await expect(page.locator('#target-inspection')).toContainText(
        labels['memoir44.absent-positive-contact']!,
      );
      await page.locator('#q').fill('01');
      await page.locator('#coordinate button').click();
      await expect(page.locator('#feedback')).toContainText(
        labels['input.integer']!,
      );
    });
    test('Memoir artillery, responsive portrait/landscape controls and actual localized screenshots', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');
      await settled(page);
      await page.locator('#ruleset').selectOption('memoir44.refresh2025');
      await settled(page);
      await page
        .getByRole('button', { name: labels['memoir.tab.unit'], exact: true })
        .click();
      await page
        .getByRole('button', {
          name: labels['memoir.place'] + ' ' + labels['memoir.unit.artillery'],
          exact: true,
        })
        .click();
      await at(page, '0', '0');
      await settled(page);
      await page
        .getByRole('button', {
          name: labels['memoir.tab.installation'],
          exact: true,
        })
        .click();
      await page
        .getByRole('button', {
          name:
            labels['memoir.place'] + ' ' + labels['memoir.installation.bunker'],
          exact: true,
        })
        .click();
      await at(page, '3', '2');
      await settled(page);
      await page.locator('#mode').selectOption('inspect');
      await at(page, '2', '0');
      await expect(page.locator('[data-cell="2,0"]')).toHaveClass(
        /requirements-met/,
      );
      await expect(page.locator('[data-cell="2,0"]')).toHaveAttribute(
        'data-engine-visible',
        'false',
      );
      await expect(page.locator('#target-inspection')).toContainText(
        labels['memoir.artillery-note']!,
      );
      if (browserName === 'chromium') {
        await page.locator('.controls').evaluate((node) => {
          node.scrollTop = 0;
        });
        await page.screenshot({
          path: `docs/screenshots/m3c-${language}-desktop.png`,
          fullPage: true,
        });
      }
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 360, height: 740 },
        { width: 844, height: 390 },
      ]) {
        await page.setViewportSize(viewport);
        await page.locator('#fit').click();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(viewport.width);
        await page
          .locator('.mobile-navigation a[href="#memoir-palette"]')
          .click();
        await expect(page.locator('#memoir-palette')).toBeInViewport();
        await page.locator('.mobile-navigation a[href="#board"]').click();
        await expect(page.locator('#board')).toBeInViewport();
        const bounds = await page.locator('#zoom-in').boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        if (browserName === 'chromium' && viewport.width === 390) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: `docs/screenshots/m3c-${language}-mobile.png`,
            fullPage: true,
          });
        }
      }
    });
    test('cooperative evaluation permits interaction, cancels superseded work and publishes only the complete latest map', async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto('/');
      await settled(page);
      await page.locator('#ruleset').selectOption('memoir44.refresh2025');
      await settled(page);
      await page.locator('#width').fill('26');
      await page.locator('#height').fill('18');
      await page.locator('#generate button').click();
      await page
        .getByRole('button', { name: labels['memoir.tab.unit'], exact: true })
        .click();
      await page
        .getByRole('button', {
          name: labels['memoir.place'] + ' ' + labels['memoir.unit.artillery'],
          exact: true,
        })
        .click();
      await at(page, '9', '9');
      await page.locator('#mode').selectOption('observer');
      await at(page, '9', '9');
      await page
        .getByRole('button', {
          name: labels['memoir.tab.terrain'],
          exact: true,
        })
        .click();
      await page
        .getByRole('button', {
          name: labels['memoir.paint'] + ' ' + labels['memoir.terrain.forest'],
          exact: true,
        })
        .click();
      await at(page, '10', '9');
      await settled(page);
      await page.locator('#mode').selectOption('inspect');
      await at(page, '13', '9');
      await page.locator('#unlimited').uncheck();
      await settled(page);
      await page.locator('#radius').fill('5');
      await expect
        .poll(() =>
          page
            .locator('#evaluation-progress')
            .evaluate((node) =>
              node instanceof HTMLProgressElement ? node.value : 0,
            ),
        )
        .toBeGreaterThan(0);
      await expect(page.locator('#batch-status')).toHaveAttribute(
        'data-phase',
        'running',
      );
      await expect(page.locator('[data-cell="13,9"]')).toHaveClass(/pending/);
      await page
        .locator('#board')
        .evaluate((node) =>
          node.addEventListener(
            'keydown',
            () =>
              node.setAttribute(
                'data-key-phase',
                document.getElementById('batch-status')?.dataset.phase ?? '',
              ),
            { once: true },
          ),
        );
      await page.locator('#board').focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#board')).toHaveAttribute(
        'data-key-phase',
        'running',
      );
      const pending = await page.locator('#radius').evaluate((node) => {
        if (!(node instanceof HTMLInputElement)) throw new Error('Input');
        for (const value of ['1', '2', '3']) {
          node.value = value;
          node.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return {
          phase: document.getElementById('batch-status')?.dataset.phase,
          classes: document
            .querySelector('[data-cell="13,9"]')
            ?.getAttribute('class'),
        };
      });
      expect(pending.phase).toBe('pending');
      expect(pending.classes).toContain('pending');
      await settled(page);
      await expect(page.locator('#target-inspection')).toContainText(
        labels['memoir.effective'] + ': 3',
      );
      await expect(page.locator('[data-cell="13,9"]')).toHaveClass(
        /out-of-range/,
      );
      await expect(page.locator('.cell.pending:not(.absent)')).toHaveCount(0);
      await expect(page.locator('.cell:not(.absent)')).toHaveCount(468);
    });
    test('visible text and legend colors retain measured contrast', async ({
      page,
    }) => {
      await page.goto('/');
      await settled(page);
      await page.locator('#ruleset').selectOption('memoir44.refresh2025');
      await settled(page);
      const samples = await page.evaluate(() => {
        const rgb = (value: string): number[] =>
          value.match(/[\d.]+/g)?.map(Number) ?? [];
        const luminance = (value: string): number =>
          rgb(value)
            .slice(0, 3)
            .map((v) => {
              const s = v / 255;
              return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (total, v, index) =>
                total + v * ([0.2126, 0.7152, 0.0722][index] ?? 0),
              0,
            );
        return [
          ...document.querySelectorAll<HTMLElement>(
            'header h1,header p,header label,footer,button:not(:disabled),label,.muted,.swatch',
          ),
        ]
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => {
            let background: Element | null = node;
            while (
              background &&
              (getComputedStyle(background).backgroundColor === 'transparent' ||
                getComputedStyle(background).backgroundColor ===
                  'rgba(0, 0, 0, 0)')
            )
              background = background.parentElement;
            const fg = luminance(getComputedStyle(node).color),
              bg = luminance(
                background
                  ? getComputedStyle(background).backgroundColor
                  : 'rgb(242,245,245)',
              );
            return {
              text: node.textContent?.slice(0, 60),
              ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
            };
          });
      });
      expect(samples.length).toBeGreaterThan(30);
      for (const sample of samples)
        expect(sample.ratio, sample.text).toBeGreaterThanOrEqual(4.5);
    });
    test('touch taps activate editing once without requiring hover', async ({
      browser,
      browserName,
    }) => {
      test.skip(
        browserName === 'firefox',
        'Playwright Firefox does not support touch-enabled contexts; keyboard/mouse workflows remain verified.',
      );
      const context = await browser.newContext({
        baseURL: 'http://127.0.0.1:4173',
        hasTouch: true,
        locale: language === 'es' ? 'es-CO' : 'en-US',
        viewport: { width: 390, height: 844 },
      });
      try {
        const page = await context.newPage();
        await page.goto('/');
        await settled(page);
        await page.locator('#mode').selectOption('add-obstacle');
        const target = page.locator('[data-cell="2,0"]');
        await target.tap();
        await settled(page);
        await expect(target.locator('.obstacle-symbol')).toHaveText('■');
        await target.tap();
        await settled(page);
        await expect(target.locator('.obstacle-symbol')).toHaveText('■2');
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(390);
      } finally {
        await context.close();
      }
    });
  });
