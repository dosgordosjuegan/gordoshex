import { axial, coordinateKey, equalCoordinates } from '../src/index.js';
import {
  BoardSnapshot,
  rectangle,
  MEMOIR44_TERRAINS,
  MEMOIR44_INSTALLATIONS,
  MEMOIR44_UNIT_TYPES,
  validateMemoir44Board,
  type BoardEntity,
} from '../src/application.js';
import { initialMemoirState } from '../web/workspaces.js';
import type { AppState } from '../web/state.js';
/** The accepted deterministic 117/468-cell populated Memoir workload, shared across protocols. */
export function memoirWorkload(width: number, height: number): AppState {
  const observer = axial(
    BigInt(Math.floor(width / 2) - Math.floor(Math.floor(height / 2) / 2)),
    BigInt(Math.floor(height / 2)),
  );
  const base = rectangle(
    BigInt(width),
    BigInt(height),
    axial(0n, 0n),
    'pointy-odd-row',
  );
  const board = new BoardSnapshot(
    base.cells.map((cell, index) => {
      const type = MEMOIR44_TERRAINS[index % MEMOIR44_TERRAINS.length];
      if (!type) throw new Error('Terrain');
      const key = coordinateKey(cell.coordinate),
        elements: BoardEntity[] = [
          {
            id: `terrain:${key}`,
            kind: 'memoir44.terrain',
            properties: { type },
          },
        ];
      if (index % 4 === 0) {
        const installation =
          MEMOIR44_INSTALLATIONS[index % MEMOIR44_INSTALLATIONS.length];
        if (!installation) throw new Error('Installation');
        elements.push({
          id: `installation:${key}`,
          kind: 'memoir44.obstacle',
          properties: { type: installation },
        });
      }
      if (index % 11 === 0 || equalCoordinates(cell.coordinate, observer)) {
        const unit = equalCoordinates(cell.coordinate, observer)
          ? 'artillery'
          : MEMOIR44_UNIT_TYPES[index % 3];
        if (!unit) throw new Error('Unit');
        elements.push({
          id: `unit:${key}`,
          kind: 'memoir44.unit',
          properties: {
            type: unit,
            variant: 'standard',
            side: index % 2 === 0 ? 'allies' : 'axis',
          },
        });
      }
      return { ...cell, elements };
    }),
  );
  if (validateMemoir44Board(board).length)
    throw new Error('Invalid benchmark board');
  const state: AppState = {
    ...initialMemoirState(),
    board,
    origin: observer,
    target: axial(2n, 0n),
    inspected: axial(2n, 0n),
  };
  return state;
}
