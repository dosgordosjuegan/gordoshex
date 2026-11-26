import { it, expect } from 'vitest';
import fc from 'fast-check';
import * as g from '../src/index.js';
import { fixtureRows, fixtureTargets } from './support/fixtures.js';
import { oracleCells, oracleEdges, oracleEvents } from './support/oracle.js';
const zero = g.axial(0n, 0n);
function trace(a: g.Axial, b: g.Axial): g.CompleteGeometry {
  const result = g.traceSightline(a, b, 100000n);
  if (result.status !== 'complete') throw new Error('Test budget insufficient');
  return result;
}
const sortCells = (cells: readonly g.CellHit[]) =>
  [...cells].sort((a, b) =>
    g.coordinateKey(a.cell).localeCompare(g.coordinateKey(b.cell)),
  );
const sortEdges = (edges: readonly g.EdgeHit[]) =>
  [...edges].sort((a, b) => a.edge.id.key.localeCompare(b.edge.id.key));
function compareOracle(a: g.Axial, b: g.Axial): void {
  const expected = oracleCells(a, b),
    edges = oracleEdges(a, b, expected),
    result = trace(a, b);
  const candidates = new Set(
    [...g.candidateCoordinates(g.candidateBounds(result.line))].map(
      g.coordinateKey,
    ),
  );
  for (const cell of expected)
    expect(candidates.has(g.coordinateKey(cell.cell))).toBe(true);
  expect(
    sortCells(result.cells),
    `${g.coordinateKey(a)} -> ${g.coordinateKey(b)}`,
  ).toEqual(sortCells(expected));
  expect(sortEdges(result.edges)).toEqual(edges);
  expect(result.events).toEqual(oracleEvents(expected, edges));
}
it('G1-G4 have exactly the approved complete cell/edge/event facts', () => {
  const expectedEvents = [
    ['0/1', '1/4', '3/4', '1/1'],
    ['0/1', '1/3', '2/3', '1/1'],
    ['0/1', '1/9', '1/3', '1/2', '2/3', '8/9', '1/1'],
    ['0/1', '1/7', '2/5', '1/2', '3/5', '6/7', '1/1'],
  ];
  for (const [i, b] of fixtureTargets.entries()) {
    const result = trace(zero, b),
      rows = fixtureRows[i];
    if (!rows) throw new Error('Missing fixture');
    const actual = result.cells.map((c) => [
      c.cell.q,
      c.cell.r,
      c.kind,
      g.rationalKey(c.entry),
      g.rationalKey(c.exit),
      c.side,
    ]);
    const order = (a: readonly unknown[], b: readonly unknown[]) =>
      String(a).localeCompare(String(b));
    expect(actual.sort(order)).toEqual([...rows].sort(order));
    expect(result.edges.length).toBe([2, 5, 9, 5][i]);
    expect(result.events.map((e) => g.rationalKey(e.t))).toEqual(
      expectedEvents[i],
    );
    compareOracle(zero, b);
  }
  const g1 = trace(zero, g.axial(2n, 0n));
  expect(g1.edges[0]).toMatchObject({
    kind: 'point',
    classification: 'proper-crossing',
    entry: g.rational(1n, 4n),
    uEntry: g.rational(1n, 2n),
    sideA: 1,
    sideB: -1,
  });
  const g2 = trace(zero, g.axial(2n, -1n)),
    overlap = g2.edges.find((e) => e.kind === 'overlap');
  expect(overlap).toMatchObject({
    edge: {
      id: { key: '1,-1|1,0' },
      u: { x: 1n, y: -1n },
      v: { x: 2n, y: -2n },
    },
    entry: g.rational(1n, 3n),
    exit: g.rational(2n, 3n),
    uEntry: g.ZERO,
    uExit: g.ONE,
    sideA: 0,
    sideB: 0,
  });
  expect(g2.edges.filter((e) => e.classification === 'touch')).toHaveLength(4);
  const g3 = trace(zero, g.axial(4n, 1n)),
    event = g3.events.find((e) => g.equalRational(e.t, g.rational(1n, 3n)));
  expect(event).toMatchObject({
    enteringCells: ['1,1', '2,0'],
    exitingCells: ['1,0', '1,1'],
    isolatedVertexCells: ['1,1'],
    edgePoints: ['1,0|1,1', '1,0|2,0', '1,1|2,0'],
  });
  const finiteTouch = g3.edges.find((e) => e.edge.id.key === '1,0|2,0');
  expect(finiteTouch).toMatchObject({
    classification: 'touch',
    uEntry: g.ONE,
    entryIncidence: { edgeEndpoint: 'v', vertex: { x: 3n, y: 1n } },
  });
  expect((finiteTouch?.sideA ?? 0) * (finiteTouch?.sideB ?? 0)).toBe(-1);
  expect(
    g3.edges.filter((e) => e.classification === 'proper-crossing'),
  ).toHaveLength(3);
  expect(g3.edges.filter((e) => e.classification === 'touch')).toHaveLength(6);
});
it('G5 has one point and no edges/events, even at huge translated coordinates', () => {
  for (const a of [zero, g.axial(10n ** 80n, -(10n ** 90n))]) {
    const result = trace(a, a);
    expect(result.degenerate).toBe(true);
    expect(result.line.degenerate).toBe(true);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]?.kind).toBe('degenerate-point');
    expect(result.edges).toEqual([]);
    expect(result.events).toEqual([]);
    compareOracle(a, a);
  }
});
it('G6 canonical shared edges use numeric identities and exact endpoint sets', () => {
  for (const [a, d, b, op, key, points] of [
    [
      zero,
      0,
      g.axial(1n, 0n),
      3,
      '0,0|1,0',
      [g.point(1n, -1n), g.point(1n, 1n)],
    ],
    [
      zero,
      1,
      g.axial(0n, 1n),
      4,
      '0,0|0,1',
      [g.point(0n, 2n), g.point(1n, 1n)],
    ],
    [
      g.axial(1n, 0n),
      4,
      g.axial(1n, -1n),
      1,
      '1,-1|1,0',
      [g.point(1n, -1n), g.point(2n, -2n)],
    ],
  ] as const) {
    const id = g.localEdge(a, d);
    expect(id.key).toBe(key);
    expect(id).toEqual(g.localEdge(b, op));
    expect(g.edgeId(b, a)).toEqual(id);
    expect([g.edgeGeometry(id).u, g.edgeGeometry(id).v]).toEqual(points);
  }
  expect(g.edgeId(g.axial(10n, 0n), g.axial(9n, 0n)).key).toBe('9,0|10,0');
  expect(g.edgeId(g.axial(-1n, 0n), zero).key).toBe('-1,0|0,0');
  expect(() => g.edgeId(zero, zero)).toThrow();
  expect(() => g.edgeId(zero, g.axial(2n, 0n))).toThrow();
  for (const d of g.DIRECTIONS) {
    const n = g.neighbor(zero, d);
    const opposite = g.DIRECTIONS[(d + 3) % 6];
    if (opposite === undefined) throw new Error('Direction');
    expect(g.localEdge(zero, d)).toEqual(g.localEdge(n, opposite));
  }
});
it('persistent independent exact oracle matches all 625 ordered endpoint pairs in [-2,2]^2', () => {
  const coords: g.Axial[] = [];
  for (let q = -2n; q <= 2n; q++)
    for (let r = -2n; r <= 2n; r++) coords.push(g.axial(q, r));
  for (const a of coords) for (const b of coords) compareOracle(a, b);
});
it('independent oracle also covers signed, X/Y-constant, boundary and huge translated cases', () => {
  for (const b of [
    ...fixtureTargets,
    g.axial(-2n, 4n),
    g.axial(0n, -3n),
    g.axial(0n, 0n),
  ])
    for (const delta of [
      g.axial(-5n, -4n),
      g.axial(9007199254740993n, -9007199254740993n),
    ]) {
      compareOracle(g.translate(zero, delta), g.translate(b, delta));
      compareOracle(g.translate(b, delta), g.translate(zero, delta));
      compareOracle(
        g.rotate(g.translate(zero, delta)),
        g.rotate(g.translate(b, delta)),
      );
      compareOracle(
        g.reflect(g.translate(zero, delta)),
        g.reflect(g.translate(b, delta)),
      );
    }
});
const coord = fc
  .tuple(fc.bigInt({ min: -5n, max: 5n }), fc.bigInt({ min: -5n, max: 5n }))
  .map(([q, r]) => g.axial(q, r));
const cellFacts = (cells: readonly g.CellHit[]) =>
  cells
    .map((c) => ({
      key: g.coordinateKey(c.cell),
      kind: c.kind,
      entry: c.entry,
      exit: c.exit,
      side: c.side,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
it('complete facts obey translations, all six rotations and reflection', () => {
  fc.assert(
    fc.property(coord, coord, fc.bigInt(), fc.bigInt(), (a, b, q, r) => {
      const original = trace(a, b),
        delta = g.axial(q, r);
      const transforms: [(c: g.Axial) => g.Axial, number][] = [
        [(c) => g.translate(c, delta), 1],
        [g.reflect, -1],
      ];
      let rotation = (c: g.Axial) => c;
      for (let i = 0; i < 6; i++) {
        const previous = rotation;
        rotation = (c) => g.rotate(previous(c));
        transforms.push([rotation, 1]);
      }
      for (const [transform, sideSign] of transforms) {
        const changed = trace(transform(a), transform(b));
        const mapped = original.cells.map((c) => ({
          ...c,
          cell: transform(c.cell),
          side: g.sign(BigInt(c.side) * BigInt(sideSign)),
        }));
        expect(cellFacts(changed.cells)).toEqual(cellFacts(mapped));
        expect(g.distance(transform(a), transform(b))).toBe(g.distance(a, b));
        const edgeFacts = (edges: readonly g.EdgeHit[]) =>
          edges
            .map((e) => ({
              key: e.edge.id.key,
              kind: e.kind,
              classification: e.classification,
              entry: e.entry,
              exit: e.exit,
            }))
            .sort((a, b) => a.key.localeCompare(b.key));
        const expectedEdges = original.edges.map((e) => ({
          ...e,
          edge: {
            ...e.edge,
            id: g.edgeId(
              transform(e.edge.id.first),
              transform(e.edge.id.second),
            ),
          },
        }));
        expect(edgeFacts(changed.edges)).toEqual(edgeFacts(expectedEdges));
        expect(changed.events.map((e) => e.t)).toEqual(
          original.events.map((e) => e.t),
        );
        compareOracle(transform(a), transform(b));
      }
      let restored = a;
      for (let i = 0; i < 6; i++) restored = g.rotate(restored);
      expect(restored).toEqual(a);
      expect(g.reflect(g.reflect(a))).toEqual(a);
    }),
    { seed: 1401, numRuns: 100 },
  );
});
it('reversal preserves every incidence and reverses exact intervals and events', () => {
  fc.assert(
    fc.property(coord, coord, (a, b) => {
      const forward = trace(a, b),
        reverse = trace(b, a);
      expect(cellFacts(reverse.cells)).toEqual(
        cellFacts(
          forward.cells.map((c) => ({
            ...c,
            entry: g.subtractRational(g.ONE, c.exit),
            exit: g.subtractRational(g.ONE, c.entry),
            side: c.side === 0 ? 0 : c.side === 1 ? -1 : 1,
          })),
        ),
      );
      const byId = new Map(reverse.edges.map((e) => [e.edge.id.key, e]));
      for (const e of forward.edges) {
        expect(byId.get(e.edge.id.key)).toMatchObject({
          kind: e.kind,
          classification: e.classification,
          entry: g.subtractRational(g.ONE, e.exit),
          exit: g.subtractRational(g.ONE, e.entry),
          uEntry: e.uExit,
          uExit: e.uEntry,
          sideA: e.sideB,
          sideB: e.sideA,
        });
      }
      expect(reverse.events).toEqual(
        [...forward.events].reverse().map((e) => ({
          ...e,
          t: g.subtractRational(g.ONE, e.t),
          enteringCells: e.exitingCells,
          exitingCells: e.enteringCells,
          overlapStarts: e.overlapEnds,
          overlapEnds: e.overlapStarts,
        })),
      );
    }),
    { seed: 1402, numRuns: 250 },
  );
});
it('coverage, finite edge consistency and simultaneous memberships hold on every open span', () => {
  fc.assert(
    fc.property(coord, coord, (a, b) => {
      const result = trace(a, b);
      if (result.line.degenerate) return;
      expect(new Set(result.edges.map((e) => e.edge.id.key)).size).toBe(
        result.edges.length,
      );
      expect(new Set(result.events.map((e) => g.rationalKey(e.t))).size).toBe(
        result.events.length,
      );
      for (const edge of result.edges)
        for (const cell of edge.cells) {
          const hit = result.cells.find((c) =>
            g.equalCoordinates(c.cell, cell),
          );
          expect(hit).toBeDefined();
          if (!hit) throw new Error('Missing incident cell');
          expect(
            g.compareRational(hit.entry, edge.entry) <= 0 &&
              g.compareRational(hit.exit, edge.exit) >= 0,
          ).toBe(true);
          if (edge.classification === 'proper-crossing')
            expect(
              g.compareRational(edge.uEntry, g.ZERO) > 0 &&
                g.compareRational(edge.uEntry, g.ONE) < 0,
            ).toBe(true);
        }
      for (const [i, event] of result.events.entries()) {
        const members = result.cells.filter(
          (c) =>
            g.compareRational(c.entry, event.t) <= 0 &&
            g.compareRational(c.exit, event.t) >= 0,
        );
        expect(members.length).toBeGreaterThan(0);
        if (members.length === 3) {
          const touching = result.edges.filter(
            (e) =>
              g.compareRational(e.entry, event.t) <= 0 &&
              g.compareRational(e.exit, event.t) >= 0,
          );
          expect(touching).toHaveLength(3);
        }
        const next = result.events[i + 1];
        if (!next) continue;
        const mid = g.midpoint(event.t, next.t),
          active = result.cells.filter(
            (c) =>
              g.compareRational(c.entry, mid) < 0 &&
              g.compareRational(c.exit, mid) > 0,
          );
        expect(active.length).toBeGreaterThan(0);
        if (active.length === 1) expect(active[0]?.kind).toBe('interior');
        else {
          expect(active).toHaveLength(2);
          expect(active.every((c) => c.kind === 'edge-overlap')).toBe(true);
        }
      }
    }),
    { seed: 1403, numRuns: 250 },
  );
});
it('event grouping is invariant under arbitrary iteration order and normalized parameter allocations', () => {
  fc.assert(
    fc.property(coord, coord, fc.integer(), (a, b, seed) => {
      const result = trace(a, b);
      const cells = fc.sample(
        fc.shuffledSubarray([...result.cells], {
          minLength: result.cells.length,
          maxLength: result.cells.length,
        }),
        { seed, numRuns: 1 },
      )[0];
      const edges = fc.sample(
        fc.shuffledSubarray([...result.edges], {
          minLength: result.edges.length,
          maxLength: result.edges.length,
        }),
        { seed: seed ^ 17, numRuns: 1 },
      )[0];
      if (!cells || !edges) throw new Error('Shuffle failed');
      expect(g.groupEvents(cells, edges, result.line.degenerate)).toEqual(
        result.events,
      );
    }),
    { seed: 1404, numRuns: 150 },
  );
  const result = trace(zero, g.axial(4n, 1n));
  const cells = result.cells.map((c) => ({
    ...c,
    entry: {
      numerator: c.entry.numerator * 2n,
      denominator: c.entry.denominator * 2n,
    },
  }));
  expect(g.groupEvents(cells, result.edges)).toEqual(result.events);
});
it('distance matches an independent bounded breadth-first lattice search', () => {
  const seen = new Map<string, bigint>([['0,0', 0n]]),
    queue = [zero];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    if (!c) throw new Error('Queue');
    const d = seen.get(g.coordinateKey(c));
    if (d === undefined) throw new Error('Distance');
    if (d === 5n) continue;
    for (const n of g.neighbors(c))
      if (!seen.has(g.coordinateKey(n))) {
        seen.set(g.coordinateKey(n), d + 1n);
        queue.push(n);
      }
  }
  for (const c of queue)
    expect(g.distance(zero, c)).toBe(seen.get(g.coordinateKey(c)));
});
it('public results are immutable snapshots of coordinate inputs', () => {
  const a = { q: 0n, r: 0n },
    b = { q: 2n, r: 0n },
    result = trace(a, b);
  a.q = 99n;
  b.r = 100n;
  expect(result.line.origin).toEqual(zero);
  expect(result.line.target).toEqual(g.axial(2n, 0n));
  const checkFrozen = (value: unknown): void => {
    if (typeof value !== 'object' || value === null) return;
    expect(Object.isFrozen(value)).toBe(true);
    for (const child of Object.values(value)) checkFrozen(child);
  };
  checkFrozen(result);
  const rejected = g.traceSightline(zero, g.axial(2n, 0n), 0n);
  checkFrozen(rejected);
});
it('fixed rotated G2 and reversed G4 retain the approved fractions and signs', () => {
  const rotated = trace(zero, g.axial(1n, 1n));
  for (const [cell, side] of [
    [g.axial(0n, 1n), 1],
    [g.axial(1n, 0n), -1],
  ] as const)
    expect(
      rotated.cells.find((c) => g.equalCoordinates(c.cell, cell)),
    ).toMatchObject({
      kind: 'edge-overlap',
      entry: g.rational(1n, 3n),
      exit: g.rational(2n, 3n),
      side,
    });
  const reversed = trace(g.axial(3n, 1n), zero);
  expect(
    reversed.cells.find((c) => g.equalCoordinates(c.cell, g.axial(1n, 0n))),
  ).toMatchObject({
    entry: g.rational(3n, 5n),
    exit: g.rational(6n, 7n),
    side: 1,
  });
  expect(
    reversed.cells.find((c) => g.equalCoordinates(c.cell, g.axial(1n, 1n))),
  ).toMatchObject({
    entry: g.rational(1n, 2n),
    exit: g.rational(3n, 5n),
    side: -1,
  });
  expect(g.distance(g.axial(-2n, 3n), g.axial(4n, -1n))).toBe(6n);
});
it('finite edge misses preserve side diagnostics without inventing an interval', () => {
  const line = g.sightline(zero, g.axial(2n, -1n));
  for (const id of [
    g.localEdge(g.axial(5n, 5n), 1),
    g.localEdge(g.axial(3n, -1n), 4),
    g.localEdge(g.axial(-5n, 0n), 0),
  ]) {
    const miss = g.intersectEdge(line, id);
    expect(miss.kind).toBe('none');
    expect(miss).not.toHaveProperty('entry');
    expect(miss).not.toHaveProperty('exit');
  }
  expect(
    g.intersectEdge(g.sightline(zero, zero), g.localEdge(zero, 0)).kind,
  ).toBe('none');
});
