import {
  addPoint,
  DIRECTIONS,
  embed,
  point,
  type Axial,
  type Direction,
  type Point,
} from './coordinates.js';
import { compareRational, rational, type Rational } from './rational.js';
import { pointAt, type Sightline } from './sightline.js';
export const VERTICES: readonly Point[] = Object.freeze([
  point(0n, 2n),
  point(1n, 1n),
  point(1n, -1n),
  point(0n, -2n),
  point(-1n, -1n),
  point(-1n, 1n),
]);
export const NORMALS: Readonly<Record<Direction, Point>> = Object.freeze({
  0: point(1n, 0n),
  1: point(1n, 1n),
  2: point(-1n, 1n),
  3: point(-1n, 0n),
  4: point(-1n, -1n),
  5: point(1n, -1n),
});
export const BOUNDS: Readonly<Record<Direction, bigint>> = Object.freeze({
  0: 1n,
  1: 2n,
  2: 2n,
  3: 1n,
  4: 2n,
  5: 2n,
});
export const EDGE_VERTICES: Readonly<
  Record<Direction, readonly [number, number]>
> = Object.freeze({
  0: Object.freeze([1, 2] as const),
  1: Object.freeze([0, 1] as const),
  2: Object.freeze([5, 0] as const),
  3: Object.freeze([4, 5] as const),
  4: Object.freeze([3, 4] as const),
  5: Object.freeze([2, 3] as const),
});
export function polygonVertices(cell: Axial): readonly Point[] {
  const h = embed(cell);
  return Object.freeze(VERTICES.map((v) => addPoint(h, v)));
}
export interface BoundaryIncidence {
  readonly location: 'strict-interior' | 'edge' | 'vertex';
  readonly edges: readonly Direction[];
  /** Global embedded integer vertex positions, independent of any owning cell. */
  readonly vertices: readonly Point[];
}
export function constraintSlack(
  line: Sightline,
  cell: Axial,
  t: Rational,
  direction: Direction,
): bigint {
  const h = embed(cell),
    n = NORMALS[direction];
  return (
    (BOUNDS[direction] - n.x * (line.a.x - h.x) - n.y * (line.a.y - h.y)) *
      t.denominator -
    (n.x * line.d.x + n.y * line.d.y) * t.numerator
  );
}
export function boundaryAt(
  line: Sightline,
  cell: Axial,
  t: Rational,
): BoundaryIncidence {
  const edges = DIRECTIONS.filter(
    (d) => constraintSlack(line, cell, t, d) === 0n,
  );
  const p = pointAt(line, t);
  const vertices = polygonVertices(cell).filter(
    (v) =>
      compareRational(p.x, rational(v.x)) === 0 &&
      compareRational(p.y, rational(v.y)) === 0,
  );
  return Object.freeze({
    location: vertices.length
      ? 'vertex'
      : edges.length
        ? 'edge'
        : 'strict-interior',
    edges: Object.freeze(edges),
    vertices: Object.freeze(vertices),
  });
}
