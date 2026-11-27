import {
  embed,
  polygonVertices,
  subtractPoint,
  neighbors,
  coordinateKey,
  axial,
  type Axial,
  type Point,
} from '../src/index.js';
import type { BoardSnapshot } from '../src/application.js';
export type Orientation = 'pointy' | 'flat';
export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}
function safe(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error('limit.display');
  return n;
}
/** Rebase in exact embedded coordinates BEFORE any floating-point conversion. */
export function displayPoint(
  point: Point,
  origin: Axial,
  orientation: Orientation,
): ScreenPoint {
  const local = subtractPoint(point, embed(origin)),
    x = (Math.sqrt(3) * safe(local.x)) / 2,
    y = safe(local.y) / 2;
  if (orientation === 'pointy') return { x, y: -y };
  return {
    x: (Math.sqrt(3) * x) / 2 - y / 2,
    y: -(x / 2 + (Math.sqrt(3) * y) / 2),
  };
}
export const center = (
  a: Axial,
  origin: Axial,
  orientation: Orientation,
): ScreenPoint => displayPoint(embed(a), origin, orientation);
export const vertices = (
  a: Axial,
  origin: Axial,
  orientation: Orientation,
): readonly ScreenPoint[] =>
  polygonVertices(a).map((v) => displayPoint(v, origin, orientation));
export function frontier(board: BoardSnapshot): readonly Axial[] {
  const missing = new Map<string, Axial>();
  for (const cell of board.cells)
    for (const a of neighbors(cell.coordinate))
      if (!board.hasCell(a)) missing.set(coordinateKey(a), a);
  return board.cells.length ? [...missing.values()] : [axial(0n, 0n)];
}
export function frame(points: readonly ScreenPoint[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!points.length) return { x: -3, y: -3, width: 6, height: 6 };
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y),
    x = Math.min(...xs) - 1,
    y = Math.min(...ys) - 1;
  return {
    x,
    y,
    width: Math.max(...xs) - x + 1,
    height: Math.max(...ys) - y + 1,
  };
}
