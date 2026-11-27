import {
  DEFAULT_MAX_CANDIDATES,
  candidateCount,
  coordinateKey,
  sightline,
} from '../src/index.js';
import {
  evaluateVisibility,
  BUILTIN_RULESETS,
  type VisibilityResult,
} from '../src/application.js';
import { MAX_BATCH_CANDIDATES, MAX_CELLS } from './limits.js';
import type { AppState } from './state.js';
export type Batch =
  | {
      readonly status: 'complete';
      readonly results: ReadonlyMap<string, VisibilityResult>;
      readonly candidates: bigint;
      readonly milliseconds: number;
    }
  | { readonly status: 'unavailable'; readonly reason: string };
export function evaluateBoard(
  state: AppState,
  maxCandidates = DEFAULT_MAX_CANDIDATES,
): Batch {
  if (!state.origin || !state.board.hasCell(state.origin))
    return { status: 'unavailable', reason: 'batch.observer' };
  if (BigInt(state.board.cells.length) > MAX_CELLS)
    return { status: 'unavailable', reason: 'limit.cells' };
  let candidates = 0n;
  for (const cell of state.board.cells) {
    candidates += candidateCount(sightline(state.origin, cell.coordinate));
    if (candidates > MAX_BATCH_CANDIDATES)
      return { status: 'unavailable', reason: 'limit.batch' };
  }
  const results = new Map<string, VisibilityResult>(),
    start = performance.now();
  for (const cell of state.board.cells)
    results.set(
      coordinateKey(cell.coordinate),
      evaluateVisibility(
        {
          board: state.board,
          origin: state.origin,
          target: cell.coordinate,
          range: state.range,
          ruleset: { id: state.rulesetId, version: '1', configuration: {} },
          maxCandidates,
        },
        BUILTIN_RULESETS,
      ),
    );
  return {
    status: 'complete',
    results,
    candidates,
    milliseconds: performance.now() - start,
  };
}
export type CellStyle =
  | 'pending'
  | 'visible'
  | 'blocked'
  | 'out-of-range'
  | 'rule-invalid'
  | 'failed'
  | 'invalid-query'
  | 'unsupported';
export function presentation(result: VisibilityResult | undefined): CellStyle {
  if (!result) return 'pending';
  if (result.status === 'evaluation-failure') return 'failed';
  if (result.status === 'invalid-query-input') return 'invalid-query';
  if (result.status === 'unsupported-ruleset-or-configuration')
    return 'unsupported';
  if (result.status !== 'evaluated') return 'invalid-query';
  if (result.los.status === 'invalid-under-ruleset') return 'rule-invalid';
  if (result.range.status === 'out-of-range') return 'out-of-range';
  return result.los.status === 'blocked' ? 'blocked' : 'visible';
}
export function blockerKeys(
  result: VisibilityResult | undefined,
): ReadonlySet<string> {
  return new Set(
    result?.status === 'evaluated'
      ? result.los.evidence
          .filter((e) => e.effect === 'blocking' && e.location.kind === 'cell')
          .map((e) =>
            e.location.kind === 'cell'
              ? coordinateKey(e.location.coordinate)
              : '',
          )
      : [],
  );
}
