import type {
  BoardCell,
  BoardEntity,
  BoardSnapshot,
} from '../../board/model.js';
import { fields, InputError } from '../../data/validation.js';
import { coordinateKey } from '../../geometry/coordinates.js';
import { message, type SemanticMessage } from '../contracts.js';
export const MEMOIR44_TERRAINS = Object.freeze([
  'open',
  'forest',
  'hedgerow',
  'town',
  'church',
  'hill',
  'river',
  'ocean',
  'beach',
  'bridge',
] as const);
export const MEMOIR44_INSTALLATIONS = Object.freeze([
  'bunker',
  'hedgehog',
  'sandbags',
  'wire',
  'sea-wall',
] as const);
export const MEMOIR44_UNIT_TYPES = Object.freeze([
  'infantry',
  'armor',
  'artillery',
] as const);
export type Memoir44Terrain = (typeof MEMOIR44_TERRAINS)[number];
export type Memoir44Installation = (typeof MEMOIR44_INSTALLATIONS)[number];
export type Memoir44UnitType = (typeof MEMOIR44_UNIT_TYPES)[number];
export interface Memoir44Unit {
  readonly entity: BoardEntity;
  readonly type: Memoir44UnitType;
  readonly side: 'allies' | 'axis';
}
export interface Memoir44Cell {
  readonly terrain: Memoir44Terrain;
  readonly terrainEntity: BoardEntity | null;
  readonly height: bigint;
  readonly installations: readonly {
    readonly entity: BoardEntity;
    readonly type: Memoir44Installation;
  }[];
  readonly unit: Memoir44Unit | null;
}
function terrainType(value: unknown): value is Memoir44Terrain {
  return MEMOIR44_TERRAINS.some((type) => type === value);
}
function installationType(value: unknown): value is Memoir44Installation {
  return MEMOIR44_INSTALLATIONS.some((type) => type === value);
}
function unitType(value: unknown): value is Memoir44UnitType {
  return MEMOIR44_UNIT_TYPES.some((type) => type === value);
}
/** Semantic roles are independent of list order; this does not certify legal deployment. */
export function memoir44Cell(cell: BoardCell): Memoir44Cell {
  let terrain: Memoir44Terrain = 'open',
    terrainEntity: BoardEntity | null = null,
    unit: Memoir44Unit | null = null;
  const installations: {
      readonly entity: BoardEntity;
      readonly type: Memoir44Installation;
    }[] = [],
    seen = new Set<Memoir44Installation>();
  for (const entity of cell.elements) {
    if (entity.kind === 'memoir44.terrain') {
      const p = fields(entity.properties, ['type']);
      if (!terrainType(p.type))
        throw new InputError('memoir44.unsupported-terrain');
      if (terrainEntity)
        throw new InputError('memoir44.multiple-base-terrains');
      terrain = p.type;
      terrainEntity = entity;
    } else if (entity.kind === 'memoir44.obstacle') {
      const p = fields(entity.properties, ['type']);
      if (!installationType(p.type))
        throw new InputError('memoir44.unsupported-installation');
      if (seen.has(p.type))
        throw new InputError('memoir44.duplicate-installation');
      seen.add(p.type);
      installations.push(Object.freeze({ entity, type: p.type }));
    } else if (entity.kind === 'memoir44.unit') {
      const p = fields(entity.properties, ['type', 'side', 'variant']);
      if (!unitType(p.type) || p.variant !== 'standard')
        throw new InputError('memoir44.unsupported-unit');
      if (p.side !== 'allies' && p.side !== 'axis')
        throw new InputError('memoir44.invalid-unit-side');
      if (unit) throw new InputError('memoir44.multiple-units');
      unit = Object.freeze({ entity, type: p.type, side: p.side });
    } else throw new InputError('memoir44.unsupported-entity-kind');
  }
  return Object.freeze({
    terrain,
    terrainEntity,
    height: terrain === 'hill' ? 1n : 0n,
    installations: Object.freeze(installations),
    unit,
  });
}
export function validateMemoir44Board(
  board: BoardSnapshot,
): readonly SemanticMessage[] {
  const issues: SemanticMessage[] = [];
  for (const cell of board.cells) {
    try {
      memoir44Cell(cell);
    } catch (error) {
      if (!(error instanceof InputError)) throw error;
      issues.push(
        message(
          error.code.startsWith('memoir44.')
            ? error.code
            : 'memoir44.invalid-payload',
          { coordinate: coordinateKey(cell.coordinate), cause: error.code },
        ),
      );
    }
  }
  for (const edge of board.edges)
    issues.push(
      message('memoir44.unsupported-edge-features', {
        edge: edge.edge.key,
        featureIds: edge.features.map((f) => f.id),
      }),
    );
  return Object.freeze(issues);
}
export const MEMOIR44_MAX_RANGE: Readonly<Record<Memoir44UnitType, bigint>> =
  Object.freeze({ infantry: 3n, armor: 3n, artillery: 6n });
