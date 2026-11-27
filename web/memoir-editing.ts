import type { Axial } from '../src/index.js';
import {
  addElement,
  removeElement,
  memoir44Cell,
  validateMemoir44Board,
  MEMOIR44_REFRESH2025,
  type Memoir44Terrain,
  type Memoir44Installation,
  type Memoir44UnitType,
  type BoardEntity,
} from '../src/application.js';
import type { AppState } from './state.js';
import { MAX_ELEMENTS_PER_CELL } from './limits.js';
export type Affiliation = 'allies' | 'axis';
export type MemoirBrush =
  | { readonly kind: 'terrain'; readonly type: Memoir44Terrain }
  | {
      readonly kind: 'unit';
      readonly type: Memoir44UnitType;
      readonly side: Affiliation;
    }
  | {
      readonly kind: 'installation' | 'remove-installation';
      readonly type: Memoir44Installation;
    }
  | { readonly kind: 'remove-terrain' }
  | { readonly kind: 'remove-unit' };
export const memoirMode = (state: Pick<AppState, 'rulesetId'>): boolean =>
  state.rulesetId === MEMOIR44_REFRESH2025.id;
/** Edits semantic roles only; all LOS/range interpretation stays in the adapter. */
export function paintMemoir(
  state: AppState,
  coordinate: Axial,
  brush: MemoirBrush = state.brush,
): AppState {
  if (!memoirMode(state)) throw new Error('input.memoir-mode');
  const cell = state.board.cellAt(coordinate);
  if (!cell) throw new Error('input.absent');
  const data = memoir44Cell(cell);
  const old =
    brush.kind === 'terrain' || brush.kind === 'remove-terrain'
      ? data.terrainEntity
      : brush.kind === 'unit' || brush.kind === 'remove-unit'
        ? data.unit?.entity
        : data.installations.find((i) => i.type === brush.type)?.entity;
  const removing =
    brush.kind === 'remove-terrain' ||
    brush.kind === 'remove-unit' ||
    brush.kind === 'remove-installation';
  if (removing && !old) return state;
  let entity: BoardEntity | null = null;
  if (brush.kind === 'terrain')
    entity = {
      id: `memoir-${state.nextId}`,
      kind: 'memoir44.terrain',
      properties: { type: brush.type },
    };
  else if (brush.kind === 'unit')
    entity = {
      id: `memoir-${state.nextId}`,
      kind: 'memoir44.unit',
      properties: { type: brush.type, side: brush.side, variant: 'standard' },
    };
  else if (brush.kind === 'installation')
    entity = {
      id: `memoir-${state.nextId}`,
      kind: 'memoir44.obstacle',
      properties: { type: brush.type },
    };
  if (
    old &&
    entity &&
    Object.keys(old.properties).length ===
      Object.keys(entity.properties).length &&
    Object.keys(entity.properties).every(
      (key) => old.properties[key] === entity.properties[key],
    )
  )
    return state;
  if (!old && entity && cell.elements.length >= MAX_ELEMENTS_PER_CELL)
    throw new Error('limit.stack');
  const index = old
    ? cell.elements.findIndex((e) => e.id === old.id)
    : cell.elements.length;
  let board = old
    ? removeElement(state.board, coordinate, old.id)
    : state.board;
  if (entity) board = addElement(board, coordinate, entity, index);
  const issues = validateMemoir44Board(board);
  if (issues.length)
    throw new Error(issues[0]?.code ?? 'memoir44.invalid-payload');
  return { ...state, board, nextId: entity ? state.nextId + 1 : state.nextId };
}
