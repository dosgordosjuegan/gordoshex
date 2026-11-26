import {
  axial,
  determinant,
  DIRECTIONS,
  dot,
  embed,
  equalCoordinates,
  subtractPoint,
  type Axial,
  type Direction,
} from './coordinates.js';
import { sign, type Sign } from './integer.js';
import {
  boundaryAt,
  BOUNDS,
  constraintSlack,
  NORMALS,
  type BoundaryIncidence,
} from './polygon.js';
import {
  compareRational,
  maxRational,
  midpoint,
  minRational,
  ONE,
  rational,
  ZERO,
  type Rational,
} from './rational.js';
import type { Sightline } from './sightline.js';
export type ContactClass =
  'interior' | 'edge-overlap' | 'isolated-vertex' | 'degenerate-point';
export interface CellHit {
  readonly cell: Axial;
  readonly kind: ContactClass;
  readonly entry: Rational;
  readonly exit: Rational;
  readonly side: Sign;
  readonly entryBoundary: BoundaryIncidence;
  readonly exitBoundary: BoundaryIncidence;
  readonly supportingEdges: readonly Direction[];
}
export interface CellMiss {
  readonly cell: Axial;
  readonly kind: 'none';
  readonly side: Sign;
}
export type CellContact = CellHit | CellMiss;
/** Only accepts a center-to-center sightline; arbitrary-point singleton contacts need a different contract. */
export function clipCell(line: Sightline, cell: Axial): CellContact {
  cell = axial(cell.q, cell.r);
  const h = embed(cell),
    side = sign(determinant(line.d, subtractPoint(h, line.a)));
  const miss: CellMiss = Object.freeze({ cell, kind: 'none', side });
  if (line.degenerate && !equalCoordinates(line.origin, cell)) return miss;
  let entry = ZERO,
    exit = ONE;
  const supporting: Direction[] = [];
  for (const direction of DIRECTIONS) {
    const n = NORMALS[direction],
      k = dot(n, line.d),
      z = BOUNDS[direction] - dot(n, subtractPoint(line.a, h));
    if (k === 0n) {
      if (z < 0n) return miss;
      if (z === 0n) supporting.push(direction);
    } else if (k > 0n) exit = minRational(exit, rational(z, k));
    else entry = maxRational(entry, rational(z, k));
    if (compareRational(entry, exit) > 0) return miss;
  }
  const entryBoundary = boundaryAt(line, cell, entry),
    exitBoundary = boundaryAt(line, cell, exit);
  let kind: ContactClass;
  if (line.degenerate) kind = 'degenerate-point';
  else if (compareRational(entry, exit) === 0) {
    if (entryBoundary.location !== 'vertex')
      throw new Error('Center-to-center singleton must be a polygon vertex');
    kind = 'isolated-vertex';
  } else
    kind = DIRECTIONS.every(
      (d) => constraintSlack(line, cell, midpoint(entry, exit), d) > 0n,
    )
      ? 'interior'
      : 'edge-overlap';
  return Object.freeze({
    cell,
    kind,
    entry,
    exit,
    side,
    entryBoundary,
    exitBoundary,
    supportingEdges: Object.freeze(supporting),
  });
}
