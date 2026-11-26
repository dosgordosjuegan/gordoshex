import { abs, sign, type Sign, requireBigint } from './integer.js';
export interface Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
}
export function rational(numerator: bigint, denominator = 1n): Rational {
  requireBigint(numerator);
  requireBigint(denominator);
  if (denominator === 0n) throw new RangeError('Zero denominator');
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  let a = abs(numerator),
    b = denominator;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return Object.freeze({
    numerator: numerator / a,
    denominator: denominator / a,
  });
}
export const ZERO = rational(0n);
export const ONE = rational(1n);
export const compareRational = (a: Rational, b: Rational): Sign =>
  sign(a.numerator * b.denominator - b.numerator * a.denominator);
export const equalRational = (a: Rational, b: Rational): boolean =>
  compareRational(a, b) === 0;
export const addRational = (a: Rational, b: Rational): Rational =>
  rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
export const subtractRational = (a: Rational, b: Rational): Rational =>
  rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
export const multiplyRational = (a: Rational, b: Rational): Rational =>
  rational(a.numerator * b.numerator, a.denominator * b.denominator);
export const divideRational = (a: Rational, b: Rational): Rational =>
  rational(a.numerator * b.denominator, a.denominator * b.numerator);
export const rationalKey = (a: Rational): string => {
  const v = rational(a.numerator, a.denominator);
  return `${v.numerator}/${v.denominator}`;
};
export const minRational = (a: Rational, b: Rational): Rational =>
  compareRational(a, b) <= 0 ? a : b;
export const maxRational = (a: Rational, b: Rational): Rational =>
  compareRational(a, b) >= 0 ? a : b;
export const inUnitInterval = (a: Rational): boolean =>
  compareRational(a, ZERO) >= 0 && compareRational(a, ONE) <= 0;
export const midpoint = (a: Rational, b: Rational): Rational =>
  divideRational(addRational(a, b), rational(2n));
