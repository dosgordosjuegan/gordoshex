import { equalCoordinates } from '../../geometry/coordinates.js';
import { compareRational } from '../../geometry/rational.js';
import type { CellHit } from '../../geometry/clipping.js';
import type { BoardEntity } from '../../board/model.js';
import {
  cellEvidence,
  message,
  type Evidence,
  type LosDecision,
  type RangeDecision,
  type Ruleset,
  type RulesetContext,
  type RulesetQuery,
  type SemanticMessage,
} from '../contracts.js';
import {
  memoir44Cell,
  MEMOIR44_MAX_RANGE,
  validateMemoir44Board,
  type Memoir44Unit,
} from './entities.js';
function observer(query: RulesetQuery): Memoir44Unit | null {
  const cell = query.board.cellAt(query.origin);
  return cell ? memoir44Cell(cell).unit : null;
}
function range(context: RulesetContext): RangeDecision {
  const unit = observer(context);
  if (!unit) throw new Error('Observer validation was skipped');
  const intrinsic = MEMOIR44_MAX_RANGE[unit.type],
    cap = context.range.kind === 'radius' ? context.range.radius : null;
  const effective = cap !== null && cap < intrinsic ? cap : intrinsic;
  return Object.freeze({
    status: context.distance <= effective ? 'in-range' : 'out-of-range',
    explanations: Object.freeze([
      message('memoir44.intrinsic-range', {
        unitType: unit.type,
        intrinsicMaximum: intrinsic.toString(),
        userCap: cap === null ? 'unlimited' : cap.toString(),
        effectiveMaximum: effective.toString(),
        distance: context.distance.toString(),
      }),
    ]),
  });
}
interface EligibleObstruction {
  readonly contact: CellHit;
  readonly entity: BoardEntity;
}
function lineOfSight(context: RulesetContext): LosDecision {
  const unit = observer(context);
  if (!unit) throw new Error('Observer validation was skipped');
  const a = context.board.cellAt(context.origin),
    b = context.board.cellAt(context.target);
  if (!a || !b) throw new Error('Missing validated endpoint');
  const heightA = memoir44Cell(a).height,
    heightB = memoir44Cell(b).height,
    minimum = heightA < heightB ? heightA : heightB;
  const evidence: Evidence[] = [],
    eligible: EligibleObstruction[] = [],
    explanations: SemanticMessage[] = [
      message('memoir44.inspection-not-attack'),
    ];
  if (unit.type === 'artillery')
    explanations.push(
      message('memoir44.artillery-los-not-required', {
        physicalLosPreserved: true,
        ordinaryAttacksOnly: true,
      }),
    );
  if (context.geometry.degenerate)
    explanations.push(message('memoir44.self-inspection'));
  for (const cell of context.cells) {
    const contact = cell.contact;
    if (cell.membership === 'absent') {
      const positive = compareRational(contact.entry, contact.exit) < 0;
      evidence.push(
        cellEvidence(
          contact,
          true,
          positive ? 'invalidating' : 'ignored',
          positive
            ? 'memoir44.absent-positive-contact'
            : 'memoir44.absent-vertex-ignored',
        ),
      );
      continue;
    }
    const boardCell = context.board.cellAt(contact.cell);
    if (!boardCell) throw new Error('Inconsistent board membership');
    const data = memoir44Cell(boardCell),
      endpoint =
        equalCoordinates(contact.cell, context.origin) ||
        equalCoordinates(contact.cell, context.target);
    const consider = (
      entity: BoardEntity,
      blocks: boolean,
      bareHill = false,
    ): void => {
      if (endpoint) {
        evidence.push(
          cellEvidence(
            contact,
            false,
            'ignored',
            'memoir44.endpoint-exempt',
            entity.id,
          ),
        );
        return;
      }
      if (!blocks) {
        evidence.push(
          cellEvidence(
            contact,
            false,
            'transparent',
            'memoir44.nonblocking-element',
            entity.id,
          ),
        );
        return;
      }
      if (bareHill && heightA >= 1n && heightB >= 1n) {
        evidence.push(
          cellEvidence(
            contact,
            false,
            'ignored',
            'memoir44.bare-hill-exempt',
            entity.id,
          ),
        );
        return;
      }
      if (!bareHill && data.height < minimum) {
        evidence.push(
          cellEvidence(
            contact,
            false,
            'ignored',
            'memoir44.lower-obstruction-exempt',
            entity.id,
          ),
        );
        return;
      }
      if (contact.kind === 'degenerate-point')
        throw new Error('Non-endpoint degenerate obstruction');
      if (contact.kind !== 'interior' && contact.side === 0)
        throw new Error('Boundary obstruction cannot have zero side');
      eligible.push({ contact, entity });
    };
    if (data.terrainEntity)
      consider(
        data.terrainEntity,
        ['forest', 'hedgerow', 'town', 'church', 'hill'].includes(data.terrain),
        data.terrain === 'hill',
      );
    for (const installation of data.installations)
      consider(installation.entity, installation.type === 'bunker');
    if (data.unit) consider(data.unit.entity, true);
  }
  const interior = eligible.filter((e) => e.contact.kind === 'interior'),
    boundary = eligible.filter((e) => e.contact.kind !== 'interior');
  const positive = boundary.filter((e) => e.contact.side === 1),
    negative = boundary.filter((e) => e.contact.side === -1),
    paired = positive.length > 0 && negative.length > 0;
  for (const e of eligible) {
    const decisive = e.contact.kind === 'interior',
      blocks = decisive || paired;
    const code = decisive
      ? 'memoir44.interior-obstruction'
      : !paired
        ? 'memoir44.one-sided-boundary'
        : e.contact.kind === 'isolated-vertex'
          ? 'memoir44.sided-vertex-obstruction'
          : 'memoir44.sided-edge-obstruction';
    evidence.push(
      cellEvidence(
        e.contact,
        false,
        blocks ? 'blocking' : 'ignored',
        code,
        e.entity.id,
      ),
    );
  }
  if (paired)
    explanations.push(
      message('memoir44.opposite-boundary-obstructions', {
        positiveIds: positive.map((e) => e.entity.id),
        negativeIds: negative.map((e) => e.entity.id),
      }),
    );
  if (boundary.some((e) => e.contact.kind === 'isolated-vertex'))
    explanations.push(
      message('memoir44.vertex-modeling-convention', {
        policy: 'global-sided-contact',
      }),
    );
  const physicalBlocked = interior.length > 0 || paired,
    invalid = evidence.some((e) => e.effect === 'invalidating');
  explanations.push(
    message('memoir44.physical-los', {
      blocked: physicalBlocked,
      invalidatingMembership: invalid,
    }),
  );
  return Object.freeze({
    status: invalid
      ? 'invalid-under-ruleset'
      : physicalBlocked
        ? 'blocked'
        : 'clear',
    evidence: Object.freeze(evidence),
    explanations: Object.freeze(explanations),
  });
}
export const MEMOIR44_REFRESH2025: Ruleset = Object.freeze<Ruleset>({
  id: 'memoir44.refresh2025',
  version: '1',
  validateConfiguration: (configuration) =>
    Object.keys(configuration).length === 0
      ? Object.freeze({ status: 'accepted' })
      : Object.freeze({
          status: 'unsupported',
          explanations: Object.freeze([
            message('memoir44.unsupported-configuration'),
          ]),
        }),
  validateBoard: validateMemoir44Board,
  validateQuery: (query) =>
    observer(query)
      ? Object.freeze([])
      : Object.freeze([message('memoir44.observer-unit-required')]),
  evaluateRange: range,
  evaluateLineOfSight: lineOfSight,
});
