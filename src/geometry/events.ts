import type { CellHit } from './clipping.js';
import { coordinateKey } from './coordinates.js';
import type { EdgeHit } from './edges.js';
import {
  compareRational,
  ONE,
  rational,
  rationalKey,
  ZERO,
  type Rational,
} from './rational.js';
export interface GeometryEvent {
  readonly t: Rational;
  readonly enteringCells: readonly string[];
  readonly exitingCells: readonly string[];
  readonly isolatedVertexCells: readonly string[];
  readonly edgePoints: readonly string[];
  readonly overlapStarts: readonly string[];
  readonly overlapEnds: readonly string[];
}
interface MutableEvent {
  t: Rational;
  enteringCells: Set<string>;
  exitingCells: Set<string>;
  isolatedVertexCells: Set<string>;
  edgePoints: Set<string>;
  overlapStarts: Set<string>;
  overlapEnds: Set<string>;
}
/** Stable order is storage only. Every incidence at the same exact parameter survives. */
export function groupEvents(
  cells: readonly CellHit[],
  edges: readonly EdgeHit[],
  degenerate = false,
): readonly GeometryEvent[] {
  if (degenerate) return Object.freeze([]);
  const groups = new Map<string, MutableEvent>();
  const at = (t: Rational): MutableEvent => {
    const key = rationalKey(t);
    let event = groups.get(key);
    if (!event) {
      event = {
        t: rational(t.numerator, t.denominator),
        enteringCells: new Set(),
        exitingCells: new Set(),
        isolatedVertexCells: new Set(),
        edgePoints: new Set(),
        overlapStarts: new Set(),
        overlapEnds: new Set(),
      };
      groups.set(key, event);
    }
    return event;
  };
  at(ZERO);
  at(ONE);
  for (const cell of cells) {
    const key = coordinateKey(cell.cell);
    at(cell.entry).enteringCells.add(key);
    at(cell.exit).exitingCells.add(key);
    if (cell.kind === 'isolated-vertex')
      at(cell.entry).isolatedVertexCells.add(key);
  }
  for (const edge of edges) {
    if (edge.kind === 'point') at(edge.entry).edgePoints.add(edge.edge.id.key);
    else {
      at(edge.entry).overlapStarts.add(edge.edge.id.key);
      at(edge.exit).overlapEnds.add(edge.edge.id.key);
    }
  }
  const sorted = (set: Set<string>): readonly string[] =>
    Object.freeze([...set].sort());
  return Object.freeze(
    [...groups.values()]
      .sort((a, b) => compareRational(a.t, b.t))
      .map((e) =>
        Object.freeze({
          t: e.t,
          enteringCells: sorted(e.enteringCells),
          exitingCells: sorted(e.exitingCells),
          isolatedVertexCells: sorted(e.isolatedVertexCells),
          edgePoints: sorted(e.edgePoints),
          overlapStarts: sorted(e.overlapStarts),
          overlapEnds: sorted(e.overlapEnds),
        }),
      ),
  );
}
