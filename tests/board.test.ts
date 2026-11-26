import { it, expect } from 'vitest';
import fc from 'fast-check';
import { axial, coordinateKey, edgeId, localEdge } from '../src/index.js';
import * as b from '../src/application.js';
const a = axial(0n, 0n),
  middle = axial(1n, 0n),
  target = axial(2n, 0n);
const entity = (id: string, kind = 'obstacle'): b.BoardEntity => ({
  id,
  kind,
  properties: {},
});
it('board membership uses coordinate values, including empty, holed and disconnected boards', () => {
  const board = new b.BoardSnapshot([
    { coordinate: a, elements: [] },
    { coordinate: target, elements: [] },
    { coordinate: axial(-100n, 100n), elements: [] },
  ]);
  expect(new b.BoardSnapshot().cells).toEqual([]);
  expect(board.hasCell(axial(0n, 0n))).toBe(true);
  expect(board.cellAt(middle)).toBeUndefined();
  expect(board.cellAt(a)?.elements).toEqual([]);
  expect(board.cells).toHaveLength(3);
  expect(() => b.addCell(board, a)).toThrow('duplicate-coordinate');
  expect(() => b.removeCell(board, middle)).toThrow('absent-cell');
  const added = b.addCell(board, middle);
  expect(board.hasCell(middle)).toBe(false);
  expect(added.hasCell(middle)).toBe(true);
});
it('snapshots copy coordinate, stack and nested payload aliases and expose no mutable collections', () => {
  const coordinate = { q: 0n, r: 0n },
    properties = { nested: { list: [{ name: 'original' }] } },
    element = { id: 'x', kind: 'transparent', properties };
  const elements = [element],
    cells = [{ coordinate, elements }],
    board = new b.BoardSnapshot(cells);
  coordinate.q = 8n;
  element.id = 'changed';
  properties.nested.list[0]!.name = 'changed';
  properties.nested.list.push({ name: 'new' });
  elements.pop();
  cells.pop();
  expect(board.cellAt(a)?.elements).toEqual([
    {
      id: 'x',
      kind: 'transparent',
      properties: { nested: { list: [{ name: 'original' }] } },
    },
  ]);
  expect(Reflect.set(board, 'cells', [])).toBe(false);
  expect(() =>
    Reflect.apply(Array.prototype.push, board.cells, [
      { coordinate: middle, elements: [] },
    ]),
  ).toThrow();
  const check = (value: unknown): void => {
    if (typeof value !== 'object' || value === null) return;
    expect(value instanceof Map || value instanceof Set).toBe(false);
    expect(Object.isFrozen(value)).toBe(true);
    for (const child of Object.values(value)) check(child);
  };
  check(board);
});
it('element editing preserves stable identities and snapshots while supporting exact stack permutations', () => {
  let board = new b.BoardSnapshot([
    {
      coordinate: a,
      elements: [entity('T', 'transparent'), entity('O1'), entity('O2')],
    },
  ]);
  const before = board;
  board = b.reorderElements(board, a, ['O2', 'T', 'O1']);
  expect(board.cellAt(a)?.elements.map((e) => e.id)).toEqual(['O2', 'T', 'O1']);
  expect(before.cellAt(a)?.elements.map((e) => e.id)).toEqual([
    'T',
    'O1',
    'O2',
  ]);
  board = b.addElement(board, a, entity('inserted'), 1);
  expect(board.cellAt(a)?.elements.map((e) => e.id)).toEqual([
    'O2',
    'inserted',
    'T',
    'O1',
  ]);
  board = b.removeElement(board, a, 'inserted');
  expect(board.cellAt(a)?.elements.map((e) => e.id)).toEqual(['O2', 'T', 'O1']);
  for (const ids of [
    ['O2', 'O2', 'O1'],
    ['O2', 'T'],
    ['O2', 'T', 'unknown'],
  ])
    expect(() => b.reorderElements(board, a, ids)).toThrow(
      'invalid-stack-permutation',
    );
  for (const index of [-1, 1.5, 100, NaN])
    expect(() => b.addElement(board, a, entity('new'), index)).toThrow(
      'invalid-stack-index',
    );
  expect(() => b.removeElement(board, a, 'missing')).toThrow();
  expect(() => b.addElement(board, middle, entity('new'))).toThrow();
});
it('shared edges retain multiple features through either local reference and clean up after last incident cell', () => {
  const edge = localEdge(a, 0),
    opposite = localEdge(middle, 3);
  let board = new b.BoardSnapshot([
    { coordinate: a, elements: [entity('unit')] },
    { coordinate: middle, elements: [] },
  ]);
  board = b.addEdgeFeature(board, edge, entity('F1', 'wall'));
  board = b.addEdgeFeature(board, opposite, entity('F2', 'hedge'));
  expect(board.edges).toHaveLength(1);
  expect(board.featuresAt(opposite).map((f) => f.id)).toEqual(['F1', 'F2']);
  const firstRemoved = b.removeCell(board, a);
  expect(firstRemoved.cellAt(a)).toBeUndefined();
  expect(firstRemoved.featuresAt(edge)).toHaveLength(2);
  expect(board.cellAt(a)?.elements).toHaveLength(1);
  const lastRemoved = b.removeCell(firstRemoved, middle);
  expect(lastRemoved.cells).toEqual([]);
  expect(lastRemoved.edges).toEqual([]);
  const featureRemoved = b.removeEdgeFeature(board, edge, 'F1');
  expect(featureRemoved.featuresAt(edge).map((f) => f.id)).toEqual(['F2']);
  expect(b.removeEdgeFeature(featureRemoved, edge, 'F2').edges).toEqual([]);
  expect(() => b.removeEdgeFeature(board, edge, 'unknown')).toThrow();
});
it('edge feature payload aliases are also copied and frozen', () => {
  const payload = { tags: ['first'] },
    feature = { id: 'feature', kind: 'wall', properties: payload };
  const board = b.addEdgeFeature(
    b.addCell(new b.BoardSnapshot(), a),
    localEdge(a, 0),
    feature,
  );
  payload.tags.push('second');
  feature.id = 'changed';
  expect(board.featuresAt(localEdge(middle, 3))).toEqual([
    { id: 'feature', kind: 'wall', properties: { tags: ['first'] } },
  ]);
  expect(
    Object.isFrozen(board.featuresAt(localEdge(a, 0))[0]?.properties.tags),
  ).toBe(true);
});
it('duplicate IDs are rejected across all cells and edge features', () => {
  expect(
    () =>
      new b.BoardSnapshot([
        { coordinate: a, elements: [entity('same')] },
        { coordinate: middle, elements: [entity('same')] },
      ]),
  ).toThrow('duplicate-entity-id');
  const board = new b.BoardSnapshot([
    { coordinate: a, elements: [entity('same')] },
  ]);
  expect(() =>
    b.addEdgeFeature(board, localEdge(a, 0), entity('same')),
  ).toThrow('duplicate-entity-id');
  const withFeature = b.addEdgeFeature(
    board,
    localEdge(a, 0),
    entity('feature'),
  );
  expect(() =>
    b.addEdgeFeature(withFeature, localEdge(a, 1), entity('feature')),
  ).toThrow('duplicate-entity-id');
  expect(() => b.addElement(board, a, entity(''))).toThrow();
});
it('coordinates, duplicate membership, edge identity and incidence are validated', () => {
  expect(
    () =>
      new b.BoardSnapshot([
        { coordinate: a, elements: [] },
        { coordinate: axial(0n, 0n), elements: [] },
      ]),
  ).toThrow('duplicate-coordinate');
  for (const coordinate of [
    { q: 1, r: 0n },
    { q: '1', r: 0n },
    { q: 0n, r: 0n, s: 0n },
    null,
  ])
    expect(() =>
      Reflect.construct(b.BoardSnapshot, [[{ coordinate, elements: [] }]]),
    ).toThrow();
  const cells = [{ coordinate: a, elements: [] }],
    features = [entity('F')],
    edge = localEdge(a, 0);
  expect(
    () =>
      new b.BoardSnapshot(cells, [
        { edge: { ...edge, key: 'wrong' }, features },
      ]),
  ).toThrow('noncanonical-edge-key');
  expect(
    () =>
      new b.BoardSnapshot(cells, [{ edge: edgeId(middle, target), features }]),
  ).toThrow('detached-edge');
  expect(
    () =>
      new b.BoardSnapshot(cells, [
        { edge, features },
        { edge, features: [entity('F2')] },
      ]),
  ).toThrow('duplicate-edge');
  expect(() => new b.BoardSnapshot(cells, [{ edge, features: [] }])).toThrow(
    'empty-edge-features',
  );
  expect(() =>
    Reflect.construct(b.BoardSnapshot, [
      cells,
      [{ edge: { first: a, second: target, key: '0,0|2,0' }, features }],
    ]),
  ).toThrow();
});
it('payload boundaries reject values that cannot be safely copied into the scenario contract', () => {
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  const getter = {
    get secret() {
      throw new Error('must not run');
    },
  };
  const sparse = new Array(2),
    extra = Object.assign([1], { extra: true });
  for (const properties of [
    { bad: undefined },
    { bad: 1n },
    { bad: NaN },
    { bad: Infinity },
    { bad: () => 0 },
    new Map(),
    new Date(),
    cycle,
    getter,
    { bad: sparse },
    { bad: extra },
    Object.create({ inherited: 1 }),
  ])
    expect(() =>
      Reflect.construct(b.BoardSnapshot, [
        [{ coordinate: a, elements: [{ id: 'bad', kind: 'x', properties }] }],
      ]),
    ).toThrow();
  let getterRead = false;
  const hiddenAccessor = [1];
  Object.defineProperty(hiddenAccessor, '0', {
    enumerable: false,
    get() {
      getterRead = true;
      return 1;
    },
  });
  expect(() => b.jsonObject({ hiddenAccessor })).toThrow(
    'unsupported-array-member',
  );
  expect(getterRead).toBe(false);
  const payload: unknown = JSON.parse('{"__proto__":{"polluted":true}}');
  expect(b.jsonObject(payload)['__proto__']).toEqual({ polluted: true });
  expect(Object.hasOwn({}, 'polluted')).toBe(false);
});
it('axial and offset generators follow local parity before signed/huge translation', () => {
  const origin = axial(9007199254740993n, -9007199254740994n);
  const sets = [
    b.axialRectangle(3n, 3n, origin),
    b.pointyOddRowRectangle(3n, 3n, origin),
    b.flatOddColumnRectangle(3n, 3n, origin),
  ];
  expect(sets.every((board) => board.cells.length === 9)).toBe(true);
  expect(sets[0]?.hasCell(axial(origin.q + 2n, origin.r + 2n))).toBe(true);
  expect(sets[1]?.hasCell(axial(origin.q - 1n, origin.r + 2n))).toBe(true);
  expect(sets[2]?.hasCell(axial(origin.q + 2n, origin.r - 1n))).toBe(true);
  for (const generator of [
    b.axialRectangle,
    b.pointyOddRowRectangle,
    b.flatOddColumnRectangle,
  ]) {
    expect(generator(0n, 10n ** 100n).cells).toEqual([]);
    expect(generator(10n ** 100n, 0n).cells).toEqual([]);
    for (const [width, height] of [
      [-1n, 1n],
      [1n, -1n],
      [1.5, 2n],
      [2n, NaN],
      ['2', 2n],
    ])
      expect(() =>
        Reflect.apply(generator, undefined, [width, height]),
      ).toThrow();
  }
  expect(() =>
    Reflect.apply(b.rectangle, undefined, [1n, 1n, a, 'unsupported']),
  ).toThrow('invalid-layout');
});
it('rectangle counts and value coordinates obey all three formulas under arbitrary translations', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 6 }),
      fc.integer({ min: 0, max: 6 }),
      fc.bigInt(),
      fc.bigInt(),
      (w, h, q, r) => {
        for (const [layout, generator] of [
          ['axial', b.axialRectangle],
          ['pointy', b.pointyOddRowRectangle],
          ['flat', b.flatOddColumnRectangle],
        ] as const) {
          const board = generator(BigInt(w), BigInt(h), axial(q, r));
          expect(board.cells).toHaveLength(w * h);
          const expected: string[] = [];
          for (let row = 0; row < h; row++)
            for (let c = 0; c < w; c++)
              expected.push(
                coordinateKey(
                  axial(
                    q +
                      BigInt(c) -
                      (layout === 'pointy' ? BigInt(Math.floor(row / 2)) : 0n),
                    r +
                      BigInt(row) -
                      (layout === 'flat' ? BigInt(Math.floor(c / 2)) : 0n),
                  ),
                ),
              );
          expect(
            new Set(board.cells.map((c) => coordinateKey(c.coordinate))),
          ).toEqual(new Set(expected));
        }
      },
    ),
    { seed: 2101, numRuns: 100 },
  );
});
it('shared payload aliases are copied independently and unsafe integer properties reject', () => {
  const shared = { nested: { value: 1 } },
    board = new b.BoardSnapshot([
      {
        coordinate: a,
        elements: [
          { id: 'one', kind: 'transparent', properties: shared },
          { id: 'two', kind: 'transparent', properties: shared },
        ],
      },
    ]);
  shared.nested.value = 9;
  expect(board.cellAt(a)?.elements.map((e) => e.properties)).toEqual([
    { nested: { value: 1 } },
    { nested: { value: 1 } },
  ]);
  expect(() =>
    b.addElement(board, a, {
      id: 'unsafe',
      kind: 'transparent',
      properties: { value: 9007199254740992 },
    }),
  ).toThrow('unsupported-json-value');
});
