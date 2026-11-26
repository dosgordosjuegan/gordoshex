/** Persistent independent oracle: axial search rectangle, clockwise polygon sides,
 * signed orientations and interpolation. No production clipping, normals, candidate
 * bounds/counts, edge intersection, edge geometry or event grouping is imported. */
import {
  axial,
  coordinateKey,
  type Axial,
  type Direction,
  type Point,
} from '../../src/geometry/coordinates.js';
import {
  rational,
  compareRational,
  equalRational,
  addRational,
  subtractRational,
  multiplyRational,
  divideRational,
  rationalKey,
  ZERO,
  ONE,
  midpoint,
  type Rational,
} from '../../src/geometry/rational.js';
import type { CellHit } from '../../src/geometry/clipping.js';
import type { BoundaryIncidence } from '../../src/geometry/polygon.js';
import type {
  EdgeHit,
  EdgeGeometry,
  EdgeIncidence,
} from '../../src/geometry/edges.js';
import type { GeometryEvent } from '../../src/geometry/events.js';
const vertices: readonly (readonly [bigint, bigint])[] = [
  [0n, 2n],
  [1n, 1n],
  [1n, -1n],
  [0n, -2n],
  [-1n, -1n],
  [-1n, 1n],
];
const directions: readonly Direction[] = [1, 0, 5, 4, 3, 2];
const offsets: Readonly<Record<Direction, readonly [bigint, bigint]>> = {
  0: [1n, 0n],
  1: [0n, 1n],
  2: [-1n, 1n],
  3: [-1n, 0n],
  4: [0n, -1n],
  5: [1n, -1n],
};
const center = (c: Axial): Point => ({ x: 2n * c.q + c.r, y: 3n * c.r });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const cross = (a: Point, b: Point): bigint => a.x * b.y - a.y * b.x;
const sgn = (n: bigint): -1 | 0 | 1 => (n < 0n ? -1 : n > 0n ? 1 : 0);
const lex = (a: Point, b: Point): number => sgn(a.x - b.x) || sgn(a.y - b.y);
const lo = (a: bigint, b: bigint): bigint => (a < b ? a : b);
const hi = (a: bigint, b: bigint): bigint => (a > b ? a : b);
function polygon(cell: Axial): Point[] {
  const h = center(cell);
  return vertices.map(([x, y]) => ({ x: h.x + x, y: h.y + y }));
}
function sides(cell: Axial): { u: Point; v: Point; direction: Direction }[] {
  const points = polygon(cell);
  return points.map((u, i) => {
    const v = points[(i + 1) % 6],
      direction = directions[i];
    if (!v || direction === undefined) throw new Error('Oracle polygon');
    return { u, v, direction };
  });
}
function location(
  a: Point,
  b: Point,
  t: Rational,
): { x: Rational; y: Rational } {
  return {
    x: addRational(rational(a.x), multiplyRational(t, rational(b.x - a.x))),
    y: addRational(rational(a.y), multiplyRational(t, rational(b.y - a.y))),
  };
}
function orientationAt(
  u: Point,
  v: Point,
  p: { x: Rational; y: Rational },
): Rational {
  return subtractRational(
    multiplyRational(rational(v.x - u.x), subtractRational(p.y, rational(u.y))),
    multiplyRational(rational(v.y - u.y), subtractRational(p.x, rational(u.x))),
  );
}
function inside(
  cell: Axial,
  a: Point,
  b: Point,
  t: Rational,
  strict = false,
): boolean {
  const p = location(a, b, t);
  return sides(cell).every(({ u, v }) =>
    strict
      ? compareRational(orientationAt(u, v, p), ZERO) < 0
      : compareRational(orientationAt(u, v, p), ZERO) <= 0,
  );
}
function boundary(
  cell: Axial,
  a: Point,
  b: Point,
  t: Rational,
): BoundaryIncidence {
  const p = location(a, b, t),
    edges = sides(cell)
      .filter(({ u, v }) => equalRational(orientationAt(u, v, p), ZERO))
      .map((s) => s.direction)
      .sort((x, y) => x - y);
  const vs = polygon(cell).filter(
    (v) =>
      equalRational(p.x, rational(v.x)) && equalRational(p.y, rational(v.y)),
  );
  return {
    location: vs.length ? 'vertex' : edges.length ? 'edge' : 'strict-interior',
    edges,
    vertices: vs,
  };
}
interface SideHit {
  entry: Rational;
  exit: Rational;
  uEntry: Rational;
  uExit: Rational;
}
function sideIntersection(
  a: Point,
  b: Point,
  u: Point,
  v: Point,
): SideHit | null {
  const orientA = cross(sub(v, u), sub(a, u)),
    orientB = cross(sub(v, u), sub(b, u));
  const orientU = cross(sub(b, a), sub(u, a)),
    orientV = cross(sub(b, a), sub(v, a));
  if (orientA !== orientB) {
    const t = rational(orientA, orientA - orientB),
      s = rational(orientU, orientU - orientV);
    if (
      compareRational(t, ZERO) < 0 ||
      compareRational(t, ONE) > 0 ||
      compareRational(s, ZERO) < 0 ||
      compareRational(s, ONE) > 0
    )
      return null;
    return { entry: t, exit: t, uEntry: s, uExit: s };
  }
  if (orientA !== 0n) return null;
  const d = sub(b, a),
    length = d.x * d.x + d.y * d.y;
  if (length === 0n) return null;
  const project = (p: Point): Rational =>
    rational((p.x - a.x) * d.x + (p.y - a.y) * d.y, length);
  const ts = [ZERO, ONE, project(u), project(v)].sort(compareRational),
    tu = project(u),
    tv = project(v);
  const start = compareRational(tu, tv) < 0 ? tu : tv,
    end = compareRational(tu, tv) > 0 ? tu : tv;
  const possible = ts.filter(
    (t) =>
      compareRational(t, ZERO) >= 0 &&
      compareRational(t, ONE) <= 0 &&
      compareRational(t, start) >= 0 &&
      compareRational(t, end) <= 0,
  );
  const entry = possible[0],
    exit = possible.at(-1);
  if (!entry || !exit) return null;
  const edgeU = (t: Rational): Rational =>
    divideRational(subtractRational(t, tu), subtractRational(tv, tu));
  return { entry, exit, uEntry: edgeU(entry), uExit: edgeU(exit) };
}
export function oracleCell(
  origin: Axial,
  target: Axial,
  cell: Axial,
): CellHit | null {
  const a = center(origin),
    b = center(target),
    h = center(cell);
  if (origin.q === target.q && origin.r === target.r) {
    if (cell.q !== origin.q || cell.r !== origin.r) return null;
    return {
      cell,
      kind: 'degenerate-point',
      entry: ZERO,
      exit: ONE,
      side: 0,
      entryBoundary: boundary(cell, a, b, ZERO),
      exitBoundary: boundary(cell, a, b, ONE),
      supportingEdges: [],
    };
  }
  const ts: Rational[] = [];
  if (inside(cell, a, b, ZERO)) ts.push(ZERO);
  if (inside(cell, a, b, ONE)) ts.push(ONE);
  for (const { u, v } of sides(cell)) {
    const contact = sideIntersection(a, b, u, v);
    if (contact) ts.push(contact.entry, contact.exit);
  }
  ts.sort(compareRational);
  const entry = ts[0],
    exit = ts.at(-1);
  if (!entry || !exit) return null;
  const kind = equalRational(entry, exit)
    ? 'isolated-vertex'
    : inside(cell, a, b, midpoint(entry, exit), true)
      ? 'interior'
      : 'edge-overlap';
  const supportingEdges = sides(cell)
    .filter(
      ({ u, v }) =>
        cross(sub(v, u), sub(a, u)) === 0n &&
        cross(sub(v, u), sub(b, u)) === 0n,
    )
    .map((s) => s.direction)
    .sort((x, y) => x - y);
  return {
    cell,
    kind,
    entry,
    exit,
    side: sgn(cross(sub(b, a), sub(h, a))),
    entryBoundary: boundary(cell, a, b, entry),
    exitBoundary: boundary(cell, a, b, exit),
    supportingEdges,
  };
}
export function oracleCells(origin: Axial, target: Axial): CellHit[] {
  const cells: CellHit[] = [];
  for (
    let r = lo(origin.r, target.r) - 1n;
    r <= hi(origin.r, target.r) + 1n;
    r++
  )
    for (
      let q = lo(origin.q, target.q) - 1n;
      q <= hi(origin.q, target.q) + 1n;
      q++
    ) {
      const cell = oracleCell(origin, target, axial(q, r));
      if (cell) cells.push(cell);
    }
  return cells;
}
function edgeIncidence(
  edge: EdgeGeometry,
  t: Rational,
  u: Rational,
): EdgeIncidence {
  return {
    sightlineEndpoint: equalRational(t, ZERO)
      ? 'origin'
      : equalRational(t, ONE)
        ? 'target'
        : null,
    edgeEndpoint: equalRational(u, ZERO)
      ? 'u'
      : equalRational(u, ONE)
        ? 'v'
        : null,
    vertex: equalRational(u, ZERO)
      ? edge.u
      : equalRational(u, ONE)
        ? edge.v
        : null,
  };
}
export function oracleEdges(
  origin: Axial,
  target: Axial,
  cells: readonly CellHit[],
): EdgeHit[] {
  if (origin.q === target.q && origin.r === target.r) return [];
  const a = center(origin),
    b = center(target),
    found = new Map<string, EdgeHit>();
  for (const cell of cells)
    for (const side of sides(cell.cell)) {
      const [dq, dr] = offsets[side.direction],
        other = axial(cell.cell.q + dq, cell.cell.r + dr);
      const [first, second] =
        cell.cell.q < other.q ||
        (cell.cell.q === other.q && cell.cell.r < other.r)
          ? [cell.cell, other]
          : [other, cell.cell];
      const key = `${coordinateKey(first)}|${coordinateKey(second)}`;
      const edge: EdgeGeometry = {
        id: { first, second, key },
        u: lex(side.u, side.v) < 0 ? side.u : side.v,
        v: lex(side.u, side.v) < 0 ? side.v : side.u,
      };
      const contact = sideIntersection(a, b, edge.u, edge.v);
      if (!contact) continue;
      const { entry, exit, uEntry, uExit } = contact,
        kind = equalRational(entry, exit) ? 'point' : 'overlap';
      const proper =
        kind === 'point' &&
        compareRational(entry, ZERO) > 0 &&
        compareRational(entry, ONE) < 0 &&
        compareRational(uEntry, ZERO) > 0 &&
        compareRational(uEntry, ONE) < 0;
      found.set(key, {
        edge,
        kind,
        classification:
          kind === 'overlap'
            ? 'edge-overlap'
            : proper
              ? 'proper-crossing'
              : 'touch',
        ...contact,
        sideA: sgn(cross(sub(edge.v, edge.u), sub(a, edge.u))),
        sideB: sgn(cross(sub(edge.v, edge.u), sub(b, edge.u))),
        cells: [first, second],
        entryIncidence: edgeIncidence(edge, entry, uEntry),
        exitIncidence: edgeIncidence(edge, exit, uExit),
      });
    }
  return [...found.values()].sort((a, b) =>
    a.edge.id.key.localeCompare(b.edge.id.key),
  );
}
export function oracleEvents(
  cells: readonly CellHit[],
  edges: readonly EdgeHit[],
): GeometryEvent[] {
  if (cells.some((c) => c.kind === 'degenerate-point')) return [];
  const parameters = [
    ZERO,
    ONE,
    ...cells.flatMap((c) => [c.entry, c.exit]),
    ...edges.flatMap((e) => [e.entry, e.exit]),
  ];
  const distinct = [
    ...new Map(parameters.map((t) => [rationalKey(t), t])).values(),
  ].sort(compareRational);
  // Deliberately scan all records at every parameter instead of production's incidence accumulation.
  return distinct.map((t) => ({
    t,
    enteringCells: cells
      .filter((c) => equalRational(c.entry, t))
      .map((c) => coordinateKey(c.cell))
      .sort(),
    exitingCells: cells
      .filter((c) => equalRational(c.exit, t))
      .map((c) => coordinateKey(c.cell))
      .sort(),
    isolatedVertexCells: cells
      .filter((c) => c.kind === 'isolated-vertex' && equalRational(c.entry, t))
      .map((c) => coordinateKey(c.cell))
      .sort(),
    edgePoints: edges
      .filter((e) => e.kind === 'point' && equalRational(e.entry, t))
      .map((e) => e.edge.id.key)
      .sort(),
    overlapStarts: edges
      .filter((e) => e.kind === 'overlap' && equalRational(e.entry, t))
      .map((e) => e.edge.id.key)
      .sort(),
    overlapEnds: edges
      .filter((e) => e.kind === 'overlap' && equalRational(e.exit, t))
      .map((e) => e.edge.id.key)
      .sort(),
  }));
}
