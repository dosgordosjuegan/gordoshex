import { abs, max, sign, requireBigint, type Sign } from './integer.js';
export interface Axial {
  readonly q: bigint;
  readonly r: bigint;
}
export interface Point {
  readonly x: bigint;
  readonly y: bigint;
}
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;
export const DIRECTIONS: readonly Direction[] = Object.freeze([
  0, 1, 2, 3, 4, 5,
]);
export function axial(q: bigint, r: bigint): Axial {
  requireBigint(q);
  requireBigint(r);
  return Object.freeze({ q, r });
}
export const coordinateKey = (a: Axial): string => `${a.q},${a.r}`;
export const equalCoordinates = (a: Axial, b: Axial): boolean =>
  a.q === b.q && a.r === b.r;
export const compareCoordinates = (a: Axial, b: Axial): Sign =>
  sign(a.q - b.q) || sign(a.r - b.r);
export const translate = (a: Axial, b: Axial): Axial =>
  axial(a.q + b.q, a.r + b.r);
export const embed = (a: Axial): Point =>
  Object.freeze({ x: 2n * a.q + a.r, y: 3n * a.r });
export const point = (x: bigint, y: bigint): Point => Object.freeze({ x, y });
export const addPoint = (a: Point, b: Point): Point =>
  point(a.x + b.x, a.y + b.y);
export const subtractPoint = (a: Point, b: Point): Point =>
  point(a.x - b.x, a.y - b.y);
export const determinant = (a: Point, b: Point): bigint =>
  a.x * b.y - a.y * b.x;
export const dot = (a: Point, b: Point): bigint => a.x * b.x + a.y * b.y;
export const comparePoints = (a: Point, b: Point): Sign =>
  sign(a.x - b.x) || sign(a.y - b.y);
export const pointKey = (a: Point): string => `${a.x},${a.y}`;
const offsets: Readonly<Record<Direction, Axial>> = Object.freeze({
  0: axial(1n, 0n),
  1: axial(0n, 1n),
  2: axial(-1n, 1n),
  3: axial(-1n, 0n),
  4: axial(0n, -1n),
  5: axial(1n, -1n),
});
export function neighbor(a: Axial, direction: Direction): Axial {
  if (!DIRECTIONS.includes(direction))
    throw new RangeError('Invalid direction');
  return translate(a, offsets[direction]);
}
export const neighbors = (a: Axial): readonly Axial[] =>
  Object.freeze(DIRECTIONS.map((d) => neighbor(a, d)));
export const distance = (a: Axial, b: Axial): bigint =>
  max(max(abs(b.q - a.q), abs(b.r - a.r)), abs(b.q - a.q + b.r - a.r));
export const rotate = (a: Axial): Axial => axial(-a.r, a.q + a.r);
export const reflect = (a: Axial): Axial => axial(a.q + a.r, -a.r);
