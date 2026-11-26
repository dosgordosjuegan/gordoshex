import { clipCell, type CellHit } from './clipping.js';
import {
  candidateCoordinates,
  preflight,
  type ResourceLimitFailure,
} from './candidates.js';
import type { Sightline } from './sightline.js';
export interface CompleteCells {
  readonly status: 'complete';
  readonly degenerate: boolean;
  readonly line: Sightline;
  readonly candidateCount: bigint;
  readonly cells: readonly CellHit[];
}
/** Explicit budgets keep callers in control. Recommended defaults are documented after benchmarking. */
export function enumerateCells(
  line: Sightline,
  maxCandidates: bigint,
): CompleteCells | ResourceLimitFailure {
  const plan = preflight(line, maxCandidates);
  if (plan.status === 'resource-limit') return plan;
  if (line.degenerate) {
    const hit = clipCell(line, line.origin);
    if (hit.kind !== 'degenerate-point')
      throw new Error('Invalid degenerate point');
    return Object.freeze({
      status: 'complete',
      degenerate: true,
      line,
      candidateCount: plan.candidateCount,
      cells: Object.freeze([hit]),
    });
  }
  const cells: CellHit[] = [];
  for (const cell of candidateCoordinates(plan.bounds)) {
    const hit = clipCell(line, cell);
    if (hit.kind !== 'none') cells.push(hit);
  }
  return Object.freeze({
    status: 'complete',
    degenerate: line.degenerate,
    line,
    candidateCount: plan.candidateCount,
    cells: Object.freeze(cells),
  });
}
