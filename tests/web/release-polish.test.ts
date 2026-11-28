import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { axial } from '../../src/index.js';
import {
  BoardSnapshot,
  rectangle,
  MEMOIR44_INSTALLATIONS,
  MEMOIR44_TERRAINS,
  MEMOIR44_UNIT_TYPES,
} from '../../src/application.js';
import { initialState, generate, activateCell } from '../../web/state.js';
import { initialMemoirState } from '../../web/workspaces.js';
import { paintMemoir } from '../../web/memoir-editing.js';
import {
  evaluateBoard,
  evaluateBoardCooperatively,
  EVALUATION_CHUNK_TARGETS,
} from '../../web/evaluation.js';
import {
  resources,
  setLanguage,
  currentLanguage,
  preferredLanguage,
  initializeLanguage,
  persistLanguage,
  LANGUAGE_STORAGE_KEY,
  t,
  hasTranslation,
} from '../../web/i18n.js';
import { semantic } from '../../web/format.js';
import { Recalculation } from '../../web/recalculation.js';
afterEach(() => {
  setLanguage('en');
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('keeps exact language-key and placeholder parity, with translations for dynamic entity/status keys', () => {
  expect(Object.keys(resources.es).sort()).toEqual(
    Object.keys(resources.en).sort(),
  );
  for (const [key, value] of Object.entries(resources.en)) {
    const translated: Readonly<Record<string, string>> = resources.es;
    expect(translated[key]?.trim().length, key).toBeGreaterThan(0);
    expect(translated[key]?.match(/\{\w+\}/g)?.sort() ?? [], key).toEqual(
      value.match(/\{\w+\}/g)?.sort() ?? [],
    );
  }
  setLanguage('es');
  for (const [prefix, values] of [
    ['terrain', MEMOIR44_TERRAINS],
    ['installation', MEMOIR44_INSTALLATIONS],
    ['unit', MEMOIR44_UNIT_TYPES],
  ] as const)
    for (const type of values)
      expect(hasTranslation(`memoir.${prefix}.${type}`)).toBe(true);
  for (const key of [
    'clear',
    'blocked',
    'out-of-range',
    'in-range',
    'invalid-under-ruleset',
    'observer',
    'pending',
    'visible',
    'failed',
    'invalid-query',
    'unsupported',
    'rule-invalid',
  ])
    expect(hasTranslation(`status.${key}`)).toBe(true);
  // Cover literal UI errors and production semantic/validation codes, including multiline calls.
  for (const dir of [
    'web',
    'src/visibility',
    'src/rulesets',
    'src/rulesets/memoir44',
    'src/board',
    'src/data',
  ])
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const source = readFileSync(join(dir, file), 'utf8');
      for (const match of source.matchAll(
        /(?:message|InputError|new Error)\(\s*'([\w.-]+)'/g,
      )) {
        const key = match[1];
        if (key) expect(hasTranslation(key), `${file}: ${key}`).toBe(true);
      }
    }
});
it('chooses the first supported browser language unless an explicit supported preference exists', () => {
  expect(preferredLanguage('en', ['es-CO'])).toBe('en');
  expect(preferredLanguage('es', ['en-US'])).toBe('es');
  expect(preferredLanguage(null, ['fr', 'es-CO', 'en'])).toBe('es');
  expect(preferredLanguage('bad', ['fr'])).toBe('en');
  const entries = new Map<string, string>();
  persistLanguage('es', {
    setItem: (k, v) => {
      entries.set(k, v);
    },
  });
  expect([...entries]).toEqual([[LANGUAGE_STORAGE_KEY, 'es']]);
  initializeLanguage(['en'], { getItem: (k) => entries.get(k) ?? null });
  expect(currentLanguage()).toBe('es');
  initializeLanguage(['es-MX'], {
    getItem: () => {
      throw new Error('storage denied');
    },
  });
  expect(currentLanguage()).toBe('es');
  expect(() =>
    persistLanguage('en', {
      setItem: () => {
        throw new Error('storage denied');
      },
    }),
  ).not.toThrow();
});
it('localizes semantic explanations and structured arguments without raw codes in normal prose', () => {
  setLanguage('es');
  expect(
    semantic({
      code: 'generic.contact-policy',
      arguments: { rulesetId: 'generic.interior-only' },
    }),
  ).toContain('Solo interior');
  expect(
    semantic({
      code: 'memoir44.intrinsic-range',
      arguments: {
        unitType: 'armor',
        intrinsicMaximum: '3',
        userCap: 'unlimited',
        effectiveMaximum: '3',
      },
    }),
  ).toContain('Blindados');
  expect(
    semantic({
      code: 'memoir44.physical-los',
      arguments: { blocked: true, invalidatingMembership: false },
    }),
  ).toContain('Sí');
  for (const code of Object.keys(resources.es).filter((key) =>
    key.startsWith('memoir44.'),
  ))
    expect(semantic({ code, arguments: {} })).not.toContain(code);
  expect(t('unrecognized.internal.code')).not.toContain('unrecognized');
});
for (const memoir of [false, true])
  it(`publishes an exact complete map equivalent to synchronous ${memoir ? 'Memoir' : 'generic'} work`, async () => {
    let state = generate(
      memoir ? initialMemoirState() : initialState(),
      '13',
      '9',
      'axial',
    );
    if (memoir) {
      state = paintMemoir(state, axial(0n, 0n), {
        kind: 'unit',
        type: 'artillery',
        side: 'allies',
      });
      state = paintMemoir(state, axial(1n, 0n), {
        kind: 'terrain',
        type: 'forest',
      });
    }
    const before = state.board,
      progress: number[] = [];
    let yields = 0;
    const expected = evaluateBoard(state);
    const actual = await evaluateBoardCooperatively(state, {
      cancelled: () => false,
      progress: (completed) => progress.push(completed),
      yieldControl: async () => {
        yields++;
      },
    });
    expect(yields).toBeGreaterThan(0);
    expect(progress[0]).toBeLessThanOrEqual(EVALUATION_CHUNK_TARGETS);
    expect(state.board).toBe(before);
    if (expected.status !== 'complete' || actual?.status !== 'complete')
      throw new Error('Complete');
    expect(actual.results).toEqual(expected.results);
    expect(actual.candidates).toBe(expected.candidates);
    expect(actual.results.size).toBe(117);
  });
it('cancels during a chunk boundary without returning partial results, and keeps admission/failure contracts', async () => {
  let cancelled = false,
    completed = 0;
  const state = initialState();
  const result = await evaluateBoardCooperatively(state, {
    cancelled: () => cancelled,
    progress: (n) => {
      completed = n;
    },
    yieldControl: async () => {
      cancelled = true;
    },
  });
  expect(result).toBeNull();
  expect(completed).toBeGreaterThan(0);
  expect(completed).toBeLessThan(117);
  const missing = activateCell(
    { ...state, mode: 'remove-cell' },
    axial(0n, 0n),
  );
  expect(
    await evaluateBoardCooperatively(missing, {
      cancelled: () => false,
      progress: () => {},
    }),
  ).toEqual({ status: 'unavailable', reason: 'batch.observer' });
  const failed = await evaluateBoardCooperatively(
    state,
    {
      cancelled: () => false,
      progress: () => {},
      yieldControl: async () => {},
    },
    0n,
  );
  if (failed?.status !== 'complete') throw new Error('Batch');
  expect(failed.results.get('2,0')?.status).toBe('evaluation-failure');
});
it('does not publish a superseded asynchronous evaluation or late rejection', async () => {
  const results: string[] = [],
    resolvers: ((
      value: Awaited<ReturnType<typeof evaluateBoardCooperatively>>,
    ) => void)[] = [];
  const controller = new Recalculation(
    () => new Promise((resolve) => resolvers.push(resolve)),
    () => {},
    () => results.push('complete'),
    () => results.push('failed'),
  );
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) =>
    clearTimeout(id),
  );
  controller.request(initialState(), 0);
  await vi.runAllTimersAsync();
  controller.request(initialState(), 0);
  await vi.runAllTimersAsync();
  expect(resolvers).toHaveLength(2);
  resolvers[0]?.({ status: 'unavailable', reason: 'old' });
  await Promise.resolve();
  expect(results).toEqual([]);
  resolvers[1]?.({ status: 'unavailable', reason: 'new' });
  await Promise.resolve();
  expect(results).toEqual(['complete']);
  controller.cancel();
});

it('refuses oversized and excessive-candidate cooperative batches before any progress or partial publication', async () => {
  const control = {
    cancelled: () => false,
    progress: vi.fn(),
    yieldControl: vi.fn(async () => {}),
  };
  const state = initialState();
  expect(
    await evaluateBoardCooperatively(
      { ...state, board: rectangle(513n, 1n, axial(0n, 0n), 'axial') },
      control,
    ),
  ).toEqual({ status: 'unavailable', reason: 'limit.cells' });
  const board = new BoardSnapshot([
    { coordinate: axial(0n, 0n), elements: [] },
    { coordinate: axial(10n ** 30n, 10n ** 30n), elements: [] },
  ]);
  expect(
    await evaluateBoardCooperatively({ ...state, board }, control),
  ).toEqual({ status: 'unavailable', reason: 'limit.batch' });
  expect(control.progress).not.toHaveBeenCalled();
  expect(control.yieldControl).not.toHaveBeenCalled();
});
it('ignores late asynchronous rejection after cancellation but reports a current failure', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) =>
    clearTimeout(id),
  );
  const rejections: ((error: Error) => void)[] = [],
    failed = vi.fn(),
    complete = vi.fn();
  const controller = new Recalculation(
    () => new Promise((_resolve, reject) => rejections.push(reject)),
    () => {},
    complete,
    failed,
  );
  controller.request(initialState(), 0);
  await vi.runAllTimersAsync();
  controller.cancel();
  rejections[0]?.(new Error('obsolete'));
  await Promise.resolve();
  expect(failed).not.toHaveBeenCalled();
  controller.request(initialState(), 0);
  await vi.runAllTimersAsync();
  rejections[1]?.(new Error('current'));
  await Promise.resolve();
  expect(failed).toHaveBeenCalledOnce();
  expect(complete).not.toHaveBeenCalled();
  controller.cancel();
});
