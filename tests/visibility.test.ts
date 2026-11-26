import { it, expect, vi } from 'vitest';
import { axial, localEdge, rational, traceSightline } from '../src/index.js';
import * as geometry from '../src/geometry/query.js';
import * as contracts from '../src/rulesets/contracts.js';
import * as app from '../src/application.js';
const a = axial(0n, 0n),
  m = axial(1n, 0n),
  b = axial(2n, 0n);
const obstacle = (id: string): app.BoardEntity => ({
  id,
  kind: 'obstacle',
  properties: {},
});
const reference = (ruleset: app.Ruleset): app.RulesetReference => ({
  id: ruleset.id,
  version: ruleset.version,
  configuration: {},
});
const board = (coordinates = [a, m, b]): app.BoardSnapshot =>
  new app.BoardSnapshot(
    coordinates.map((coordinate) => ({ coordinate, elements: [] })),
  );
function evaluated(
  snapshot: app.BoardSnapshot,
  target = b,
  ruleset = app.INTERIOR_ONLY,
  range: app.Range = { kind: 'unlimited' },
): app.EvaluatedVisibility {
  const result = app.evaluateVisibility(
    { board: snapshot, origin: a, target, range, ruleset: reference(ruleset) },
    [ruleset],
  );
  expect(result.status).toBe('evaluated');
  if (result.status !== 'evaluated') throw new Error(JSON.stringify(result));
  return result;
}
const blockers = (result: app.EvaluatedVisibility) =>
  result.los.evidence.filter((e) => e.effect === 'blocking');
it('P9 G1 empty and absent cells are transparent under all demonstration policies', () => {
  for (const ruleset of app.GENERIC_RULESETS) {
    const complete = evaluated(board(), b, ruleset),
      hole = evaluated(board([a, b]), b, ruleset);
    expect(complete.context.distance).toBe(2n);
    expect(complete.los.status).toBe('clear');
    expect(hole.los.status).toBe('clear');
    expect(hole.context.geometry).toEqual(complete.context.geometry);
    expect(
      hole.context.cells.find((c) => c.contact.cell.q === 1n),
    ).toMatchObject({ membership: 'absent', elements: [] });
    expect(hole.los.evidence).toContainEqual(
      expect.objectContaining({
        effect: 'transparent',
        location: { kind: 'cell', coordinate: m, absent: true },
        contact: expect.objectContaining({
          entry: rational(1n, 4n),
          exit: rational(3n, 4n),
        }),
      }),
    );
    expect(hole.visibility).toEqual({ status: 'applicable', visible: true });
  }
});
it('P9 G1 all matching stacked obstacles block, while ordering is preserved without priority', () => {
  let snapshot = app.addElement(board(), m, {
    id: 'T',
    kind: 'transparent',
    properties: { label: 'ignored' },
  });
  snapshot = app.addElement(snapshot, m, obstacle('O1'));
  snapshot = app.addElement(snapshot, m, obstacle('O2'));
  for (const ruleset of app.GENERIC_RULESETS) {
    const before = evaluated(snapshot, b, ruleset),
      after = evaluated(
        app.reorderElements(snapshot, m, ['O2', 'T', 'O1']),
        b,
        ruleset,
      );
    expect(before.los.status).toBe('blocked');
    expect(
      new Set(
        blockers(before).map((e) =>
          e.location.kind === 'cell' ? e.location.elementId : null,
        ),
      ),
    ).toEqual(new Set(['O1', 'O2']));
    expect(
      new Set(
        blockers(after).map((e) =>
          e.location.kind === 'cell' ? e.location.elementId : null,
        ),
      ),
    ).toEqual(new Set(['O1', 'O2']));
    for (const evidence of blockers(before))
      expect(evidence).toMatchObject({
        contact: { entry: rational(1n, 4n), exit: rational(3n, 4n) },
        reason: { code: 'generic.obstacle-blocks' },
        location: { kind: 'cell', coordinate: m, absent: false },
      });
    expect(before.context.board.cellAt(m)?.elements.map((e) => e.id)).toEqual([
      'T',
      'O1',
      'O2',
    ]);
    expect(after.context.board.cellAt(m)?.elements.map((e) => e.id)).toEqual([
      'O2',
      'T',
      'O1',
    ]);
    expect(before.visibility).toEqual({ status: 'applicable', visible: false });
  }
});
it('P9 G2 preserves both edge-overlap blockers and their simultaneous evidence', () => {
  const target = axial(2n, -1n),
    other = axial(1n, -1n);
  const one = app.addElement(board([a, m, other, target]), m, obstacle('left'));
  for (const ruleset of app.GENERIC_RULESETS) {
    const single = evaluated(one, target, ruleset);
    expect(single.los.status).toBe(
      ruleset === app.INTERIOR_ONLY ? 'clear' : 'blocked',
    );
    const two = evaluated(
      app.addElement(one, other, obstacle('right')),
      target,
      ruleset,
    );
    if (ruleset === app.INTERIOR_ONLY) expect(blockers(two)).toEqual([]);
    else {
      expect(blockers(two)).toHaveLength(2);
      expect(
        new Set(
          blockers(two).map((e) =>
            e.location.kind === 'cell' ? e.location.elementId : null,
          ),
        ),
      ).toEqual(new Set(['left', 'right']));
      for (const blocker of blockers(two))
        expect(blocker.contact).toMatchObject({
          kind: 'edge-overlap',
          entry: rational(1n, 3n),
          exit: rational(2n, 3n),
        });
      const event = two.evidenceEvents.find(
        (event) => event.t.numerator === 1n && event.t.denominator === 3n,
      );
      expect(
        event?.evidence.filter((e) => e.effect === 'blocking'),
      ).toHaveLength(2);
      const shuffled = new app.BoardSnapshot(
        [...two.context.board.cells].reverse(),
        [...two.context.board.edges].reverse(),
      );
      expect(evaluated(shuffled, target, ruleset).los.evidence).toEqual(
        two.los.evidence,
      );
    }
  }
});
it('P9 G3 singleton vertex blocks only under any-contact and retains grouped incidences', () => {
  const target = axial(4n, 1n),
    vertex = axial(1n, 1n),
    snapshot = app.addElement(
      board([a, target, vertex]),
      vertex,
      obstacle('vertex'),
    );
  for (const ruleset of app.GENERIC_RULESETS) {
    const result = evaluated(snapshot, target, ruleset);
    expect(result.los.status).toBe(
      ruleset === app.ANY_CONTACT ? 'blocked' : 'clear',
    );
    const fact = result.los.evidence.find(
      (e) => e.location.kind === 'cell' && e.location.elementId === 'vertex',
    );
    expect(fact?.contact).toMatchObject({
      kind: 'isolated-vertex',
      entry: rational(1n, 3n),
      exit: rational(1n, 3n),
    });
    const event = result.context.geometry.events.find(
      (e) => e.t.numerator === 1n && e.t.denominator === 3n,
    );
    expect(event?.edgePoints).toHaveLength(3);
  }
});
it('P9 ignores endpoint obstacles and all intersected edge features explicitly, including boundary edges', () => {
  for (const [target, direction] of [
    [b, 0],
    [axial(2n, -1n), 0],
  ] as const) {
    let snapshot = app.addElement(board([a, target]), a, obstacle('origin'));
    snapshot = app.addElement(snapshot, target, obstacle('target'));
    snapshot = app.addEdgeFeature(snapshot, localEdge(a, direction), {
      id: 'edge1',
      kind: 'wall',
      properties: { height: 5 },
    });
    for (const ruleset of app.GENERIC_RULESETS) {
      const result = evaluated(snapshot, target, ruleset);
      expect(result.los.status).toBe('clear');
      expect(
        result.los.evidence.filter(
          (e) => e.reason.code === 'generic.endpoint-ignored',
        ),
      ).toHaveLength(2);
      expect(
        result.los.evidence.find(
          (e) => e.location.kind === 'edge' && e.location.featureId === 'edge1',
        ),
      ).toMatchObject({
        effect: 'ignored',
        reason: { code: 'generic.edge-feature-ignored' },
      });
    }
  }
  const target = axial(2n, -1n),
    edge = localEdge(axial(1n, -1n), 1);
  const snapshot = app.addEdgeFeature(board([a, target, m]), edge, {
    id: 'overlap-feature',
    kind: 'wall',
    properties: {},
  });
  const result = evaluated(snapshot, target, app.ANY_CONTACT);
  expect(
    result.los.evidence.find((e) => e.location.kind === 'edge'),
  ).toMatchObject({ contact: { kind: 'overlap' }, effect: 'ignored' });
});
it('P9 self-visibility is clear at distance zero with radius zero or unlimited', () => {
  const snapshot = app.addElement(board([a]), a, obstacle('self'));
  for (const ruleset of app.GENERIC_RULESETS)
    for (const range of [
      { kind: 'radius', radius: 0n },
      { kind: 'unlimited' },
    ] as const) {
      const result = evaluated(snapshot, a, ruleset, range);
      expect(result.context.distance).toBe(0n);
      expect(result.context.geometry.degenerate).toBe(true);
      expect(result.range.status).toBe('in-range');
      expect(result.los.status).toBe('clear');
      expect(result.visibility).toEqual({
        status: 'applicable',
        visible: true,
      });
    }
});
it('range and LOS remain independently inspectable at inclusive boundaries', () => {
  const blocked = app.addElement(board(), m, obstacle('blocker'));
  for (const snapshot of [board(), blocked])
    for (const radius of [1n, 2n]) {
      const result = evaluated(snapshot, b, app.INTERIOR_ONLY, {
        kind: 'radius',
        radius,
      });
      expect(result.range.status).toBe(
        radius === 1n ? 'out-of-range' : 'in-range',
      );
      expect(result.los.status).toBe(
        snapshot === blocked ? 'blocked' : 'clear',
      );
      expect(result.visibility).toEqual({
        status: 'applicable',
        visible: radius === 2n && snapshot !== blocked,
      });
    }
  expect(
    evaluated(board([a, m]), m, app.INTERIOR_ONLY, {
      kind: 'radius',
      radius: 0n,
    }).range.status,
  ).toBe('out-of-range');
});
// Deliberately test-only: these policies are not included in GENERIC_RULESETS.
function absentPolicy(
  status: 'blocked' | 'invalid-under-ruleset',
): app.Ruleset {
  return {
    ...app.INTERIOR_ONLY,
    id: `test.absence-${status}`,
    evaluateLineOfSight: (context) => ({
      status,
      explanations: [app.message('test.absence-policy')],
      evidence: context.cells
        .filter((c) => c.membership === 'absent')
        .map((c) =>
          app.cellEvidence(
            c.contact,
            true,
            status === 'blocked' ? 'blocking' : 'invalidating',
            'test.absent-cell',
          ),
        ),
    }),
  };
}
it('test-only rulesets can block or invalidate absent cells independently of range', () => {
  for (const status of ['blocked', 'invalid-under-ruleset'] as const)
    for (const range of [
      { kind: 'unlimited' },
      { kind: 'radius', radius: 1n },
    ] as const) {
      const ruleset = absentPolicy(status),
        result = evaluated(board([a, b]), b, ruleset, range);
      expect(result.los.status).toBe(status);
      expect(result.range.status).toBe(
        range.kind === 'unlimited' ? 'in-range' : 'out-of-range',
      );
      expect(result.visibility).toEqual(
        status === 'blocked'
          ? { status: 'applicable', visible: false }
          : { status: 'not-applicable' },
      );
      expect(result.los.evidence).toHaveLength(1);
      expect(result.los.evidence[0]).toMatchObject({
        location: { kind: 'cell', coordinate: m, absent: true },
        contact: { entry: rational(1n, 4n), exit: rational(3n, 4n) },
      });
      expect(result.los.evidence[0]?.location).not.toHaveProperty('elementId');
      expect(result.los.evidence[0]?.location).not.toHaveProperty('featureId');
    }
  expect(app.GENERIC_RULESETS.map((r) => r.id)).toEqual([
    'generic.interior-only',
    'generic.interior-and-edge',
    'generic.any-contact',
  ]);
});
it('rulesets receive full immutable board state, ordered stacks, geometry, events and features', () => {
  const remote = axial(99n, -99n),
    edge = localEdge(a, 0);
  let snapshot = app.addElement(board([a, m, b, remote]), m, {
    id: 'T',
    kind: 'transparent',
    properties: { nested: [1] },
  });
  snapshot = app.addEdgeFeature(snapshot, edge, {
    id: 'F',
    kind: 'wall',
    properties: {},
  });
  const evaluateRange = vi.fn(app.inclusiveRange),
    evaluateLineOfSight = vi.fn(
      (context: app.RulesetContext): app.LosDecision => {
        expect(context.board.hasCell(remote)).toBe(true);
        expect(
          context.cells.find((c) => c.contact.cell.q === 1n)?.elements[0]?.id,
        ).toBe('T');
        expect(
          context.edges.some((e) => e.features.some((f) => f.id === 'F')),
        ).toBe(true);
        expect(context.geometry.events).toHaveLength(4);
        expect(context.distance).toBe(2n);
        expect(context.range).toEqual({ kind: 'radius', radius: 1n });
        expect(Object.isFrozen(context)).toBe(true);
        expect(Reflect.set(context, 'distance', 0n)).toBe(false);
        expect(Reflect.set(context.board.cells[0] ?? {}, 'elements', [])).toBe(
          false,
        );
        return {
          status: 'clear',
          evidence: [],
          explanations: [app.message('test.clear')],
        };
      },
    );
  const ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.context',
    evaluateRange,
    evaluateLineOfSight,
  };
  expect(
    evaluated(snapshot, b, ruleset, { kind: 'radius', radius: 1n }).range
      .status,
  ).toBe('out-of-range');
  expect(evaluateRange).toHaveBeenCalledOnce();
  expect(evaluateLineOfSight).toHaveBeenCalledOnce();
});
it('query validation distinguishes malformed, unsupported and ruleset-owned payload errors', () => {
  const query = {
    board: board(),
    origin: a,
    target: b,
    range: { kind: 'unlimited' },
    ruleset: reference(app.INTERIOR_ONLY),
  };
  for (const bad of [
    { ...query, board: {} },
    { ...query, origin: axial(8n, 0n) },
    { ...query, target: axial(8n, 0n) },
    { ...query, origin: { q: 0, r: 0n } },
    { ...query, range: { kind: 'radius', radius: -1n } },
    { ...query, range: { kind: 'radius', radius: 1.5 } },
    { ...query, range: { kind: 'unlimited', radius: 0n } },
    { ...query, range: Infinity },
    { ...query, ruleset: { ...query.ruleset, configuration: [] } },
    { ...query, maxCandidates: -1n },
    { ...query, maxCandidates: 2 },
    { ...query, ruleset: { ...query.ruleset, version: 1 } },
    { ...query, unexpected: true },
  ]) {
    const result = app.evaluateVisibility(bad);
    expect(result.status).toBe('invalid-query-input');
    expect(result).not.toHaveProperty('visibility');
  }
  for (const ruleset of [
    { ...query.ruleset, id: 'unknown' },
    { ...query.ruleset, version: '99' },
    { ...query.ruleset, configuration: { option: true } },
  ])
    expect(app.evaluateVisibility({ ...query, ruleset }).status).toBe(
      'unsupported-ruleset-or-configuration',
    );
  const invalidPayload = app.addElement(board(), m, {
    id: 'bad',
    kind: 'obstacle',
    properties: { blocks: false },
  });
  expect(
    app.evaluateVisibility({ ...query, board: invalidPayload }),
  ).toMatchObject({
    status: 'invalid-query-input',
    explanations: [
      {
        code: 'generic.invalid-obstacle-payload',
        arguments: { elementId: 'bad' },
      },
    ],
  });
  expect(traceSightline(a, axial(8n, 0n)).status).toBe('complete');
});
it('geometry resource failures never become visibility verdicts or invoke decision hooks', () => {
  const target = axial(0n, 10n ** 100n),
    evaluateRange = vi.fn(app.inclusiveRange),
    evaluateLineOfSight = vi.fn(app.INTERIOR_ONLY.evaluateLineOfSight),
    ruleset = {
      ...app.INTERIOR_ONLY,
      id: 'test.resource',
      evaluateRange,
      evaluateLineOfSight,
    };
  const result = app.evaluateVisibility(
    {
      board: board([a, target]),
      origin: a,
      target,
      range: { kind: 'radius', radius: 0n },
      ruleset: reference(ruleset),
      maxCandidates: 1n,
    },
    [ruleset],
  );
  expect(result).toEqual({
    status: 'evaluation-failure',
    cause: 'resource-limit',
    candidateCount: ((10n ** 100n) ** 2n + 4n * 10n ** 100n + 2n) / 2n,
    maxCandidates: 1n,
  });
  expect(result).not.toHaveProperty('visibility');
  expect(result).not.toHaveProperty('range');
  expect(result).not.toHaveProperty('los');
  expect(evaluateRange).not.toHaveBeenCalled();
  expect(evaluateLineOfSight).not.toHaveBeenCalled();
  expect(
    app.evaluateVisibility({
      board: board([a]),
      origin: a,
      target: a,
      range: { kind: 'unlimited' },
      ruleset: reference(app.INTERIOR_ONLY),
      maxCandidates: 0n,
    }),
  ).toMatchObject({
    status: 'evaluation-failure',
    cause: 'resource-limit',
    candidateCount: 1n,
  });
});
it('unexpected ruleset or geometry exceptions produce internal failures without partial verdicts', () => {
  const query = {
    board: board(),
    origin: a,
    target: b,
    range: { kind: 'unlimited' },
    ruleset: reference(app.INTERIOR_ONLY),
  };
  for (const hook of [
    'validateConfiguration',
    'validateBoard',
    'evaluateRange',
    'evaluateLineOfSight',
  ] as const) {
    const ruleset = {
      ...app.INTERIOR_ONLY,
      [hook]: () => {
        throw new Error('injected failure');
      },
    };
    const result = app.evaluateVisibility(query, [ruleset]);
    expect(result).toMatchObject({
      status: 'evaluation-failure',
      cause: 'internal-error',
    });
    expect(result).not.toHaveProperty('visibility');
    expect(result).not.toHaveProperty('los');
    expect(result).not.toHaveProperty('range');
  }
  const spy = vi.spyOn(geometry, 'traceSightline').mockImplementation(() => {
    throw new Error('simulated allocation failure');
  });
  try {
    expect(app.evaluateVisibility(query)).toMatchObject({
      status: 'evaluation-failure',
      cause: 'internal-error',
    });
  } finally {
    spy.mockRestore();
  }
});
it('malformed decision evidence is an internal failure, not a fabricated blocker', () => {
  const ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.bad-evidence',
    evaluateLineOfSight: (): app.LosDecision => ({
      status: 'blocked',
      evidence: [],
      explanations: [],
    }),
  };
  expect(
    app.evaluateVisibility(
      {
        board: board(),
        origin: a,
        target: b,
        range: { kind: 'unlimited' },
        ruleset: reference(ruleset),
      },
      [ruleset],
    ),
  ).toMatchObject({ status: 'evaluation-failure', cause: 'internal-error' });
});
it('decision and message payload aliases cannot change a returned result', () => {
  const args = { nested: { value: 1 } },
    messages = [{ code: 'test.clear', arguments: args }],
    facts: app.Evidence[] = [];
  const ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.aliases',
    evaluateLineOfSight: (): app.LosDecision => ({
      status: 'clear',
      evidence: facts,
      explanations: messages,
    }),
  };
  const result = evaluated(board(), b, ruleset);
  args.nested.value = 5;
  messages.pop();
  expect(result.los.explanations).toEqual([
    { code: 'test.clear', arguments: { nested: { value: 1 } } },
  ]);
  expect(Object.isFrozen(result.los.evidence)).toBe(true);
  expect(Object.isFrozen(result.visibility)).toBe(true);
});
it('a static adapter can block on edge features with exact feature/contact evidence', () => {
  const edge = localEdge(a, 0),
    snapshot = app.addEdgeFeature(board(), edge, {
      id: 'wall',
      kind: 'wall',
      properties: {},
    });
  const ruleset: app.Ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.edge-blocking',
    evaluateLineOfSight: (context) => ({
      status: 'blocked',
      explanations: [app.message('test.wall')],
      evidence: context.edges.flatMap((e) =>
        e.features.map((f) =>
          app.edgeEvidence(e.contact, 'blocking', 'test.wall', f.id),
        ),
      ),
    }),
  };
  const result = evaluated(snapshot, b, ruleset);
  expect(result.los.evidence).toHaveLength(1);
  expect(result.los.evidence[0]).toMatchObject({
    effect: 'blocking',
    location: { kind: 'edge', edge, featureId: 'wall' },
    contact: {
      entry: rational(1n, 4n),
      exit: rational(1n, 4n),
      classification: 'proper-crossing',
    },
  });
  expect(result.visibility).toEqual({ status: 'applicable', visible: false });
  expect(result.evidenceEvents).toHaveLength(1);
});
it('static adapters can reject semantically malformed configuration before tracing', () => {
  const ruleset: app.Ruleset = {
    ...app.INTERIOR_ONLY,
    id: 'test.configuration',
    validateConfiguration: () => ({
      status: 'invalid',
      explanations: [app.message('test.invalid-configuration')],
    }),
  };
  const spy = vi.spyOn(geometry, 'traceSightline');
  try {
    const result = app.evaluateVisibility(
      {
        board: board(),
        origin: a,
        target: b,
        range: { kind: 'unlimited' },
        ruleset: reference(ruleset),
      },
      [ruleset],
    );
    expect(result).toEqual({
      status: 'invalid-query-input',
      explanations: [app.message('test.invalid-configuration')],
    });
    expect(spy).not.toHaveBeenCalled();
  } finally {
    spy.mockRestore();
  }
});
it('inconsistent absence, element and contact references fail rather than inventing evidence', () => {
  for (const mode of ['absent', 'element', 'contact'] as const) {
    const ruleset: app.Ruleset = {
      ...app.INTERIOR_ONLY,
      id: `test.invalid-${mode}`,
      evaluateLineOfSight: (context) => {
        const contact = context.geometry.cells.find((c) => c.cell.q === 1n);
        if (!contact) throw new Error('Missing contact');
        return {
          status: 'blocked',
          explanations: [],
          evidence: [
            app.cellEvidence(
              mode === 'contact' ? { ...contact } : contact,
              mode === 'absent',
              'blocking',
              'test.invalid-reference',
              mode === 'element' ? 'invented' : undefined,
            ),
          ],
        };
      },
    };
    expect(
      app.evaluateVisibility(
        {
          board: board(),
          origin: a,
          target: b,
          range: { kind: 'unlimited' },
          ruleset: reference(ruleset),
        },
        [ruleset],
      ),
    ).toMatchObject({ status: 'evaluation-failure', cause: 'internal-error' });
  }
});

it('unexpected snapshot validation failures remain evaluation failures rather than malformed-input verdicts', () => {
  const spy = vi.spyOn(contracts, 'rulesetReference').mockImplementation(() => {
    throw new Error(
      'simulated allocation failure during configuration snapshot',
    );
  });
  try {
    const result = app.evaluateVisibility({
      board: board(),
      origin: a,
      target: b,
      range: { kind: 'unlimited' },
      ruleset: reference(app.INTERIOR_ONLY),
    });
    expect(result).toMatchObject({
      status: 'evaluation-failure',
      cause: 'internal-error',
    });
    expect(result).not.toHaveProperty('visibility');
  } finally {
    spy.mockRestore();
  }
});
