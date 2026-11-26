import {
  axial,
  coordinateKey,
  equalCoordinates,
  type Axial,
} from '../../src/index.js';
import {
  BoardSnapshot,
  evaluateVisibility,
  type BoardEntity,
  type EvaluatedVisibility,
  type Memoir44Terrain,
  type Memoir44UnitType,
  type Range,
  type VisibilityResult,
} from '../../src/application.js';
export const ORIGIN = axial(0n, 0n);
export const REFERENCE = Object.freeze({
  id: 'memoir44.refresh2025',
  version: '1',
  configuration: Object.freeze({}),
});
export const terrain = (
  q: bigint,
  r: bigint,
  type: Memoir44Terrain,
): Placement => ({
  coordinate: axial(q, r),
  entity: {
    id: `terrain:${q},${r}`,
    kind: 'memoir44.terrain',
    properties: { type },
  },
});
export const installation = (
  q: bigint,
  r: bigint,
  type: string,
): Placement => ({
  coordinate: axial(q, r),
  entity: {
    id: `installation:${type}:${q},${r}`,
    kind: 'memoir44.obstacle',
    properties: { type },
  },
});
export const unit = (
  id: string,
  type: Memoir44UnitType = 'infantry',
  side = 'allies',
): BoardEntity => ({
  id,
  kind: 'memoir44.unit',
  properties: { type, side, variant: 'standard' },
});
export const occupyingUnit = (
  q: bigint,
  r: bigint,
  type: Memoir44UnitType = 'infantry',
  side = 'allies',
): Placement => ({
  coordinate: axial(q, r),
  entity: unit(`unit:${q},${r}`, type, side),
});
export interface Placement {
  readonly coordinate: Axial;
  readonly entity: BoardEntity;
}
export interface Setup {
  readonly target: Axial;
  readonly placements?: readonly Placement[];
  readonly absent?: readonly Axial[];
  readonly observer?: Memoir44UnitType | null;
  readonly targetUnit?: Memoir44UnitType | null;
}
/** Independent axial box supplies membership; geometry is never used to choose board cells or expected decisions. */
export function makeBoard(setup: Setup): BoardSnapshot {
  const { target } = setup,
    qLow = target.q < 0n ? target.q : 0n,
    qHigh = target.q > 0n ? target.q : 0n,
    rLow = target.r < 0n ? target.r : 0n,
    rHigh = target.r > 0n ? target.r : 0n;
  const cells = new Map<
    string,
    { coordinate: Axial; elements: BoardEntity[] }
  >();
  for (let q = qLow - 1n; q <= qHigh + 1n; q++)
    for (let r = rLow - 1n; r <= rHigh + 1n; r++) {
      const coordinate = axial(q, r);
      if (!setup.absent?.some((a) => equalCoordinates(a, coordinate)))
        cells.set(coordinateKey(coordinate), { coordinate, elements: [] });
    }
  const add = (coordinate: Axial, entity: BoardEntity): void => {
    const key = coordinateKey(coordinate),
      cell = cells.get(key);
    if (!cell) throw new Error('Placement on absent fixture cell');
    cell.elements.push(entity);
  };
  if (setup.observer !== null)
    add(ORIGIN, unit('origin-unit', setup.observer ?? 'infantry'));
  if (!equalCoordinates(target, ORIGIN) && setup.targetUnit !== null)
    add(target, unit('target-unit', setup.targetUnit ?? 'infantry', 'axis'));
  for (const p of setup.placements ?? []) add(p.coordinate, p.entity);
  return new BoardSnapshot([...cells.values()]);
}
export function evaluate(
  board: BoardSnapshot,
  target: Axial,
  range: Range = { kind: 'unlimited' },
  origin = ORIGIN,
): VisibilityResult {
  return evaluateVisibility({
    board,
    origin,
    target,
    range,
    ruleset: REFERENCE,
    maxCandidates: 10000n,
  });
}
export function completed(
  board: BoardSnapshot,
  target: Axial,
  range: Range = { kind: 'unlimited' },
  origin = ORIGIN,
): EvaluatedVisibility {
  const result = evaluate(board, target, range, origin);
  if (result.status !== 'evaluated')
    throw new Error(`Unexpected ${result.status}`);
  return result;
}
export const blockerIds = (result: EvaluatedVisibility): string[] =>
  result.los.evidence
    .filter((e) => e.effect === 'blocking')
    .map((e) =>
      e.location.kind === 'cell'
        ? (e.location.elementId ?? 'missing-id')
        : 'edge',
    )
    .sort();
