import { type Axial, compareCoordinates, DIRECTIONS } from './coordinates.js';
import { enumerateCells, type CompleteCells } from './enumeration.js';
import type { ResourceLimitFailure } from './candidates.js';
import {
  intersectEdge,
  localEdge,
  type EdgeHit,
  type EdgeId,
} from './edges.js';
import { groupEvents, type GeometryEvent } from './events.js';
import { sightline } from './sightline.js';
export interface CompleteGeometry extends CompleteCells {
  readonly edges: readonly EdgeHit[];
  readonly events: readonly GeometryEvent[];
}
/** Measured M1 per-query default; see docs/performance.md. Callers may override it. */
export const DEFAULT_MAX_CANDIDATES = 1000n;
export function traceSightline(
  origin: Axial,
  target: Axial,
  maxCandidates: bigint = DEFAULT_MAX_CANDIDATES,
): CompleteGeometry | ResourceLimitFailure {
  const result = enumerateCells(sightline(origin, target), maxCandidates);
  if (result.status === 'resource-limit') return result;
  const ids = new Map<string, EdgeId>();
  if (!result.line.degenerate)
    for (const cell of result.cells)
      for (const d of DIRECTIONS) {
        const id = localEdge(cell.cell, d);
        ids.set(id.key, id);
      }
  const edges: EdgeHit[] = [];
  for (const id of ids.values()) {
    const hit = intersectEdge(result.line, id);
    if (hit.kind !== 'none') edges.push(hit);
  }
  edges.sort(
    (a, b) =>
      compareCoordinates(a.edge.id.first, b.edge.id.first) ||
      compareCoordinates(a.edge.id.second, b.edge.id.second),
  );
  return Object.freeze({
    ...result,
    edges: Object.freeze(edges),
    events: groupEvents(result.cells, edges, result.line.degenerate),
  });
}
