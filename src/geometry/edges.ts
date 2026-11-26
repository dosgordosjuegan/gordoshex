import {
  axial,
  addPoint,
  compareCoordinates,
  comparePoints,
  coordinateKey,
  determinant,
  DIRECTIONS,
  distance,
  embed,
  equalCoordinates,
  neighbor,
  subtractPoint,
  type Axial,
  type Direction,
  type Point,
} from './coordinates.js';
import { sign, type Sign } from './integer.js';
import { EDGE_VERTICES, VERTICES } from './polygon.js';
import {
  compareRational,
  divideRational,
  equalRational,
  inUnitInterval,
  maxRational,
  minRational,
  ONE,
  rational,
  subtractRational,
  ZERO,
  type Rational,
} from './rational.js';
import { pointAt, type Sightline } from './sightline.js';
export interface EdgeId {
  readonly first: Axial;
  readonly second: Axial;
  readonly key: string;
}
export function edgeId(a: Axial, b: Axial): EdgeId {
  a = axial(a.q, a.r);
  b = axial(b.q, b.r);
  if (distance(a, b) !== 1n)
    throw new RangeError('An edge requires distinct adjacent cells');
  const [first, second] = compareCoordinates(a, b) < 0 ? [a, b] : [b, a];
  return Object.freeze({
    first,
    second,
    key: `${coordinateKey(first)}|${coordinateKey(second)}`,
  });
}
export const localEdge = (cell: Axial, direction: Direction): EdgeId =>
  edgeId(cell, neighbor(cell, direction));
export const equalEdges = (a: EdgeId, b: EdgeId): boolean =>
  equalCoordinates(a.first, b.first) && equalCoordinates(a.second, b.second);
export interface EdgeGeometry {
  readonly id: EdgeId;
  readonly u: Point;
  readonly v: Point;
}
export function edgeGeometry(id: EdgeId): EdgeGeometry {
  const normalized = edgeId(id.first, id.second);
  const direction = DIRECTIONS.find((d) =>
    equalCoordinates(neighbor(normalized.first, d), normalized.second),
  );
  if (direction === undefined) throw new Error('Missing adjacent direction');
  const [i, j] = EDGE_VERTICES[direction],
    a = VERTICES[i],
    b = VERTICES[j];
  if (!a || !b) throw new Error('Invalid edge vertices');
  const h = embed(normalized.first),
    p = addPoint(h, a),
    q = addPoint(h, b);
  return Object.freeze({
    id: normalized,
    u: comparePoints(p, q) < 0 ? p : q,
    v: comparePoints(p, q) < 0 ? q : p,
  });
}
export interface EdgeIncidence {
  readonly sightlineEndpoint: 'origin' | 'target' | null;
  readonly edgeEndpoint: 'u' | 'v' | null;
  readonly vertex: Point | null;
}
interface EdgeBase {
  readonly edge: EdgeGeometry;
  readonly sideA: Sign;
  readonly sideB: Sign;
  /** Both incident cell references, even if either or both are absent from a board. */
  readonly cells: readonly [Axial, Axial];
}
export interface EdgeMiss extends EdgeBase {
  readonly kind: 'none';
}
export interface EdgeHit extends EdgeBase {
  readonly kind: 'point' | 'overlap';
  readonly classification: 'proper-crossing' | 'touch' | 'edge-overlap';
  readonly entry: Rational;
  readonly exit: Rational;
  readonly uEntry: Rational;
  readonly uExit: Rational;
  readonly entryIncidence: EdgeIncidence;
  readonly exitIncidence: EdgeIncidence;
}
function incidence(
  edge: EdgeGeometry,
  t: Rational,
  u: Rational,
): EdgeIncidence {
  const edgeEndpoint = equalRational(u, ZERO)
    ? 'u'
    : equalRational(u, ONE)
      ? 'v'
      : null;
  return Object.freeze({
    sightlineEndpoint: equalRational(t, ZERO)
      ? 'origin'
      : equalRational(t, ONE)
        ? 'target'
        : null,
    edgeEndpoint,
    vertex:
      edgeEndpoint === 'u' ? edge.u : edgeEndpoint === 'v' ? edge.v : null,
  });
}
/** Finite closed edge intersection. A degenerate center is strictly inside its owning cell and touches no edge. */
export function intersectEdge(line: Sightline, id: EdgeId): EdgeHit | EdgeMiss {
  const edge = edgeGeometry(id),
    e = subtractPoint(edge.v, edge.u),
    w = subtractPoint(edge.u, line.a),
    k = determinant(line.d, e);
  const base: EdgeBase = {
    edge,
    sideA: sign(determinant(e, subtractPoint(line.a, edge.u))),
    sideB: sign(determinant(e, subtractPoint(line.b, edge.u))),
    cells: Object.freeze([edge.id.first, edge.id.second]),
  };
  const miss: EdgeMiss = Object.freeze({ ...base, kind: 'none' });
  if (line.degenerate) return miss;
  let entry: Rational, exit: Rational, uEntry: Rational, uExit: Rational;
  if (k !== 0n) {
    entry = rational(determinant(w, e), k);
    uEntry = rational(determinant(w, line.d), k);
    if (!inUnitInterval(entry) || !inUnitInterval(uEntry)) return miss;
    exit = entry;
    uExit = uEntry;
  } else {
    if (determinant(w, line.d) !== 0n) return miss;
    const tu =
      line.d.x !== 0n
        ? rational(edge.u.x - line.a.x, line.d.x)
        : rational(edge.u.y - line.a.y, line.d.y);
    const tv =
      line.d.x !== 0n
        ? rational(edge.v.x - line.a.x, line.d.x)
        : rational(edge.v.y - line.a.y, line.d.y);
    entry = maxRational(ZERO, minRational(tu, tv));
    exit = minRational(ONE, maxRational(tu, tv));
    if (compareRational(entry, exit) > 0) return miss;
    const edgeParameter = (t: Rational): Rational => {
      const p = pointAt(line, t);
      return e.x !== 0n
        ? divideRational(
            subtractRational(p.x, rational(edge.u.x)),
            rational(e.x),
          )
        : divideRational(
            subtractRational(p.y, rational(edge.u.y)),
            rational(e.y),
          );
    };
    uEntry = edgeParameter(entry);
    uExit = edgeParameter(exit);
  }
  const kind = equalRational(entry, exit) ? 'point' : 'overlap';
  const proper =
    kind === 'point' &&
    k !== 0n &&
    compareRational(entry, ZERO) > 0 &&
    compareRational(entry, ONE) < 0 &&
    compareRational(uEntry, ZERO) > 0 &&
    compareRational(uEntry, ONE) < 0;
  return Object.freeze({
    ...base,
    kind,
    classification:
      kind === 'overlap'
        ? 'edge-overlap'
        : proper
          ? 'proper-crossing'
          : 'touch',
    entry,
    exit,
    uEntry,
    uExit,
    entryIncidence: incidence(edge, entry, uEntry),
    exitIncidence: incidence(edge, exit, uExit),
  });
}
