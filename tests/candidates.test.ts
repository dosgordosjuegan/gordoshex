import { it, expect, vi } from 'vitest';
import fc from 'fast-check';
import * as g from '../src/index.js';
import * as candidates from '../src/geometry/candidates.js';
import * as clipping from '../src/geometry/clipping.js';
const origin = g.axial(0n, 0n);
/** Independent defining inequalities over a deliberately larger axial rectangle. No production bounds/division. */
function bruteCandidates(a: g.Axial, b: g.Axial): string[] {
  const x1 = 2n * a.q + a.r,
    x2 = 2n * b.q + b.r,
    y1 = 3n * a.r,
    y2 = 3n * b.r;
  const xlo = (x1 < x2 ? x1 : x2) - 1n,
    xhi = (x1 > x2 ? x1 : x2) + 1n;
  const ylo = (y1 < y2 ? y1 : y2) - 2n,
    yhi = (y1 > y2 ? y1 : y2) + 2n;
  const out: string[] = [];
  // On this bounded endpoint domain [-4,4], all possible production candidates lie in [-12,12]^2.
  for (let r = -12n; r <= 12n; r++)
    for (let q = -12n; q <= 12n; q++)
      if (
        xlo <= 2n * q + r &&
        2n * q + r <= xhi &&
        ylo <= 3n * r &&
        3n * r <= yhi
      )
        out.push(`${q},${r}`);
  return out;
}
it('closed form agrees with independent candidate enumeration for 6,561 ordered pairs', () => {
  const coords: g.Axial[] = [];
  for (let q = -4n; q <= 4n; q++)
    for (let r = -4n; r <= 4n; r++) coords.push(g.axial(q, r));
  for (const a of coords)
    for (const b of coords) {
      const line = g.sightline(a, b),
        expected = bruteCandidates(a, b),
        actual = [...g.candidateCoordinates(g.candidateBounds(line))].map(
          g.coordinateKey,
        );
      expect(
        g.candidateCount(line),
        `${g.coordinateKey(a)} -> ${g.coordinateKey(b)}`,
      ).toBe(BigInt(expected.length));
      expect(actual).toEqual(expected);
      expect(new Set(actual).size).toBe(actual.length);
    }
});
it('exact count fixtures and resource equality boundaries', () => {
  for (const [q, r, count] of [
    [2n, 0n, 3n],
    [3n, 0n, 4n],
    [2n, -1n, 6n],
    [4n, 1n, 12n],
    [3n, 1n, 10n],
    [0n, 0n, 1n],
    [0n, 2n, 7n],
  ]) {
    for (const delta of [
      origin,
      g.axial(-5n, -4n),
      g.axial(9007199254740993n, -9007199254740993n),
    ]) {
      const line = g.sightline(
          g.translate(origin, delta),
          g.translate(g.axial(q!, r!), delta),
        ),
        n = count!;
      expect(g.candidateCount(line)).toBe(n);
      expect(g.enumerateCells(line, n - 1n)).toEqual({
        status: 'resource-limit',
        candidateCount: n,
        maxCandidates: n - 1n,
      });
      expect(g.enumerateCells(line, n).status).toBe('complete');
      expect(g.enumerateCells(line, n + 1n).status).toBe('complete');
    }
  }
});
it('rejects enormous separations before candidate iteration or clipping', () => {
  const iterator = vi.spyOn(candidates, 'candidateCoordinates'),
    clip = vi.spyOn(clipping, 'clipCell');
  try {
    const t = 10n ** 100n,
      delta = g.axial(-(10n ** 200n), 10n ** 201n);
    for (const [target, count] of [
      [g.axial(t, 0n), t + 1n],
      [g.axial(0n, t), (t * t + 4n * t + 2n) / 2n],
    ] as const) {
      for (const [a, b] of [
        [origin, target],
        [target, origin],
        [g.translate(origin, delta), g.translate(target, delta)],
        [g.translate(target, delta), g.translate(origin, delta)],
      ] as const) {
        const line = g.sightline(a, b);
        expect(g.candidateCount(line)).toBe(count);
        expect(g.enumerateCells(line, 1000n)).toEqual({
          status: 'resource-limit',
          candidateCount: count,
          maxCandidates: 1000n,
        });
      }
    }
    expect(iterator).not.toHaveBeenCalled();
    expect(clip).not.toHaveBeenCalled();
    expect(() => g.enumerateCells(g.sightline(origin, origin), -1n)).toThrow();
    // Exercise the JS boundary without an unsafe cast.
    for (const value of [1, 1.5, '3', NaN, null])
      expect(() =>
        Reflect.apply(g.enumerateCells, undefined, [
          g.sightline(origin, origin),
          value,
        ]),
      ).toThrow();
    expect(iterator).not.toHaveBeenCalled();
    expect(clip).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
  }
});
it('handles signed/empty integer rows and rotation-dependent budgets', () => {
  expect(
    g.candidateRow({ rLow: 0n, rHigh: 0n, xLow: -2n, xHigh: -2n }, 1n),
  ).toEqual({ low: -1n, high: -2n });
  expect([
    ...g.candidateCoordinates({ rLow: 1n, rHigh: 0n, xLow: 0n, xHigh: 1n }),
  ]).toEqual([]);
  expect(
    g.enumerateCells(g.sightline(origin, g.axial(2n, 0n)), 3n).status,
  ).toBe('complete');
  expect(
    g.enumerateCells(g.sightline(origin, g.axial(0n, 2n)), 3n).status,
  ).toBe('resource-limit');
});
it('count is translation/reversal invariant and respects N-1/N/N+1', () => {
  const coord = fc
    .tuple(fc.bigInt({ min: -6n, max: 6n }), fc.bigInt({ min: -6n, max: 6n }))
    .map(([q, r]) => g.axial(q, r));
  fc.assert(
    fc.property(coord, coord, fc.bigInt(), fc.bigInt(), (a, b, q, r) => {
      const line = g.sightline(a, b),
        n = g.candidateCount(line),
        delta = g.axial(q, r);
      expect(g.candidateCount(g.sightline(b, a))).toBe(n);
      expect(
        g.candidateCount(
          g.sightline(g.translate(a, delta), g.translate(b, delta)),
        ),
      ).toBe(n);
      expect(g.enumerateCells(line, n - 1n).status).toBe('resource-limit');
      expect(g.enumerateCells(line, n).status).toBe('complete');
      expect(g.enumerateCells(line, n + 1n).status).toBe('complete');
    }),
    { seed: 1301, numRuns: 200 },
  );
});
it('measured default admits its inclusive boundary and refuses the next candidate', () => {
  expect(g.DEFAULT_MAX_CANDIDATES).toBe(1000n);
  const admitted = g.traceSightline(origin, g.axial(999n, 0n));
  expect(admitted.status).toBe('complete');
  expect(admitted.candidateCount).toBe(1000n);
  expect(g.traceSightline(origin, g.axial(1000n, 0n))).toEqual({
    status: 'resource-limit',
    candidateCount: 1001n,
    maxCandidates: 1000n,
  });
  expect(g.traceSightline(origin, origin, 0n)).toEqual({
    status: 'resource-limit',
    candidateCount: 1n,
    maxCandidates: 0n,
  });
});
