import type { BoardSnapshot, BoardEntity } from '../board/model.js';
import { boardCoordinate } from '../board/model.js';
import type { Axial } from '../geometry/coordinates.js';
import type { CellHit } from '../geometry/clipping.js';
import type { EdgeHit, EdgeId } from '../geometry/edges.js';
import type { CompleteGeometry } from '../geometry/query.js';
import { jsonObject, type JsonObject } from '../data/json.js';
import { fields, InputError, text } from '../data/validation.js';
export interface SemanticMessage {
  readonly code: string;
  readonly arguments: JsonObject;
}
export const message = (code: string, args: JsonObject = {}): SemanticMessage =>
  Object.freeze({ code: text(code), arguments: jsonObject(args) });
export type Range =
  | { readonly kind: 'unlimited' }
  | { readonly kind: 'radius'; readonly radius: bigint };
export function rangeValue(input: unknown): Range {
  const v = fields(input, ['kind'], ['radius']);
  if (v.kind === 'unlimited') {
    fields(v, ['kind']);
    return Object.freeze({ kind: 'unlimited' });
  }
  if (v.kind !== 'radius' || typeof v.radius !== 'bigint' || v.radius < 0n)
    throw new InputError('invalid-range');
  return Object.freeze({ kind: 'radius', radius: v.radius });
}
export interface RulesetReference {
  readonly id: string;
  readonly version: string;
  readonly configuration: JsonObject;
}
export function rulesetReference(input: unknown): RulesetReference {
  const v = fields(input, ['id', 'version', 'configuration']);
  return Object.freeze({
    id: text(v.id),
    version: text(v.version),
    configuration: jsonObject(v.configuration),
  });
}
export interface CellContext {
  readonly contact: CellHit;
  readonly membership: 'present' | 'absent';
  readonly elements: readonly BoardEntity[];
}
export interface EdgeContext {
  readonly contact: EdgeHit;
  readonly features: readonly BoardEntity[];
}
export interface RulesetContext {
  readonly board: BoardSnapshot;
  readonly origin: Axial;
  readonly target: Axial;
  readonly distance: bigint;
  readonly range: Range;
  readonly ruleset: RulesetReference;
  readonly geometry: CompleteGeometry;
  readonly cells: readonly CellContext[];
  readonly edges: readonly EdgeContext[];
}
export type EvidenceLocation =
  | {
      readonly kind: 'cell';
      readonly coordinate: Axial;
      readonly absent: boolean;
      readonly elementId?: string;
    }
  | {
      readonly kind: 'edge';
      readonly edge: EdgeId;
      readonly featureId?: string;
    };
export interface Evidence {
  readonly effect: 'blocking' | 'invalidating' | 'transparent' | 'ignored';
  readonly location: EvidenceLocation;
  readonly contact: CellHit | EdgeHit;
  readonly reason: SemanticMessage;
}
export function cellEvidence(
  contact: CellHit,
  absent: boolean,
  effect: Evidence['effect'],
  code: string,
  elementId?: string,
): Evidence {
  return Object.freeze({
    effect,
    contact,
    reason: message(code),
    location: Object.freeze({
      kind: 'cell',
      coordinate: boardCoordinate(contact.cell),
      absent,
      ...(elementId === undefined ? {} : { elementId: text(elementId) }),
    }),
  });
}
export function edgeEvidence(
  contact: EdgeHit,
  effect: Evidence['effect'],
  code: string,
  featureId?: string,
): Evidence {
  return Object.freeze({
    effect,
    contact,
    reason: message(code),
    location: Object.freeze({
      kind: 'edge',
      edge: contact.edge.id,
      ...(featureId === undefined ? {} : { featureId: text(featureId) }),
    }),
  });
}
export interface RangeDecision {
  readonly status: 'in-range' | 'out-of-range';
  readonly explanations: readonly SemanticMessage[];
}
export interface LosDecision {
  readonly status: 'clear' | 'blocked' | 'invalid-under-ruleset';
  readonly explanations: readonly SemanticMessage[];
  readonly evidence: readonly Evidence[];
}
export type ConfigurationDecision =
  | { readonly status: 'accepted' }
  | {
      readonly status: 'invalid' | 'unsupported';
      readonly explanations: readonly SemanticMessage[];
    };
export type RulesetQuery = Pick<
  RulesetContext,
  'board' | 'origin' | 'target' | 'range' | 'ruleset'
>;
export interface Ruleset {
  readonly id: string;
  readonly version: string;
  validateConfiguration(configuration: JsonObject): ConfigurationDecision;
  validateBoard(
    board: BoardSnapshot,
    configuration: JsonObject,
  ): readonly SemanticMessage[];
  /** Selected-query validation, before geometry; scenarios have no selected observer. */
  validateQuery?(query: RulesetQuery): readonly SemanticMessage[];
  evaluateRange(context: RulesetContext): RangeDecision;
  evaluateLineOfSight(context: RulesetContext): LosDecision;
}
export const inclusiveRange = (context: RulesetContext): RangeDecision =>
  Object.freeze({
    status:
      context.range.kind === 'unlimited' ||
      context.distance <= context.range.radius
        ? 'in-range'
        : 'out-of-range',
    explanations: Object.freeze([
      message(
        context.range.kind === 'unlimited'
          ? 'range.unlimited'
          : 'range.inclusive-lattice',
        {
          distance: context.distance.toString(),
          ...(context.range.kind === 'radius'
            ? { radius: context.range.radius.toString() }
            : {}),
        },
      ),
    ]),
  });
