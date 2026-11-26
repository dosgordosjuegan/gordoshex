import { axial, type Axial } from '../geometry/coordinates.js';
import { InputError } from '../data/validation.js';
import { BoardSnapshot, boardCoordinate, type BoardCell } from './model.js';
export type RectangleLayout = 'axial' | 'pointy-odd-row' | 'flat-odd-column';
export function rectangle(
  width: bigint,
  height: bigint,
  origin: Axial,
  layout: RectangleLayout,
): BoardSnapshot {
  origin = boardCoordinate(origin);
  if (
    typeof width !== 'bigint' ||
    typeof height !== 'bigint' ||
    width < 0n ||
    height < 0n
  )
    throw new InputError('invalid-dimensions');
  if (!['axial', 'pointy-odd-row', 'flat-odd-column'].includes(layout))
    throw new InputError('invalid-layout');
  const cells: BoardCell[] = [];
  if (width === 0n || height === 0n) return new BoardSnapshot();
  for (let row = 0n; row < height; row++)
    for (let column = 0n; column < width; column++) {
      const q =
          origin.q + column - (layout === 'pointy-odd-row' ? row / 2n : 0n),
        r = origin.r + row - (layout === 'flat-odd-column' ? column / 2n : 0n);
      cells.push({ coordinate: axial(q, r), elements: [] });
    }
  return new BoardSnapshot(cells);
}
export const axialRectangle = (
  width: bigint,
  height: bigint,
  origin: Axial = axial(0n, 0n),
): BoardSnapshot => rectangle(width, height, origin, 'axial');
export const pointyOddRowRectangle = (
  width: bigint,
  height: bigint,
  origin: Axial = axial(0n, 0n),
): BoardSnapshot => rectangle(width, height, origin, 'pointy-odd-row');
export const flatOddColumnRectangle = (
  width: bigint,
  height: bigint,
  origin: Axial = axial(0n, 0n),
): BoardSnapshot => rectangle(width, height, origin, 'flat-odd-column');
