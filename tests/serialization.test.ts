import { it, expect } from 'vitest';
import fc from 'fast-check';
import { axial, edgeId, localEdge } from '../src/index.js';
import * as app from '../src/application.js';
const encode = (
  scenario: app.Scenario,
  collection: readonly app.Ruleset[] = app.GENERIC_RULESETS,
) => app.serializeScenario(scenario, collection);
const decode = (
  source: string,
  collection: readonly app.Ruleset[] = app.GENERIC_RULESETS,
) => app.deserializeScenario(source, collection);
const a = axial(0n, 0n),
  b = axial(2n, 0n),
  reference = { id: app.INTERIOR_ONLY.id, version: '1', configuration: {} };
const entity = (id: string): app.BoardEntity => ({
  id,
  kind: 'obstacle',
  properties: {},
});
const scenario = (): app.Scenario => ({
  board: new app.BoardSnapshot([
    { coordinate: a, elements: [] },
    { coordinate: b, elements: [entity('target')] },
  ]),
  ruleset: reference,
});
function rejects(
  source: string,
  code: app.ScenarioError['code'] = 'invalid-scenario',
): void {
  try {
    decode(source);
    throw new Error('Expected rejection');
  } catch (error) {
    expect(error).toBeInstanceOf(app.ScenarioError);
    if (error instanceof app.ScenarioError) expect(error.code).toBe(code);
  }
}
function encoded(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: 1,
    ruleset: reference,
    board: { cells: [], edges: [] },
    ...overrides,
  });
}
it('version-1 scenarios round-trip holes, empty membership, stacks, stable IDs and multiple canonical edge features', () => {
  let snapshot = app.addCell(new app.BoardSnapshot(), a);
  snapshot = app.addCell(snapshot, b);
  snapshot = app.addElement(snapshot, b, {
    id: 'T',
    kind: 'transparent',
    properties: { label: 'text', values: [null, true, 1.5] },
  });
  snapshot = app.addElement(snapshot, b, entity('O1'));
  snapshot = app.addElement(snapshot, b, entity('O2'));
  snapshot = app.reorderElements(snapshot, b, ['O2', 'T', 'O1']);
  snapshot = app.addEdgeFeature(snapshot, localEdge(a, 0), {
    id: 'F1',
    kind: 'wall',
    properties: { nested: { label: 'x' } },
  });
  snapshot = app.addEdgeFeature(snapshot, localEdge(a, 0), {
    id: 'F2',
    kind: 'hedge',
    properties: {},
  });
  const source = encode({ board: snapshot, ruleset: reference }),
    copy = decode(source);
  expect(encode(copy)).toBe(source);
  expect(copy.board.cellAt(a)?.elements).toEqual([]);
  expect(copy.board.hasCell(axial(1n, 0n))).toBe(false);
  expect(copy.board.cellAt(b)?.elements.map((e) => e.id)).toEqual([
    'O2',
    'T',
    'O1',
  ]);
  expect(
    copy.board.featuresAt(localEdge(axial(1n, 0n), 3)).map((e) => e.id),
  ).toEqual(['F1', 'F2']);
  expect(copy.ruleset).toEqual(reference);
  expect(Object.isFrozen(copy)).toBe(true);
  expect(Object.isFrozen(copy.ruleset.configuration)).toBe(true);
  const decoded: unknown = JSON.parse(source);
  expect(decoded).toMatchObject({
    schemaVersion: 1,
    board: {
      cells: [
        { coordinate: { q: '0', r: '0' } },
        { coordinate: { q: '2', r: '0' } },
      ],
    },
  });
  expect(source).not.toContain('geometry');
  expect(source).not.toContain('visibility');
});
it('huge canonical decimal coordinates and negative values never pass through numbers', () => {
  const n = 9007199254740993n,
    origin = axial(n, -n),
    board = new app.BoardSnapshot([{ coordinate: origin, elements: [] }]);
  const source = encode({ board, ruleset: reference });
  expect(source).toContain('"q":"9007199254740993"');
  expect(decode(source).board.hasCell(origin)).toBe(true);
});
it('empty board scenarios are valid, and ruleset identity survives for each public policy', () => {
  for (const ruleset of app.GENERIC_RULESETS) {
    const input = {
      board: new app.BoardSnapshot(),
      ruleset: { id: ruleset.id, version: ruleset.version, configuration: {} },
    };
    const copy = decode(encode(input));
    expect(copy.board.cells).toEqual([]);
    expect(copy.board.edges).toEqual([]);
    expect(copy.ruleset).toEqual(input.ruleset);
  }
});
it('unknown schema, ruleset versions and configuration options reject explicitly as unsupported', () => {
  rejects(encoded({ schemaVersion: 2 }), 'unsupported-scenario');
  rejects('{"schemaVersion":2,"futureFormat":true}', 'unsupported-scenario');
  for (const ruleset of [
    { ...reference, id: 'unavailable' },
    { ...reference, version: '2' },
    { ...reference, configuration: { option: true } },
  ])
    rejects(encoded({ ruleset }), 'unsupported-scenario');
});
it('malformed versions, configuration, root fields and JSON reject explicitly', () => {
  for (const source of [
    '',
    '{',
    'null',
    '[]',
    encoded({ schemaVersion: '1' }),
    encoded({ schemaVersion: 0 }),
    encoded({ schemaVersion: 1.5 }),
    encoded({ schemaVersion: -1 }),
    encoded({ extra: true }),
    encoded({ ruleset: { ...reference, configuration: [] } }),
    encoded({ ruleset: { ...reference, version: 1 } }),
    JSON.stringify({ schemaVersion: 1, ruleset: reference }),
  ])
    rejects(source);
  for (const value of [null, {}, 1, undefined])
    expect(() =>
      Reflect.apply(app.deserializeScenario, undefined, [
        value,
        app.GENERIC_RULESETS,
      ]),
    ).toThrow(app.ScenarioError);
});
it('noncanonical and approximate coordinate representations are rejected', () => {
  for (const q of [
    '+1',
    '01',
    '-0',
    ' 1',
    '1\n',
    '1.0',
    '1e3',
    '',
    1,
    1.5,
    9007199254740992,
    null,
  ])
    rejects(
      encoded({
        board: {
          cells: [{ coordinate: { q, r: '0' }, elements: [] }],
          edges: [],
        },
      }),
    );
  rejects(
    encoded({
      board: {
        cells: [{ coordinate: { q: '0', r: '0', s: '0' }, elements: [] }],
        edges: [],
      },
    }),
  );
});
it('duplicate cells, global entity IDs and opposite references to the same edge are rejected', () => {
  const cell = { coordinate: { q: '0', r: '0' }, elements: [] },
    neighbor = { coordinate: { q: '1', r: '0' }, elements: [] };
  rejects(encoded({ board: { cells: [cell, cell], edges: [] } }));
  rejects(
    encoded({
      board: {
        cells: [
          { ...cell, elements: [entity('same')] },
          { ...neighbor, elements: [entity('same')] },
        ],
        edges: [],
      },
    }),
  );
  const edge = {
    first: cell.coordinate,
    second: neighbor.coordinate,
    features: [{ id: 'feature', kind: 'wall', properties: {} }],
  };
  rejects(
    encoded({
      board: {
        cells: [{ ...cell, elements: [entity('feature')] }],
        edges: [edge],
      },
    }),
  );
  rejects(
    encoded({
      board: {
        cells: [cell],
        edges: [
          edge,
          {
            first: neighbor.coordinate,
            second: cell.coordinate,
            features: [{ id: 'other', kind: 'wall', properties: {} }],
          },
        ],
      },
    }),
  );
});
it('nonadjacent, identical, detached and empty-feature edge records are rejected', () => {
  const cell = { coordinate: { q: '0', r: '0' }, elements: [] },
    feature = { id: 'F', kind: 'wall', properties: {} };
  for (const edge of [
    { first: cell.coordinate, second: cell.coordinate, features: [feature] },
    { first: cell.coordinate, second: { q: '2', r: '0' }, features: [feature] },
    {
      first: { q: '5', r: '0' },
      second: { q: '6', r: '0' },
      features: [feature],
    },
    { first: cell.coordinate, second: { q: '1', r: '0' }, features: [] },
    {
      first: cell.coordinate,
      second: { q: '1', r: '0' },
      features: [feature],
      extra: true,
    },
  ])
    rejects(encoded({ board: { cells: [cell], edges: [edge] } }));
});
it('unknown fields and invalid generic obstacle payloads are never silently dropped', () => {
  const coordinate = { q: '0', r: '0' };
  for (const cell of [
    { coordinate, elements: [], extra: true },
    { coordinate, elements: [{ ...entity('x'), extra: true }] },
    { coordinate, elements: [{ ...entity('x'), properties: { height: 2 } }] },
    { coordinate, elements: [{ ...entity('x'), properties: [] }] },
    { coordinate, elements: [{ ...entity('x'), id: '' }] },
  ])
    rejects(encoded({ board: { cells: [cell], edges: [] } }));
  rejects(encoded({ ruleset: { ...reference, extra: true } }));
  rejects(encoded({ board: { cells: [], edges: [], extra: true } }));
  rejects(
    '{"schemaVersion":1,"ruleset":{"id":"generic.interior-only","version":"1","configuration":{}},"board":{"cells":[{"coordinate":{"q":"0","r":"0"},"elements":[{"id":"T","kind":"transparent","properties":{"bad":1e400}}]}],"edges":[]}}',
  );
});
it('duplicate JSON member names are rejected even when escaped or nested', () => {
  rejects(
    '{"schemaVersion":99,"schemaVersion":1,"ruleset":{"id":"generic.interior-only","version":"1","configuration":{}},"board":{"cells":[],"edges":[]}}',
  );
  rejects(
    '{"schemaVersion":1,"ruleset":{"id":"unknown","\\u0069d":"generic.interior-only","version":"1","configuration":{}},"board":{"cells":[],"edges":[]}}',
  );
  rejects(
    '{"schemaVersion":1,"ruleset":{"id":"generic.interior-only","version":"1","configuration":{}},"board":{"cells":[{"coordinate":{"q":"0","r":"0"},"elements":[{"id":"T","kind":"transparent","properties":{"nested":{"x":1,"x":2}}}]}],"edges":[]}}',
  );
});
it('duplicate-member scanning does not confuse escaped strings, arrays or separate objects', () => {
  let snapshot = app.addCell(new app.BoardSnapshot(), a);
  snapshot = app.addElement(snapshot, a, {
    id: 'T',
    kind: 'transparent',
    properties: {
      label: 'quote " slash \\ { } [ ] : ,',
      items: [{ x: 1 }, { x: 2 }],
      nested: { x: 3 },
    },
  });
  const source = encode({ board: snapshot, ruleset: reference });
  expect(encode(decode(source))).toBe(source);
});
it('programmatic serialization validates rulesets and preserves explicit errors', () => {
  expect(() =>
    encode({ ...scenario(), ruleset: { ...reference, version: '99' } }),
  ).toThrow(app.ScenarioError);
  const invalid = app.addElement(scenario().board, a, {
    id: 'bad',
    kind: 'obstacle',
    properties: { unknown: true },
  });
  expect(() => encode({ board: invalid, ruleset: reference })).toThrow(
    'invalid-scenario',
  );
  expect(() =>
    Reflect.apply(app.serializeScenario, undefined, [
      { board: {}, ruleset: reference },
      app.GENERIC_RULESETS,
    ]),
  ).toThrow('invalid-scenario');
});
it('static custom ruleset registrations can round-trip configuration without dynamic loading', () => {
  const custom: app.Ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.custom',
    version: '2',
    validateConfiguration: (configuration) =>
      configuration.mode === 'supported'
        ? { status: 'accepted' }
        : {
            status: 'unsupported',
            explanations: [app.message('test.unsupported')],
          },
  };
  const input = {
    board: new app.BoardSnapshot(),
    ruleset: {
      id: custom.id,
      version: custom.version,
      configuration: { mode: 'supported' },
    },
  };
  const source = encode(input, [custom]);
  expect(decode(source, [custom]).ruleset).toEqual(input.ruleset);
  rejects(source, 'unsupported-scenario');
});
it('arbitrary bounded signed scenarios preserve canonical membership and ordered payloads', () => {
  fc.assert(
    fc.property(
      fc.bigInt(),
      fc.bigInt(),
      fc.uniqueArray(
        fc.tuple(
          fc.integer({ min: -3, max: 3 }),
          fc.integer({ min: -3, max: 3 }),
        ),
        { selector: ([q, r]) => `${q},${r}`, maxLength: 12 },
      ),
      (q, r, pairs) => {
        const cells = pairs.map(([dq, dr], i) => ({
          coordinate: axial(q + BigInt(dq), r + BigInt(dr)),
          elements: [
            {
              id: `T${i}`,
              kind: 'transparent',
              properties: { index: i, notes: ['one', 'two'] },
            },
          ],
        }));
        let snapshot = new app.BoardSnapshot(cells);
        const first = snapshot.cells[0];
        if (first)
          snapshot = app.addEdgeFeature(
            snapshot,
            edgeId(
              first.coordinate,
              axial(first.coordinate.q + 1n, first.coordinate.r),
            ),
            { id: 'F', kind: 'wall', properties: {} },
          );
        const source = encode({ board: snapshot, ruleset: reference }),
          copy = decode(source);
        expect(encode(copy)).toBe(source);
        expect(copy.board.cells).toEqual(snapshot.cells);
        expect(copy.board.edges).toEqual(snapshot.edges);
      },
    ),
    { seed: 2102, numRuns: 150 },
  );
});
