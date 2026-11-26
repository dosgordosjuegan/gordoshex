import { BoardSnapshot, boardCoordinate } from '../board/model.js';
import { distance, type Axial } from '../geometry/coordinates.js';
import { DEFAULT_MAX_CANDIDATES, traceSightline } from '../geometry/query.js';
import { fields, InputError } from '../data/validation.js';
import { GENERIC_RULESETS } from '../rulesets/generic.js';
import { resolveRuleset } from '../rulesets/resolve.js';
import {
  message,
  rangeValue,
  rulesetReference,
  type LosDecision,
  type Range,
  type RangeDecision,
  type Ruleset,
  type RulesetContext,
  type RulesetReference,
  type SemanticMessage,
} from '../rulesets/contracts.js';
import {
  evidenceEvents,
  snapshotLos,
  snapshotRange,
  type EvidenceEvent,
} from './evidence.js';
export interface VisibilityQuery {
  readonly board: BoardSnapshot;
  readonly origin: Axial;
  readonly target: Axial;
  readonly range: Range;
  readonly ruleset: RulesetReference;
  readonly maxCandidates?: bigint;
}
export interface EvaluatedVisibility {
  readonly status: 'evaluated';
  readonly context: RulesetContext;
  readonly range: RangeDecision;
  readonly los: LosDecision;
  readonly visibility:
    | { readonly status: 'applicable'; readonly visible: boolean }
    | { readonly status: 'not-applicable' };
  readonly evidenceEvents: readonly EvidenceEvent[];
}
export type VisibilityResult =
  | EvaluatedVisibility
  | {
      readonly status:
        'invalid-query-input' | 'unsupported-ruleset-or-configuration';
      readonly explanations: readonly SemanticMessage[];
    }
  | {
      readonly status: 'evaluation-failure';
      readonly cause: 'resource-limit';
      readonly candidateCount: bigint;
      readonly maxCandidates: bigint;
    }
  | {
      readonly status: 'evaluation-failure';
      readonly cause: 'internal-error';
      readonly explanations: readonly SemanticMessage[];
    };
function queryValue(value: unknown): VisibilityQuery {
  const v = fields(
    value,
    ['board', 'origin', 'target', 'range', 'ruleset'],
    ['maxCandidates'],
  );
  if (!(v.board instanceof BoardSnapshot))
    throw new InputError('invalid-board-snapshot');
  const origin = boardCoordinate(v.origin),
    target = boardCoordinate(v.target);
  if (!v.board.hasCell(origin) || !v.board.hasCell(target))
    throw new InputError('missing-endpoint-cell');
  const maxCandidates = Object.hasOwn(v, 'maxCandidates')
    ? v.maxCandidates
    : DEFAULT_MAX_CANDIDATES;
  if (typeof maxCandidates !== 'bigint' || maxCandidates < 0n)
    throw new InputError('invalid-candidate-limit');
  return Object.freeze({
    board: v.board,
    origin,
    target,
    range: rangeValue(v.range),
    ruleset: rulesetReference(v.ruleset),
    maxCandidates,
  });
}
function internalFailure(): VisibilityResult {
  return Object.freeze({
    status: 'evaluation-failure',
    cause: 'internal-error',
    explanations: Object.freeze([message('evaluation.internal-error')]),
  });
}
export function evaluateVisibility(
  input: unknown,
  collection: readonly Ruleset[] = GENERIC_RULESETS,
): VisibilityResult {
  let query: VisibilityQuery;
  try {
    query = queryValue(input);
  } catch (error) {
    if (!(error instanceof InputError)) return internalFailure();
    return Object.freeze({
      status: 'invalid-query-input',
      explanations: Object.freeze([message(error.code)]),
    });
  }
  try {
    const resolved = resolveRuleset(query.ruleset, query.board, collection);
    if (resolved.status !== 'supported') return resolved;
    const geometry = traceSightline(
      query.origin,
      query.target,
      query.maxCandidates,
    );
    if (geometry.status === 'resource-limit')
      return Object.freeze({
        status: 'evaluation-failure',
        cause: 'resource-limit',
        candidateCount: geometry.candidateCount,
        maxCandidates: geometry.maxCandidates,
      });
    const context: RulesetContext = Object.freeze({
      board: query.board,
      origin: query.origin,
      target: query.target,
      distance: distance(query.origin, query.target),
      range: query.range,
      ruleset: query.ruleset,
      geometry,
      cells: Object.freeze(
        geometry.cells.map((contact) =>
          Object.freeze({
            contact,
            membership: query.board.hasCell(contact.cell)
              ? ('present' as const)
              : ('absent' as const),
            elements:
              query.board.cellAt(contact.cell)?.elements ?? Object.freeze([]),
          }),
        ),
      ),
      edges: Object.freeze(
        geometry.edges.map((contact) =>
          Object.freeze({
            contact,
            features: query.board.featuresAt(contact.edge.id),
          }),
        ),
      ),
    });
    // Neither result short-circuits the other; only failures prevent a completed result.
    const range = snapshotRange(resolved.ruleset.evaluateRange(context));
    const los = snapshotLos(
      resolved.ruleset.evaluateLineOfSight(context),
      context,
    );
    return Object.freeze({
      status: 'evaluated',
      context,
      range,
      los,
      visibility:
        los.status === 'invalid-under-ruleset'
          ? Object.freeze({ status: 'not-applicable' })
          : Object.freeze({
              status: 'applicable',
              visible: range.status === 'in-range' && los.status === 'clear',
            }),
      evidenceEvents: evidenceEvents(context, los.evidence),
    });
  } catch {
    return internalFailure();
  }
}
