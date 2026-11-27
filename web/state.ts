import {
  axial,
  coordinateKey,
  equalCoordinates,
  type Axial,
  type EdgeId,
} from '../src/index.js';
import {
  addCell,
  removeCell,
  addElement,
  removeElement,
  reorderElements,
  addEdgeFeature,
  removeEdgeFeature,
  rectangle,
  BUILTIN_RULESETS,
  type BoardSnapshot,
  type Range,
  type RectangleLayout,
} from '../src/application.js';
import {
  memoirMode,
  paintMemoir,
  type MemoirBrush,
  type Affiliation,
} from './memoir-editing.js';
import {
  dimensions,
  MAX_CELLS,
  MAX_ELEMENTS_PER_CELL,
  MAX_EDGE_FEATURES,
} from './limits.js';
export type Mode =
  | 'inspect'
  | 'observer'
  | 'add-cell'
  | 'remove-cell'
  | 'add-obstacle'
  | 'remove-obstacle'
  | 'edge'
  | 'paint';
export interface AppState {
  readonly showCoordinates: boolean;
  readonly paletteTab: 'terrain' | 'unit' | 'installation';
  readonly brush: MemoirBrush;
  readonly affiliation: Affiliation;
  readonly board: BoardSnapshot;
  readonly origin: Axial | null;
  readonly target: Axial | null;
  readonly inspected: Axial | null;
  readonly mode: Mode;
  readonly orientation: 'pointy' | 'flat';
  readonly rulesetId: string;
  readonly range: Range;
  readonly nextId: number;
}
export function generate(
  state: AppState,
  width: string,
  height: string,
  layout: RectangleLayout,
): AppState {
  const [w, h] = dimensions(width, height),
    board = rectangle(w, h, axial(0n, 0n), layout);
  return {
    ...state,
    board,
    origin: board.cells[0]?.coordinate ?? null,
    target: null,
    inspected: null,
  };
}
export function initialState(): AppState {
  const board = addElement(
    rectangle(13n, 9n, axial(0n, 0n), 'pointy-odd-row'),
    axial(1n, 0n),
    { id: 'element-1', kind: 'obstacle', properties: {} },
  );
  return {
    board,
    brush: { kind: 'terrain', type: 'forest' },
    affiliation: 'allies',
    paletteTab: 'terrain',
    showCoordinates: true,
    origin: axial(0n, 0n),
    target: axial(2n, 0n),
    inspected: axial(2n, 0n),
    mode: 'inspect',
    orientation: 'pointy',
    rulesetId: 'generic.interior-only',
    range: { kind: 'unlimited' },
    nextId: 2,
  };
}
export function setRange(state: AppState, range: Range): AppState {
  if (range.kind === 'radius' && range.radius < 0n)
    throw new Error('input.range');
  return { ...state, range };
}
export function setRuleset(state: AppState, id: string): AppState {
  if (!BUILTIN_RULESETS.some((r) => r.id === id))
    throw new Error('input.ruleset');
  if (memoirMode(state) !== memoirMode({ rulesetId: id }))
    throw new Error('input.switch-workspace');
  return { ...state, rulesetId: id };
}
export function addGeneric(
  state: AppState,
  coordinate: Axial,
  kind: 'obstacle' | 'marker',
): AppState {
  if (memoirMode(state)) throw new Error('input.generic-mode');
  const cell = state.board.cellAt(coordinate);
  if (!cell) throw new Error('input.absent');
  if (cell.elements.length >= MAX_ELEMENTS_PER_CELL)
    throw new Error('limit.stack');
  return {
    ...state,
    board: addElement(state.board, coordinate, {
      id: `element-${state.nextId}`,
      kind,
      properties: {},
    }),
    nextId: state.nextId + 1,
  };
}
export function deleteElement(
  state: AppState,
  coordinate: Axial,
  id: string,
): AppState {
  return { ...state, board: removeElement(state.board, coordinate, id) };
}
export function moveElement(
  state: AppState,
  coordinate: Axial,
  id: string,
  delta: -1 | 1,
): AppState {
  const ids = state.board.cellAt(coordinate)?.elements.map((e) => e.id);
  if (!ids) throw new Error('input.absent');
  const index = ids.indexOf(id),
    next = index + delta;
  if (index < 0 || next < 0 || next >= ids.length) return state;
  const moved = ids.splice(index, 1)[0];
  if (!moved) throw new Error('input.element');
  ids.splice(next, 0, moved);
  return { ...state, board: reorderElements(state.board, coordinate, ids) };
}
export function editEdge(
  state: AppState,
  edge: EdgeId,
  removeId?: string,
): AppState {
  if (memoirMode(state)) throw new Error('memoir44.unsupported-edge-features');
  if (removeId)
    return { ...state, board: removeEdgeFeature(state.board, edge, removeId) };
  if (state.board.featuresAt(edge).length >= MAX_EDGE_FEATURES)
    throw new Error('limit.edge');
  return {
    ...state,
    board: addEdgeFeature(state.board, edge, {
      id: `edge-${state.nextId}`,
      kind: 'edge-marker',
      properties: {},
    }),
    nextId: state.nextId + 1,
  };
}
export function activateCell(state: AppState, coordinate: Axial): AppState {
  const exists = state.board.hasCell(coordinate),
    selected = { ...state, inspected: coordinate };
  switch (state.mode) {
    case 'paint':
      return paintMemoir(selected, coordinate);
    case 'inspect':
      return { ...selected, target: exists ? coordinate : state.target };
    case 'observer':
      if (!exists) throw new Error('input.absent');
      return { ...selected, origin: coordinate };
    case 'add-cell':
      if (exists) return selected;
      if (BigInt(state.board.cells.length) >= MAX_CELLS)
        throw new Error('limit.cells');
      return { ...selected, board: addCell(state.board, coordinate) };
    case 'remove-cell':
      if (!exists) return selected;
      return {
        ...selected,
        board: removeCell(state.board, coordinate),
        origin:
          state.origin && equalCoordinates(state.origin, coordinate)
            ? null
            : state.origin,
        target:
          state.target && equalCoordinates(state.target, coordinate)
            ? null
            : state.target,
      };
    case 'add-obstacle':
      return addGeneric(selected, coordinate, 'obstacle');
    case 'remove-obstacle': {
      const obstacle = [...(state.board.cellAt(coordinate)?.elements ?? [])]
        .reverse()
        .find((e) => e.kind === 'obstacle');
      return obstacle
        ? deleteElement(selected, coordinate, obstacle.id)
        : selected;
    }
    case 'edge':
      return selected;
  }
}
export const selectionKey = (coordinate: Axial | null): string =>
  coordinate ? coordinateKey(coordinate) : '';
