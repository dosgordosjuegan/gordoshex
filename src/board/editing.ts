import {
  coordinateKey,
  equalCoordinates,
  type Axial,
} from '../geometry/coordinates.js';
import type { EdgeId } from '../geometry/edges.js';
import { InputError } from '../data/validation.js';
import {
  BoardSnapshot,
  boardCoordinate,
  boardEdgeId,
  type BoardCell,
  type BoardEntity,
} from './model.js';
function existing(board: BoardSnapshot, coordinate: Axial): BoardCell {
  const cell = board.cellAt(coordinate);
  if (!cell) throw new InputError('absent-cell');
  return cell;
}
export function addCell(
  board: BoardSnapshot,
  coordinate: Axial,
): BoardSnapshot {
  coordinate = boardCoordinate(coordinate);
  if (board.hasCell(coordinate)) throw new InputError('duplicate-coordinate');
  return new BoardSnapshot(
    [...board.cells, { coordinate, elements: [] }],
    board.edges,
  );
}
export function removeCell(
  board: BoardSnapshot,
  coordinate: Axial,
): BoardSnapshot {
  existing(board, coordinate);
  const cells = board.cells.filter(
    (c) => !equalCoordinates(c.coordinate, coordinate),
  );
  const remaining = new Set(cells.map((c) => coordinateKey(c.coordinate)));
  return new BoardSnapshot(
    cells,
    board.edges.filter(
      (e) =>
        remaining.has(coordinateKey(e.edge.first)) ||
        remaining.has(coordinateKey(e.edge.second)),
    ),
  );
}
function replaceElements(
  board: BoardSnapshot,
  coordinate: Axial,
  elements: readonly BoardEntity[],
): BoardSnapshot {
  return new BoardSnapshot(
    board.cells.map((c) =>
      equalCoordinates(c.coordinate, coordinate)
        ? { coordinate: c.coordinate, elements }
        : c,
    ),
    board.edges,
  );
}
export function addElement(
  board: BoardSnapshot,
  coordinate: Axial,
  element: BoardEntity,
  index?: number,
): BoardSnapshot {
  const cell = existing(board, coordinate),
    position = index ?? cell.elements.length;
  if (
    !Number.isSafeInteger(position) ||
    position < 0 ||
    position > cell.elements.length
  )
    throw new InputError('invalid-stack-index');
  const elements = [...cell.elements];
  elements.splice(position, 0, element);
  return replaceElements(board, coordinate, elements);
}
export function removeElement(
  board: BoardSnapshot,
  coordinate: Axial,
  id: string,
): BoardSnapshot {
  const cell = existing(board, coordinate);
  if (!cell.elements.some((e) => e.id === id))
    throw new InputError('unknown-element-id');
  return replaceElements(
    board,
    coordinate,
    cell.elements.filter((e) => e.id !== id),
  );
}
export function reorderElements(
  board: BoardSnapshot,
  coordinate: Axial,
  ids: readonly string[],
): BoardSnapshot {
  const cell = existing(board, coordinate),
    byId = new Map(cell.elements.map((e) => [e.id, e]));
  if (ids.length !== cell.elements.length || new Set(ids).size !== ids.length)
    throw new InputError('invalid-stack-permutation');
  const elements = ids.map((id) => {
    const e = byId.get(id);
    if (!e) throw new InputError('invalid-stack-permutation');
    return e;
  });
  return replaceElements(board, coordinate, elements);
}
export function addEdgeFeature(
  board: BoardSnapshot,
  id: EdgeId,
  feature: BoardEntity,
): BoardSnapshot {
  id = boardEdgeId(id);
  const edges = board.edges.filter((e) => e.edge.key !== id.key);
  return new BoardSnapshot(board.cells, [
    ...edges,
    { edge: id, features: [...board.featuresAt(id), feature] },
  ]);
}
export function removeEdgeFeature(
  board: BoardSnapshot,
  id: EdgeId,
  featureId: string,
): BoardSnapshot {
  id = boardEdgeId(id);
  const features = board.featuresAt(id);
  if (!features.some((f) => f.id === featureId))
    throw new InputError('unknown-feature-id');
  const remaining = features.filter((f) => f.id !== featureId),
    edges = board.edges.filter((e) => e.edge.key !== id.key);
  return new BoardSnapshot(
    board.cells,
    remaining.length ? [...edges, { edge: id, features: remaining }] : edges,
  );
}
