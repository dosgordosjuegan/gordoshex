import { it, expect } from 'vitest';
import { axial, coordinateKey } from '../../src/index.js';
import {
  MEMOIR44_TERRAINS,
  MEMOIR44_INSTALLATIONS,
  MEMOIR44_UNIT_TYPES,
  memoir44Cell,
  validateMemoir44Board,
  BoardSnapshot,
  type VisibilityResult,
} from '../../src/application.js';
import {
  initialState,
  activateCell,
  setRange,
  generate,
  addGeneric,
  editEdge,
} from '../../web/state.js';
import { initialMemoirState, WorkingBoards } from '../../web/workspaces.js';
import { paintMemoir } from '../../web/memoir-editing.js';
import { evaluateBoard, presentation } from '../../web/evaluation.js';
import {
  memoirFacts,
  artilleryAnnotation,
} from '../../web/memoir-presentation.js';
import { semantic } from '../../web/format.js';
const zero = axial(0n, 0n),
  middle = axial(1n, 0n),
  target = axial(2n, 0n);
function result(
  state = initialMemoirState(),
  coordinate = target,
): VisibilityResult {
  const batch = evaluateBoard(state);
  if (batch.status !== 'complete') throw new Error('Batch');
  const query = batch.results.get(coordinateKey(coordinate));
  if (!query) throw new Error('Target');
  return query;
}
it('restores separate compatible working snapshots without converting or discarding entities', () => {
  const generic = addGeneric(initialState(), target, 'marker'),
    workspaces = new WorkingBoards(generic);
  let memoir = workspaces.switch(generic, 'memoir44.refresh2025');
  expect(memoir.board).not.toBe(generic.board);
  expect(validateMemoir44Board(memoir.board)).toEqual([]);
  memoir = paintMemoir(memoir, target, { kind: 'terrain', type: 'hill' });
  memoir = setRange(memoir, { kind: 'radius', radius: 2n });
  const restored = workspaces.switch(memoir, 'generic.any-contact');
  expect(restored.board).toBe(generic.board);
  expect(restored.board.cellAt(target)?.elements[0]?.kind).toBe('marker');
  const back = workspaces.switch(restored, 'memoir44.refresh2025');
  expect(back.board).toBe(memoir.board);
  expect(back.range).toEqual(memoir.range);
  expect(() => workspaces.switch(back, 'memoir44.legacy')).toThrow();
});
for (const type of MEMOIR44_TERRAINS)
  it(`terrain ${type} replaces only the terrain role`, () => {
    let state = paintMemoir(
      paintMemoir(initialMemoirState(), middle, {
        kind: 'terrain',
        type: type === 'forest' ? 'hill' : 'forest',
      }),
      middle,
      {
        kind: 'unit',
        type: 'armor',
        side: 'axis',
      },
    );
    state = paintMemoir(state, middle, {
      kind: 'installation',
      type: 'bunker',
    });
    const original = state.board,
      data = memoir44Cell(original.cellAt(middle)!);
    state = paintMemoir(state, middle, { kind: 'terrain', type });
    const cell = state.board.cellAt(middle);
    if (!cell) throw new Error('Cell');
    const next = memoir44Cell(cell);
    expect(next.terrain).toBe(type);
    expect(next.unit?.entity.id).toBe(data.unit?.entity.id);
    expect(next.installations.map((i) => i.entity.id)).toEqual(
      data.installations.map((i) => i.entity.id),
    );
    expect(original.cellAt(middle)?.elements).not.toBe(cell.elements);
    expect(paintMemoir(state, middle, { kind: 'terrain', type })).toBe(state);
    expect(validateMemoir44Board(state.board)).toEqual([]);
  });
for (const type of MEMOIR44_UNIT_TYPES)
  it(`unit ${type} replaces only the unit, with stable unrelated identities`, () => {
    let state = paintMemoir(initialMemoirState(), middle, {
      kind: 'installation',
      type: 'wire',
    });
    state = paintMemoir(state, middle, {
      kind: 'unit',
      type: 'infantry',
      side: 'allies',
    });
    const original = state.board.cellAt(middle);
    if (!original) throw new Error('Cell');
    state = paintMemoir(state, middle, { kind: 'unit', type, side: 'axis' });
    const cell = state.board.cellAt(middle);
    if (!cell) throw new Error('Cell');
    expect(memoir44Cell(cell).unit).toMatchObject({ type, side: 'axis' });
    expect(cell.elements.filter((e) => e.kind !== 'memoir44.unit')).toEqual(
      original.elements.filter((e) => e.kind !== 'memoir44.unit'),
    );
    state = paintMemoir(state, middle, { kind: 'remove-unit' });
    expect(state.board.cellAt(middle)?.elements).toEqual(
      original.elements.filter((e) => e.kind !== 'memoir44.unit'),
    );
  });
for (const type of MEMOIR44_INSTALLATIONS)
  it(`installation ${type} can be placed and removed independently`, () => {
    let state = paintMemoir(initialMemoirState(), middle, {
      kind: 'unit',
      type: 'infantry',
      side: 'allies',
    });
    const original = state.board.cellAt(middle)?.elements;
    state = paintMemoir(state, middle, { kind: 'installation', type });
    expect(paintMemoir(state, middle, { kind: 'installation', type })).toBe(
      state,
    );
    state = paintMemoir(state, middle, { kind: 'remove-installation', type });
    expect(state.board.cellAt(middle)?.elements).toEqual(original);
    state = paintMemoir(state, middle, { kind: 'remove-terrain' });
    const cell = state.board.cellAt(middle);
    if (!cell) throw new Error('Cell');
    expect(memoir44Cell(cell).terrain).toBe('open');
    expect(memoir44Cell(cell).unit?.type).toBe('infantry');
  });
it('requires an observing unit, keeps its coordinate on removal, and updates replacement ranges', () => {
  let state = paintMemoir(initialMemoirState(), zero, { kind: 'remove-unit' });
  expect(state.origin).toEqual(zero);
  const invalid = result(state);
  expect(invalid.status).toBe('invalid-query-input');
  if (invalid.status === 'invalid-query-input')
    expect(semantic(invalid.explanations[0]!)).toContain(
      'observer cell needs a supported',
    );
  state = paintMemoir(state, zero, {
    kind: 'unit',
    type: 'artillery',
    side: 'axis',
  });
  const query = result(state);
  expect(memoirFacts(query)).toMatchObject({
    unitType: 'artillery',
    intrinsic: '6',
    cap: 'unlimited',
    effective: '6',
    losRequired: false,
  });
  expect(artilleryAnnotation(query)).toBe(true);
  if (query.status === 'evaluated') {
    expect(query.los.status).toBe('blocked');
    expect(query.visibility).toEqual({ status: 'applicable', visible: false });
  }
  state = activateCell({ ...state, mode: 'remove-cell' }, zero);
  expect(state.origin).toBeNull();
});
for (const type of MEMOIR44_UNIT_TYPES)
  it(`displays adapter-owned ${type} range and additional caps`, () => {
    let state = generate(initialMemoirState(), '8', '1', 'axial');
    state = paintMemoir(state, zero, { kind: 'unit', type, side: 'allies' });
    const max = type === 'artillery' ? 6n : 3n;
    const inside = result(state, axial(max, 0n)),
      outside = result(state, axial(max + 1n, 0n));
    expect(inside.status).toBe('evaluated');
    if (inside.status === 'evaluated')
      expect(inside.range.status).toBe('in-range');
    if (outside.status === 'evaluated')
      expect(outside.range.status).toBe('out-of-range');
    state = setRange(state, { kind: 'radius', radius: 2n });
    expect(memoirFacts(result(state))).toMatchObject({
      unitType: type,
      intrinsic: String(max),
      cap: '2',
      effective: '2',
    });
  });
it('keeps invalid/unsupported results explicit and rejects generic editing in Memoir mode', () => {
  let state = initialMemoirState();
  state = {
    ...state,
    board: new BoardSnapshot(
      state.board.cells.map((c) =>
        coordinateKey(c.coordinate) === '1,0'
          ? {
              ...c,
              elements: [
                {
                  id: 'lake',
                  kind: 'memoir44.terrain',
                  properties: { type: 'lake' },
                },
              ],
            }
          : c,
      ),
    ),
  };
  const invalid = result(state);
  expect(presentation(invalid)).toBe('invalid-query');
  if (invalid.status === 'invalid-query-input')
    for (const explanation of invalid.explanations)
      expect(semantic(explanation)).not.toContain('memoir44.');
  expect(
    presentation(
      result({ ...initialMemoirState(), rulesetId: 'memoir44.legacy' }),
    ),
  ).toBe('unsupported');
  const unsupported = result({
    ...initialMemoirState(),
    rulesetId: 'memoir44.legacy',
  });
  if (unsupported.status === 'unsupported-ruleset-or-configuration')
    expect(semantic(unsupported.explanations[0]!)).toContain(
      'requested ruleset or version is unavailable',
    );
  expect(memoirFacts(invalid)).toBeNull();
  expect(artilleryAnnotation(invalid)).toBe(false);
  expect(() => addGeneric(initialMemoirState(), middle, 'marker')).toThrow();
  expect(() =>
    paintMemoir(initialState(), middle, { kind: 'terrain', type: 'forest' }),
  ).toThrow();
  const edge = { first: zero, second: middle, key: '0,0|1,0' };
  expect(() => editEdge(initialMemoirState(), edge)).toThrow();
});
for (const [q, r, inRange] of [
  [5n, 6n, false],
  [4n, 8n, false],
] as const)
  it(`Memoir manual fixture (${q},${r}) remains blocked and independently outside infantry range`, () => {
    let state = generate(initialMemoirState(), '13', '9', 'axial');
    state = paintMemoir(state, axial(7n, 2n), {
      kind: 'unit',
      type: 'infantry',
      side: 'allies',
    });
    state = paintMemoir(state, axial(7n, 3n), {
      kind: 'terrain',
      type: 'forest',
    });
    state = paintMemoir(state, axial(5n, 5n), {
      kind: 'terrain',
      type: 'town',
    });
    state = activateCell({ ...state, mode: 'observer' }, axial(7n, 2n));
    const query = result(state, axial(q, r));
    if (query.status !== 'evaluated') throw new Error('Evaluation');
    expect(query.los.status).toBe('blocked');
    expect(query.range.status).toBe(inRange ? 'in-range' : 'out-of-range');
    expect(
      query.los.evidence.filter((e) => e.effect === 'blocking'),
    ).toHaveLength(2);
    expect(query.context.distance).toBe(q === 5n ? 4n : 6n);
    const artillery = paintMemoir(state, axial(7n, 2n), {
      kind: 'unit',
      type: 'artillery',
      side: 'allies',
    });
    const exempt = result(artillery, axial(q, r));
    if (exempt.status !== 'evaluated') throw new Error('Artillery evaluation');
    expect(exempt.range.status).toBe('in-range');
    expect(exempt.los.status).toBe('blocked');
    expect(exempt.visibility).toEqual({ status: 'applicable', visible: false });
    expect(artilleryAnnotation(exempt)).toBe(true);
    expect(query.los.explanations.map(semantic).join(' ')).toContain(
      'both sides anywhere',
    );
  });
it('formats elevation, endpoint, vertex and membership conventions without internal codes in normal explanations', () => {
  for (const code of [
    'memoir44.lower-obstruction-exempt',
    'memoir44.bare-hill-exempt',
    'memoir44.endpoint-exempt',
    'memoir44.vertex-modeling-convention',
    'memoir44.absent-positive-contact',
    'memoir44.sided-vertex-obstruction',
  ]) {
    const text = semantic({ code, arguments: {} });
    expect(text).not.toContain('memoir44.');
    expect(text.length).toBeGreaterThan(30);
  }
});
