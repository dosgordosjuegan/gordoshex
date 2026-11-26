import { expect, it } from 'vitest';
import { axial, edgeId } from '../../src/index.js';
import {
  BoardSnapshot,
  BUILTIN_RULESETS,
  deserializeScenario,
  serializeScenario,
  evaluateVisibility,
  MEMOIR44_REFRESH2025,
  type BoardEntity,
} from '../../src/application.js';
import { makeBoard, evaluate, completed, REFERENCE, unit } from './support.js';
const target = axial(2n, 0n);
const invalidEntities: readonly BoardEntity[][] = [
  [{ id: 'bad', kind: 'obstacle', properties: {} }],
  ...['lake', 'mountain', 'sea-bluff'].map((type) => [
    { id: 'bad', kind: 'memoir44.terrain', properties: { type } },
  ]),
  [
    {
      id: 'bad',
      kind: 'memoir44.terrain',
      properties: { type: 'hill', elevation: 2 },
    },
  ],
  [{ id: 'bad', kind: 'memoir44.obstacle', properties: { type: 'roadblock' } }],
  [
    {
      id: 'bad',
      kind: 'memoir44.unit',
      properties: { type: 'infantry', variant: 'elite', side: 'allies' },
    },
  ],
  [
    {
      id: 'bad',
      kind: 'memoir44.unit',
      properties: { type: 'sniper', variant: 'standard', side: 'allies' },
    },
  ],
  [
    {
      id: 'bad',
      kind: 'memoir44.unit',
      properties: { type: 'infantry', variant: 'standard', side: 'neutral' },
    },
  ],
  [unit('one'), unit('two')],
  ['open', 'forest'].map((type) => ({
    id: type,
    kind: 'memoir44.terrain',
    properties: { type },
  })),
  ['one', 'two'].map((id) => ({
    id,
    kind: 'memoir44.obstacle',
    properties: { type: 'wire' },
  })),
];
for (const [index, entities] of invalidEntities.entries())
  it(`rejects unsupported payload or semantic stack ${index}`, () => {
    const board = makeBoard({
      target,
      placements: entities.map((entity) => ({
        coordinate: axial(1n, 0n),
        entity,
      })),
    });
    expect(evaluate(board, target).status).toBe('invalid-query-input');
    expect(() =>
      serializeScenario({ board, ruleset: REFERENCE }, BUILTIN_RULESETS),
    ).toThrow();
  });
it('requires a supported observer, but permits empty-target inspection', () => {
  expect(evaluate(makeBoard({ target, observer: null }), target).status).toBe(
    'invalid-query-input',
  );
  expect(
    completed(makeBoard({ target, targetUnit: null }), target).los.status,
  ).toBe('clear');
});
it('rejects shared-edge features even away from the sightline', () => {
  const base = makeBoard({ target }),
    board = new BoardSnapshot(base.cells, [
      {
        edge: edgeId(axial(0n, 1n), axial(1n, 1n)),
        features: [
          {
            id: 'wall',
            kind: 'memoir44.obstacle',
            properties: { type: 'sea-wall' },
          },
        ],
      },
    ]);
  const result = evaluate(board, target);
  expect(result.status).toBe('invalid-query-input');
  if (result.status === 'invalid-query-input')
    expect(result.explanations[0]?.code).toBe(
      'memoir44.unsupported-edge-features',
    );
});
it('does not fall back for unknown configuration, identity or version', () => {
  const board = makeBoard({ target }),
    base = {
      board,
      origin: axial(0n, 0n),
      target,
      range: { kind: 'unlimited' },
    };
  for (const ruleset of [
    { ...REFERENCE, configuration: { legacy: true } },
    { ...REFERENCE, id: 'memoir44.legacy' },
    { ...REFERENCE, version: '2' },
  ])
    expect(evaluateVisibility({ ...base, ruleset }).status).toBe(
      'unsupported-ruleset-or-configuration',
    );
});
it('round-trips ordered data, IDs, board membership and the adapter reference', () => {
  const board = makeBoard({ target }),
    source = serializeScenario({ board, ruleset: REFERENCE }, BUILTIN_RULESETS),
    restored = deserializeScenario(source, BUILTIN_RULESETS);
  expect(serializeScenario(restored, BUILTIN_RULESETS)).toBe(source);
  expect(restored.board.cells).toEqual(board.cells);
  expect(completed(restored.board, target)).toEqual(completed(board, target));
  expect(() =>
    deserializeScenario(
      source.replace('"standard"', '"elite"'),
      BUILTIN_RULESETS,
    ),
  ).toThrow();
  const empty = { board: new BoardSnapshot(), ruleset: REFERENCE };
  expect(
    deserializeScenario(
      serializeScenario(empty, BUILTIN_RULESETS),
      BUILTIN_RULESETS,
    ).board.cells,
  ).toEqual([]);
});
it('propagates geometry resource failures without any visibility verdict', () => {
  const far = axial(1000000n, 0n),
    board = new BoardSnapshot([
      { coordinate: axial(0n, 0n), elements: [unit('a')] },
      { coordinate: far, elements: [] },
    ]);
  const result = evaluateVisibility({
    board,
    origin: axial(0n, 0n),
    target: far,
    range: { kind: 'unlimited' },
    ruleset: REFERENCE,
    maxCandidates: 1n,
  });
  expect(result).toMatchObject({
    status: 'evaluation-failure',
    cause: 'resource-limit',
  });
  expect(result).not.toHaveProperty('visibility');
  expect(result).not.toHaveProperty('los');
  const self = evaluateVisibility({
    board,
    origin: axial(0n, 0n),
    target: axial(0n, 0n),
    range: { kind: 'unlimited' },
    ruleset: REFERENCE,
    maxCandidates: 0n,
  });
  expect(self).toMatchObject({
    status: 'evaluation-failure',
    cause: 'resource-limit',
  });
});
it('isolates query-validator failures as evaluation failures', () => {
  const result = evaluateVisibility(
    {
      board: makeBoard({ target }),
      origin: axial(0n, 0n),
      target,
      range: { kind: 'unlimited' },
      ruleset: REFERENCE,
    },
    [
      {
        ...MEMOIR44_REFRESH2025,
        validateQuery: () => {
          throw new Error('test');
        },
      },
    ],
  );
  expect(result).toMatchObject({
    status: 'evaluation-failure',
    cause: 'internal-error',
  });
});
it('scenario round-trip retains holes, complete stacked evidence and ordering', () => {
  const base = makeBoard({ target }),
    board = new BoardSnapshot(
      base.cells
        .map((c) =>
          c.coordinate.q === 1n && c.coordinate.r === 0n
            ? {
                coordinate: c.coordinate,
                elements: [
                  {
                    id: 'sandbags',
                    kind: 'memoir44.obstacle',
                    properties: { type: 'sandbags' },
                  },
                  unit('middle'),
                  {
                    id: 'hill',
                    kind: 'memoir44.terrain',
                    properties: { type: 'hill' },
                  },
                  {
                    id: 'bunker',
                    kind: 'memoir44.obstacle',
                    properties: { type: 'bunker' },
                  },
                ],
              }
            : c,
        )
        .filter((c) => !(c.coordinate.q === -1n && c.coordinate.r === -1n)),
    );
  const restored = deserializeScenario(
    serializeScenario({ board, ruleset: REFERENCE }, BUILTIN_RULESETS),
    BUILTIN_RULESETS,
  );
  expect(restored.board.cells).toEqual(board.cells);
  expect(restored.board.hasCell(axial(-1n, -1n))).toBe(false);
  expect(completed(restored.board, target)).toEqual(completed(board, target));
  expect(
    restored.board.cellAt(axial(1n, 0n))?.elements.map((e) => e.id),
  ).toEqual(['sandbags', 'middle', 'hill', 'bunker']);
});
