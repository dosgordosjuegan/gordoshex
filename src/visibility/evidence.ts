import { boardCoordinate, boardEdgeId } from '../board/model.js';
import { equalCoordinates } from '../geometry/coordinates.js';
import { compareRational, type Rational } from '../geometry/rational.js';
import {
  message,
  type Evidence,
  type LosDecision,
  type RangeDecision,
  type RulesetContext,
} from '../rulesets/contracts.js';
export function snapshotRange(decision: RangeDecision): RangeDecision {
  if (!['in-range', 'out-of-range'].includes(decision.status))
    throw new Error('Invalid range decision');
  return Object.freeze({
    status: decision.status,
    explanations: Object.freeze(
      decision.explanations.map((m) => message(m.code, m.arguments)),
    ),
  });
}
export function snapshotLos(
  decision: LosDecision,
  context: RulesetContext,
): LosDecision {
  if (!['clear', 'blocked', 'invalid-under-ruleset'].includes(decision.status))
    throw new Error('Invalid LOS decision');
  const evidence = decision.evidence.map((e): Evidence => {
    if (
      !['blocking', 'invalidating', 'transparent', 'ignored'].includes(e.effect)
    )
      throw new Error('Invalid evidence effect');
    const reason = message(e.reason.code, e.reason.arguments);
    if (e.location.kind === 'cell') {
      const coordinate = boardCoordinate(e.location.coordinate),
        cell = context.board.cellAt(coordinate);
      if (
        !context.geometry.cells.some(
          (c) => c === e.contact && equalCoordinates(c.cell, coordinate),
        ) ||
        e.location.absent !== (cell === undefined)
      )
        throw new Error('Invalid cell evidence');
      const elementId = e.location.elementId;
      if (
        elementId !== undefined &&
        !cell?.elements.some((item) => item.id === elementId)
      )
        throw new Error('Invalid element evidence');
      return Object.freeze({
        effect: e.effect,
        contact: e.contact,
        reason,
        location: Object.freeze({
          kind: 'cell',
          coordinate,
          absent: e.location.absent,
          ...(e.location.elementId === undefined
            ? {}
            : { elementId: e.location.elementId }),
        }),
      });
    }
    if (e.location.kind !== 'edge')
      throw new Error('Invalid evidence location');
    const edge = boardEdgeId(e.location.edge);
    if (
      !context.geometry.edges.some(
        (c) => c === e.contact && c.edge.id.key === edge.key,
      )
    )
      throw new Error('Invalid edge evidence');
    const featureId = e.location.featureId;
    if (
      featureId !== undefined &&
      !context.board.featuresAt(edge).some((item) => item.id === featureId)
    )
      throw new Error('Invalid feature evidence');
    return Object.freeze({
      effect: e.effect,
      contact: e.contact,
      reason,
      location: Object.freeze({
        kind: 'edge',
        edge,
        ...(e.location.featureId === undefined
          ? {}
          : { featureId: e.location.featureId }),
      }),
    });
  });
  if (
    decision.status === 'clear' &&
    evidence.some((e) => e.effect === 'blocking' || e.effect === 'invalidating')
  )
    throw new Error('Contradictory clear decision');
  if (
    decision.status === 'blocked' &&
    !evidence.some((e) => e.effect === 'blocking')
  )
    throw new Error('Missing blocker evidence');
  if (
    decision.status === 'invalid-under-ruleset' &&
    !evidence.some((e) => e.effect === 'invalidating') &&
    decision.explanations.length === 0
  )
    throw new Error('Missing invalidity reason');
  return Object.freeze({
    status: decision.status,
    evidence: Object.freeze(evidence),
    explanations: Object.freeze(
      decision.explanations.map((m) => message(m.code, m.arguments)),
    ),
  });
}
export interface EvidenceEvent {
  readonly t: Rational;
  readonly evidence: readonly Evidence[];
}
export function evidenceEvents(
  context: RulesetContext,
  evidence: readonly Evidence[],
): readonly EvidenceEvent[] {
  return Object.freeze(
    context.geometry.events
      .map((event) =>
        Object.freeze({
          t: event.t,
          evidence: Object.freeze(
            evidence.filter(
              (e) =>
                compareRational(e.contact.entry, event.t) <= 0 &&
                compareRational(e.contact.exit, event.t) >= 0,
            ),
          ),
        }),
      )
      .filter((event) => event.evidence.length > 0),
  );
}
