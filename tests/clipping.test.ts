import { it, expect } from 'vitest';
import fc from 'fast-check';
import * as g from '../src/index.js';
const a = g.axial(0n, 0n);
import { fixtureRows, fixtureTargets } from './support/fixtures.js';
for (const [i, rows] of fixtureRows.entries())
  it(`G${i + 1} fixed clipping intervals, classes and sides`, () => {
    const target = fixtureTargets[i];
    if (!target) throw new Error('Missing fixture');
    const line = g.sightline(a, target);
    for (const [q, r, kind, entry, exit, side] of rows) {
      const hit = g.clipCell(line, g.axial(q, r));
      expect(hit.kind).toBe(kind);
      if (hit.kind === 'none') throw new Error('Expected hit');
      expect([
        g.rationalKey(hit.entry),
        g.rationalKey(hit.exit),
        hit.side,
      ]).toEqual([entry, exit, side]);
    }
    expect(g.clipCell(line, g.axial(30n, 30n)).kind).toBe('none');
  });
it('G5 is a distinct point record; no-hit has no interval', () => {
  const line = g.sightline(a, a),
    hit = g.clipCell(line, a);
  expect(hit).toMatchObject({
    kind: 'degenerate-point',
    entry: g.ZERO,
    exit: g.ONE,
    side: 0,
    entryBoundary: { location: 'strict-interior', edges: [], vertices: [] },
  });
  expect(g.clipCell(line, g.axial(1n, 0n))).toEqual({
    cell: g.axial(1n, 0n),
    kind: 'none',
    side: 0,
  });
  expect(
    g.clipCell(g.sightline(a, g.axial(2n, 0n)), g.axial(0n, 1n)).kind,
  ).toBe('none');
});
it('keeps exact boundary metadata at vertices and along overlaps', () => {
  const vertex = g.clipCell(g.sightline(a, g.axial(4n, 1n)), g.axial(1n, 1n));
  expect(vertex).toMatchObject({
    entryBoundary: { edges: [4, 5], vertices: [{ x: 3n, y: 1n }] },
  });
  const overlap = g.clipCell(g.sightline(a, g.axial(2n, -1n)), g.axial(1n, 0n));
  expect(overlap).toMatchObject({
    supportingEdges: [4],
    entryBoundary: { location: 'vertex' },
    exitBoundary: { location: 'vertex' },
  });
});
it('clipping is exact, reversible and translation invariant', () => {
  const coord = fc
    .tuple(fc.bigInt({ min: -5n, max: 5n }), fc.bigInt({ min: -5n, max: 5n }))
    .map(([q, r]) => g.axial(q, r));
  fc.assert(
    fc.property(coord, coord, coord, (origin, target, cell) => {
      const line = g.sightline(origin, target),
        hit = g.clipCell(line, cell),
        rev = g.clipCell(g.sightline(target, origin), cell);
      expect(hit.kind).toBe(rev.kind);
      if (hit.kind === 'none' || rev.kind === 'none') return;
      expect(rev.entry).toEqual(g.subtractRational(g.ONE, hit.exit));
      expect(rev.exit).toEqual(g.subtractRational(g.ONE, hit.entry));
      expect(rev.side + hit.side).toBe(0);
      expect(
        g.compareRational(hit.entry, hit.exit) <= 0 &&
          g.inUnitInterval(hit.entry) &&
          g.inUnitInterval(hit.exit),
      ).toBe(true);
      for (const d of g.DIRECTIONS) {
        expect(g.constraintSlack(line, cell, hit.entry, d) >= 0n).toBe(true);
        expect(g.constraintSlack(line, cell, hit.exit, d) >= 0n).toBe(true);
        if (hit.kind === 'interior')
          expect(
            g.constraintSlack(line, cell, g.midpoint(hit.entry, hit.exit), d) >
              0n,
          ).toBe(true);
      }
      const delta = g.axial(10n ** 30n, -(10n ** 30n)),
        shift = g.clipCell(
          g.sightline(g.translate(origin, delta), g.translate(target, delta)),
          g.translate(cell, delta),
        );
      expect(shift).toMatchObject({
        kind: hit.kind,
        entry: hit.entry,
        exit: hit.exit,
        side: hit.side,
      });
    }),
    { seed: 1201, numRuns: 1000 },
  );
});
