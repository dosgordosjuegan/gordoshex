import {
  axial,
  compareCoordinates,
  coordinateKey,
  type Axial,
} from '../geometry/coordinates.js';
import { edgeId, type EdgeId } from '../geometry/edges.js';
import { array, fields, InputError, text } from '../data/validation.js';
import { jsonObject, type JsonObject } from '../data/json.js';
export interface BoardEntity {
  readonly id: string;
  readonly kind: string;
  readonly properties: JsonObject;
}
export interface BoardCell {
  readonly coordinate: Axial;
  readonly elements: readonly BoardEntity[];
}
export interface BoardEdge {
  readonly edge: EdgeId;
  readonly features: readonly BoardEntity[];
}
export function boardCoordinate(value: unknown): Axial {
  const v = fields(value, ['q', 'r']);
  if (typeof v.q !== 'bigint' || typeof v.r !== 'bigint')
    throw new InputError('invalid-coordinate');
  return axial(v.q, v.r);
}
export function boardEdgeId(value: unknown): EdgeId {
  const v = fields(value, ['first', 'second', 'key']);
  const id = edgeId(boardCoordinate(v.first), boardCoordinate(v.second));
  if (v.key !== id.key) throw new InputError('noncanonical-edge-key');
  return id;
}
function entities(value: unknown, ids: Set<string>): readonly BoardEntity[] {
  return Object.freeze(
    array(value).map((item) => {
      const v = fields(item, ['id', 'kind', 'properties']),
        id = text(v.id);
      if (ids.has(id)) throw new InputError('duplicate-entity-id');
      ids.add(id);
      return Object.freeze({
        id,
        kind: text(v.kind),
        properties: jsonObject(v.properties),
      });
    }),
  );
}
/** Private maps never escape; public arrays, records and copied payload trees are frozen. */
export class BoardSnapshot {
  readonly cells: readonly BoardCell[];
  readonly edges: readonly BoardEdge[];
  readonly #cells: Map<string, BoardCell>;
  readonly #edges: Map<string, BoardEdge>;
  constructor(
    cells: readonly BoardCell[] = [],
    edges: readonly BoardEdge[] = [],
  ) {
    const ids = new Set<string>();
    this.#cells = new Map();
    this.#edges = new Map();
    for (const item of array(cells)) {
      const v = fields(item, ['coordinate', 'elements']),
        coordinate = boardCoordinate(v.coordinate),
        key = coordinateKey(coordinate);
      if (this.#cells.has(key)) throw new InputError('duplicate-coordinate');
      this.#cells.set(
        key,
        Object.freeze({ coordinate, elements: entities(v.elements, ids) }),
      );
    }
    for (const item of array(edges)) {
      const v = fields(item, ['edge', 'features']),
        edge = boardEdgeId(v.edge);
      if (this.#edges.has(edge.key)) throw new InputError('duplicate-edge');
      if (
        !this.#cells.has(coordinateKey(edge.first)) &&
        !this.#cells.has(coordinateKey(edge.second))
      )
        throw new InputError('detached-edge');
      const features = entities(v.features, ids);
      if (features.length === 0) throw new InputError('empty-edge-features');
      this.#edges.set(edge.key, Object.freeze({ edge, features }));
    }
    this.cells = Object.freeze(
      [...this.#cells.values()].sort((a, b) =>
        compareCoordinates(a.coordinate, b.coordinate),
      ),
    );
    this.edges = Object.freeze(
      [...this.#edges.values()].sort(
        (a, b) =>
          compareCoordinates(a.edge.first, b.edge.first) ||
          compareCoordinates(a.edge.second, b.edge.second),
      ),
    );
    Object.freeze(this);
  }
  cellAt(coordinate: Axial): BoardCell | undefined {
    return this.#cells.get(coordinateKey(boardCoordinate(coordinate)));
  }
  hasCell(coordinate: Axial): boolean {
    return this.cellAt(coordinate) !== undefined;
  }
  featuresAt(edge: EdgeId): readonly BoardEntity[] {
    return this.#edges.get(boardEdgeId(edge).key)?.features ?? EMPTY_FEATURES;
  }
}
const EMPTY_FEATURES: readonly BoardEntity[] = Object.freeze([]);
