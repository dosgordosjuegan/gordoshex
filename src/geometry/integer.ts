export type Sign = -1 | 0 | 1;
export const abs = (a: bigint): bigint => (a < 0n ? -a : a);
export const sign = (a: bigint): Sign => (a < 0n ? -1 : a > 0n ? 1 : 0);
export const min = (a: bigint, b: bigint): bigint => (a < b ? a : b);
export const max = (a: bigint, b: bigint): bigint => (a > b ? a : b);
export function floorDiv(a: bigint, b: bigint): bigint {
  if (b <= 0n) throw new RangeError('Divisor must be positive');
  return a / b - (a % b < 0n ? 1n : 0n);
}
export const ceilDiv = (a: bigint, b: bigint): bigint => -floorDiv(-a, b);
export function integerFromNumber(value: number): bigint {
  if (!Number.isSafeInteger(value))
    throw new RangeError('Expected a safe integer');
  return BigInt(value);
}
export function integerFromString(value: string): bigint {
  if (typeof value !== 'string') throw new TypeError('Expected a string');
  if (!/^(0|-?[1-9][0-9]*)$/.test(value) || value.trim() !== value)
    throw new SyntaxError('Expected a canonical decimal integer');
  return BigInt(value);
}
export function requireBigint(value: bigint): void {
  if (typeof value !== 'bigint') throw new TypeError('Expected bigint');
}
