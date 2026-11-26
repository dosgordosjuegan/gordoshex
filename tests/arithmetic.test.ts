import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as g from '../src/index.js';
describe('M1.1 exact foundations', () => {
  it('normalizes and computes rationals by value', () => {
    for (const [n, d, en, ed] of [
      [2n, 6n, 1n, 3n],
      [1n, -3n, -1n, 3n],
      [-2n, -6n, 1n, 3n],
      [0n, -7n, 0n, 1n],
    ])
      expect(g.rational(n!, d!)).toEqual({ numerator: en, denominator: ed });
    expect(() => g.rational(1n, 0n)).toThrow();
    const a = g.rational(1n, 3n),
      b = g.rational(2n, 6n);
    expect(g.equalRational(a, b)).toBe(true);
    expect(g.addRational(a, b)).toEqual(g.rational(2n, 3n));
    expect(g.subtractRational(a, b)).toEqual(g.ZERO);
    expect(g.multiplyRational(a, b)).toEqual(g.rational(1n, 9n));
    expect(g.divideRational(a, b)).toEqual(g.ONE);
    expect(() => g.divideRational(a, g.ZERO)).toThrow();
  });
  it('uses mathematical signed division and strict adapters', () => {
    for (const [a, f, c] of [
      [-1n, -1n, 0n],
      [-4n, -2n, -1n],
      [-6n, -2n, -2n],
    ]) {
      expect(g.floorDiv(a!, 3n)).toBe(f);
      expect(g.ceilDiv(a!, 3n)).toBe(c);
    }
    expect(() => g.floorDiv(1n, 0n)).toThrow();
    for (const n of [NaN, Infinity, -Infinity, 1.5, 9007199254740992])
      expect(() => g.integerFromNumber(n)).toThrow();
    for (const s of [
      '+1',
      '01',
      '-0',
      ' 1',
      '1.0',
      '1e3',
      '1\n',
      '1\r',
      '1\r\n',
      '',
    ])
      expect(() => g.integerFromString(s)).toThrow();
    expect(g.integerFromNumber(-0)).toBe(0n);
    fc.assert(
      fc.property(fc.bigInt(), (n) => {
        expect(g.integerFromString(n.toString())).toBe(n);
      }),
      { seed: 1101, numRuns: 200 },
    );
  });
  it('preserves cancelling products and huge coordinates', () => {
    const n = 9007199254740993n;
    expect(g.determinant(g.point(n, n - 1n), g.point(n + 1n, n))).toBe(1n);
    expect(
      g.compareRational(g.rational(n, n + 1n), g.rational(n - 1n, n)),
    ).toBe(1);
    expect(g.distance(g.axial(n, -n), g.axial(n + 2n, -n - 1n))).toBe(2n);
    expect(g.distance(g.axial(0n, 0n), g.axial(n, -n))).toBe(n);
  });
  it('satisfies the lattice metric and neighbor contracts', () => {
    const coord = fc
      .tuple(
        fc.bigInt({ min: -20n, max: 20n }),
        fc.bigInt({ min: -20n, max: 20n }),
      )
      .map(([q, r]) => g.axial(q, r));
    fc.assert(
      fc.property(coord, coord, coord, (a, b, c) => {
        const d = g.distance(a, b),
          dq = b.q - a.q,
          dr = b.r - a.r;
        expect(d).toBe((g.abs(dq) + g.abs(dr) + g.abs(dq + dr)) / 2n);
        expect(d).toBe(g.distance(b, a));
        expect(d <= g.distance(a, c) + g.distance(c, b)).toBe(true);
        expect(d === 0n).toBe(g.equalCoordinates(a, b));
        expect(new Set(g.neighbors(a).map(g.coordinateKey)).size).toBe(6);
        for (const n of g.neighbors(a)) expect(g.distance(a, n)).toBe(1n);
        expect(g.embed(a)).toEqual({ x: 2n * a.q + a.r, y: 3n * a.r });
      }),
      { seed: 1102, numRuns: 200 },
    );
  });
});
it('rational laws remain exact under scaling, reduction and large inputs', () => {
  const nonzero = fc.bigInt({ min: 1n, max: 10n ** 30n });
  fc.assert(
    fc.property(
      fc.bigInt(),
      nonzero,
      fc.bigInt(),
      nonzero,
      nonzero,
      (n, d, m, e, scale) => {
        const a = g.rational(n, d),
          b = g.rational(m, e);
        expect(g.rational(n * scale, d * scale)).toEqual(a);
        expect(g.subtractRational(g.addRational(a, b), b)).toEqual(a);
        expect(g.compareRational(a, b)).toBe(g.sign(n * e - m * d));
        if (m !== 0n)
          expect(g.divideRational(g.multiplyRational(a, b), b)).toEqual(a);
        const f = g.floorDiv(n, d),
          c = g.ceilDiv(n, d);
        expect(f * d <= n && n < (f + 1n) * d).toBe(true);
        expect((c - 1n) * d < n && n <= c * d).toBe(true);
      },
    ),
    { seed: 1103, numRuns: 300 },
  );
  for (const value of [1, 1n, null, undefined])
    expect(() =>
      Reflect.apply(g.integerFromString, undefined, [value]),
    ).toThrow();
});
