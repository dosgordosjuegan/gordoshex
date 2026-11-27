import { it, expect } from 'vitest';
import {
  axial,
  embed,
  translate,
  coordinateKey,
  localEdge,
  rational,
} from '../../src/index.js';
import {
  BoardSnapshot,
  addElement,
  ANY_CONTACT,
  INTERIOR_ONLY,
  type VisibilityResult,
} from '../../src/application.js';
import { center, vertices, displayPoint, frontier } from '../../web/display.js';
import {
  initialState,
  activateCell,
  generate,
  addGeneric,
  deleteElement,
  moveElement,
  editEdge,
  setRange,
  setRuleset,
} from '../../web/state.js';
import { dimensions } from '../../web/limits.js';
import {
  evaluateBoard,
  presentation,
  blockerKeys,
} from '../../web/evaluation.js';
import { semantic } from '../../web/format.js';
it('renders inverse affine geometry in both orientations and preserves regular vertex radii', () => {
  for (const orientation of ['pointy', 'flat'] as const) {
    expect(center(axial(0n, 0n), axial(0n, 0n), orientation)).toEqual({
      x: 0,
      y: -0,
    });
    const polygon = vertices(axial(0n, 0n), axial(0n, 0n), orientation);
    expect(polygon).toHaveLength(6);
    for (const p of polygon) expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 12);
  }
  expect(displayPoint(embed(axial(1n, 0n)), axial(0n, 0n), 'pointy')).toEqual({
    x: Math.sqrt(3),
    y: -0,
  });
  expect(center(axial(1n, 0n), axial(0n, 0n), 'flat').x).toBeCloseTo(1.5, 12);
});
it('rebases exact huge coordinates before numeric conversion for centers and vertices', () => {
  const shift = axial(10n ** 50n + 3n, -(10n ** 50n) + 7n),
    a = axial(2n, -1n),
    zero = axial(0n, 0n);
  for (const o of ['pointy', 'flat'] as const) {
    expect(center(translate(a, shift), shift, o)).toEqual(center(a, zero, o));
    expect(vertices(translate(a, shift), shift, o)).toEqual(
      vertices(a, zero, o),
    );
  }
  expect(() => center(shift, zero, 'pointy')).toThrow('limit.display');
});
it('lists missing boundary cells and holes and supplies a seed on an empty board', () => {
  expect(frontier(new BoardSnapshot())).toEqual([axial(0n, 0n)]);
  const state = initialState(),
    hole = axial(1n, 0n),
    removed = activateCell({ ...state, mode: 'remove-cell' }, hole);
  expect(frontier(removed.board).some((a) => coordinateKey(a) === '1,0')).toBe(
    true,
  );
});
it('preflights generation dimensions, exact products and zero dimensions', () => {
  expect(dimensions('26', '18')).toEqual([26n, 18n]);
  expect(dimensions('64', '8')).toEqual([64n, 8n]);
  for (const [w, h] of [
    ['65', '0'],
    ['64', '9'],
    ['-1', '2'],
    ['1.5', '2'],
    ['01', '2'],
    ['9'.repeat(129), '0'],
  ] as const)
    expect(() => dimensions(w, h)).toThrow();
  expect(generate(initialState(), '0', '9', 'axial').board.cells).toHaveLength(
    0,
  );
});
it('deleting observer/target clears only removed selection and handles immutable holes', () => {
  const original = initialState();
  let state = activateCell({ ...original, mode: 'remove-cell' }, axial(0n, 0n));
  expect(state.origin).toBeNull();
  expect(state.target).toEqual(original.target);
  expect(original.board.cells).toHaveLength(117);
  state = activateCell(state, axial(2n, 0n));
  expect(state.target).toBeNull();
  expect(evaluateBoard(state)).toEqual({
    status: 'unavailable',
    reason: 'batch.observer',
  });
  state = activateCell({ ...state, mode: 'add-cell' }, axial(0n, 0n));
  expect(state.board.hasCell(axial(0n, 0n))).toBe(true);
  state = activateCell({ ...state, mode: 'observer' }, axial(0n, 0n));
  expect(state.origin).toEqual(axial(0n, 0n));
});
it('keeps orientation and mode changes independent of membership', () => {
  const state = initialState(),
    next = { ...state, orientation: 'flat' as const, mode: 'inspect' as const };
  expect(next.board).toBe(state.board);
  const target = activateCell(next, axial(1n, 0n));
  expect(target.target).toEqual(axial(1n, 0n));
  expect(target.origin).toEqual(state.origin);
});
it('edits stable ordered stacks and cleans boundary edge features through public edits', () => {
  const a = axial(1n, 0n);
  let state = addGeneric(initialState(), a, 'marker');
  state = addGeneric(state, a, 'obstacle');
  const ids = state.board.cellAt(a)?.elements.map((e) => e.id);
  expect(ids).toEqual(['element-1', 'element-2', 'element-3']);
  state = moveElement(state, a, 'element-3', -1);
  expect(state.board.cellAt(a)?.elements.map((e) => e.id)).toEqual([
    'element-1',
    'element-3',
    'element-2',
  ]);
  state = deleteElement(state, a, 'element-3');
  expect(state.board.cellAt(a)?.elements.map((e) => e.id)).toEqual([
    'element-1',
    'element-2',
  ]);
  const edge = localEdge(a, 0);
  state = editEdge(state, edge);
  expect(state.board.featuresAt(edge)).toHaveLength(1);
  state = activateCell({ ...state, mode: 'remove-cell' }, a);
  expect(state.board.featuresAt(edge)).toHaveLength(1);
  state = activateCell(state, axial(2n, 0n));
  expect(state.board.featuresAt(edge)).toHaveLength(0);
});
it('enforces incremental cell, element and edge budgets', () => {
  let state = generate(initialState(), '64', '8', 'axial');
  expect(() =>
    activateCell({ ...state, mode: 'add-cell' }, axial(100n, 100n)),
  ).toThrow('limit.cells');
  state = generate(initialState(), '1', '1', 'axial');
  for (let n = 0; n < 16; n++)
    state = addGeneric(state, axial(0n, 0n), 'obstacle');
  expect(() => addGeneric(state, axial(0n, 0n), 'obstacle')).toThrow(
    'limit.stack',
  );
  const edge = localEdge(axial(0n, 0n), 0);
  for (let n = 0; n < 8; n++) state = editEdge(state, edge);
  expect(() => editEdge(state, edge)).toThrow('limit.edge');
});
it('evaluates range and policy changes without duplicating generic predicates', () => {
  let state = generate(initialState(), '5', '3', 'axial');
  state = {
    ...state,
    target: axial(2n, -1n),
    board: new BoardSnapshot([
      { coordinate: axial(0n, 0n), elements: [] },
      { coordinate: axial(2n, -1n), elements: [] },
      { coordinate: axial(1n, 0n), elements: [] },
    ]),
  };
  state = {
    ...state,
    board: addElement(state.board, axial(1n, 0n), {
      id: 'test',
      kind: 'obstacle',
      properties: {},
    }),
  };
  const run = () => {
    const batch = evaluateBoard(state);
    if (batch.status !== 'complete') throw new Error('Batch');
    return batch.results.get('2,-1');
  };
  expect(presentation(run())).toBe('visible');
  state = setRuleset(state, ANY_CONTACT.id);
  const hit = run();
  expect(presentation(hit)).toBe('blocked');
  expect(blockerKeys(hit)).toEqual(new Set(['1,0']));
  if (hit?.status === 'evaluated')
    expect(hit.los.evidence[0]?.contact.entry).toEqual(rational(1n, 3n));
  state = setRange(state, { kind: 'radius', radius: 1n });
  expect(presentation(run())).toBe('out-of-range');
  expect(() => setRange(state, { kind: 'radius', radius: -1n })).toThrow();
  expect(() => setRuleset(state, 'memoir44.refresh2025')).toThrow();
  expect(INTERIOR_ONLY.id).toBe('generic.interior-only');
});
it('rejects excessive batch work before evaluation and maps per-query failure distinctly', () => {
  let state = initialState();
  state = {
    ...state,
    board: new BoardSnapshot([
      { coordinate: axial(0n, 0n), elements: [] },
      { coordinate: axial(10n ** 30n, 0n), elements: [] },
    ]),
  };
  expect(evaluateBoard(state)).toEqual({
    status: 'unavailable',
    reason: 'limit.batch',
  });
  const batch = evaluateBoard(initialState(), 0n);
  if (batch.status !== 'complete') throw new Error('Batch');
  expect(presentation(batch.results.get('2,0'))).toBe('failed');
  expect(blockerKeys(batch.results.get('2,0'))).toEqual(new Set());
});
it('distinguishes pending, invalid, unsupported and ruleset-invalid projections', () => {
  expect(presentation(undefined)).toBe('pending');
  for (const [status, style] of [
    ['invalid-query-input', 'invalid-query'],
    ['unsupported-ruleset-or-configuration', 'unsupported'],
  ] as const)
    expect(presentation({ status, explanations: [] })).toBe(style);
  const failure: VisibilityResult = {
    status: 'evaluation-failure',
    cause: 'internal-error',
    explanations: [],
  };
  expect(presentation(failure)).toBe('failed');
  const batch = evaluateBoard(initialState());
  if (batch.status !== 'complete') throw new Error('Batch');
  const valid = batch.results.get('2,0');
  if (valid?.status !== 'evaluated') throw new Error('Result');
  expect(
    presentation({
      ...valid,
      los: { ...valid.los, status: 'invalid-under-ruleset' },
      visibility: { status: 'not-applicable' },
    }),
  ).toBe('rule-invalid');
  expect(
    semantic({
      code: 'generic.edge-feature-ignored',
      arguments: { featureId: 'edge-1' },
    }),
  ).toContain('edge-1');
});
it('retains simultaneous blocker identities for target highlighting', () => {
  let state = initialState();
  state = {
    ...state,
    board: new BoardSnapshot([
      { coordinate: axial(0n, 0n), elements: [] },
      { coordinate: axial(2n, -1n), elements: [] },
      {
        coordinate: axial(1n, 0n),
        elements: [{ id: 'first', kind: 'obstacle', properties: {} }],
      },
      {
        coordinate: axial(1n, -1n),
        elements: [{ id: 'second', kind: 'obstacle', properties: {} }],
      },
    ]),
    target: axial(2n, -1n),
  };
  state = setRuleset(state, ANY_CONTACT.id);
  const batch = evaluateBoard(state);
  if (batch.status !== 'complete') throw new Error('Batch');
  const result = batch.results.get('2,-1');
  expect(blockerKeys(result)).toEqual(new Set(['1,0', '1,-1']));
  if (result?.status !== 'evaluated') throw new Error('Result');
  expect(
    result.evidenceEvents
      .find((e) => e.t.numerator === 1n && e.t.denominator === 3n)
      ?.evidence.filter((e) => e.effect === 'blocking'),
  ).toHaveLength(2);
});
