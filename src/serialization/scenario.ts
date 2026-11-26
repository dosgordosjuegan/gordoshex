import {
  BoardSnapshot,
  type BoardCell,
  type BoardEdge,
  type BoardEntity,
} from '../board/model.js';
import { axial, type Axial } from '../geometry/coordinates.js';
import { edgeId } from '../geometry/edges.js';
import { integerFromString } from '../geometry/integer.js';
import { array, fields, InputError, object, text } from '../data/validation.js';
import { jsonObject } from '../data/json.js';
import {
  rulesetReference,
  type RulesetReference,
  type Ruleset,
} from '../rulesets/contracts.js';
import { resolveRuleset } from '../rulesets/resolve.js';
export const SCENARIO_SCHEMA_VERSION = 1;
export interface Scenario {
  readonly board: BoardSnapshot;
  readonly ruleset: RulesetReference;
}
export class ScenarioError extends Error {
  constructor(
    readonly code: 'invalid-scenario' | 'unsupported-scenario',
    readonly reason: string,
  ) {
    super(`${code}: ${reason}`);
    this.name = 'ScenarioError';
  }
}
function accepted(
  board: BoardSnapshot,
  reference: RulesetReference,
  collection: readonly Ruleset[],
): Scenario {
  const result = resolveRuleset(reference, board, collection);
  if (result.status !== 'supported')
    throw new ScenarioError(
      result.status === 'invalid-query-input'
        ? 'invalid-scenario'
        : 'unsupported-scenario',
      result.explanations.map((m) => m.code).join(','),
    );
  return Object.freeze({ board, ruleset: reference });
}
function integerCoordinate(value: unknown): Axial {
  const v = fields(value, ['q', 'r']);
  if (typeof v.q !== 'string' || typeof v.r !== 'string')
    throw new InputError('coordinate-must-use-decimal-strings');
  return axial(integerFromString(v.q), integerFromString(v.r));
}
function members(value: unknown): readonly BoardEntity[] {
  return array(value).map((item) => {
    const v = fields(item, ['id', 'kind', 'properties']);
    return {
      id: text(v.id),
      kind: text(v.kind),
      properties: jsonObject(v.properties),
    };
  });
}
/** Native JSON.parse checks syntax; this scan rejects duplicate member names before any schema interpretation. */
function rejectDuplicateMembers(source: string): void {
  const stack: {
    kind: 'object' | 'array';
    keys: Set<string>;
    expectKey: boolean;
  }[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i],
      frame = stack.at(-1);
    if (c === '"') {
      const start = i;
      for (i++; i < source.length; i++) {
        if (source[i] === '\\') i++;
        else if (source[i] === '"') break;
      }
      if (frame?.kind === 'object' && frame.expectKey) {
        const key: unknown = JSON.parse(source.slice(start, i + 1));
        if (typeof key !== 'string')
          throw new InputError('invalid-member-name');
        if (frame.keys.has(key)) throw new InputError('duplicate-json-member');
        frame.keys.add(key);
      }
    } else if (c === '{')
      stack.push({ kind: 'object', keys: new Set(), expectKey: true });
    else if (c === '[')
      stack.push({ kind: 'array', keys: new Set(), expectKey: false });
    else if (c === '}' || c === ']') stack.pop();
    else if (c === ':' && frame) frame.expectKey = false;
    else if (c === ',' && frame?.kind === 'object') frame.expectKey = true;
  }
}
export function deserializeScenario(
  source: string,
  collection: readonly Ruleset[],
): Scenario {
  try {
    if (typeof source !== 'string')
      throw new InputError('scenario-must-be-json-text');
    const parsed: unknown = JSON.parse(source);
    rejectDuplicateMembers(source);
    const root = object(parsed);
    if (root.schemaVersion !== SCENARIO_SCHEMA_VERSION) {
      if (
        typeof root.schemaVersion !== 'number' ||
        !Number.isSafeInteger(root.schemaVersion) ||
        root.schemaVersion < 1
      )
        throw new InputError('invalid-schema-version');
      throw new ScenarioError(
        'unsupported-scenario',
        'unsupported-schema-version',
      );
    }
    fields(root, ['schemaVersion', 'ruleset', 'board']);
    const reference = rulesetReference(root.ruleset),
      rawBoard = fields(root.board, ['cells', 'edges']);
    const cells: BoardCell[] = array(rawBoard.cells).map((item) => {
      const v = fields(item, ['coordinate', 'elements']);
      return {
        coordinate: integerCoordinate(v.coordinate),
        elements: members(v.elements),
      };
    });
    const edges: BoardEdge[] = array(rawBoard.edges).map((item) => {
      const v = fields(item, ['first', 'second', 'features']);
      return {
        edge: edgeId(integerCoordinate(v.first), integerCoordinate(v.second)),
        features: members(v.features),
      };
    });
    return accepted(new BoardSnapshot(cells, edges), reference, collection);
  } catch (error) {
    if (error instanceof ScenarioError) throw error;
    throw new ScenarioError(
      'invalid-scenario',
      error instanceof InputError ? error.code : 'malformed-scenario',
    );
  }
}
export function serializeScenario(
  scenario: Scenario,
  collection: readonly Ruleset[],
): string {
  try {
    const v = fields(scenario, ['board', 'ruleset']);
    if (!(v.board instanceof BoardSnapshot))
      throw new InputError('invalid-board-snapshot');
    const validated = accepted(
      v.board,
      rulesetReference(v.ruleset),
      collection,
    );
    const coordinate = (c: Axial) => ({ q: c.q.toString(), r: c.r.toString() });
    return JSON.stringify({
      schemaVersion: SCENARIO_SCHEMA_VERSION,
      ruleset: validated.ruleset,
      board: {
        cells: validated.board.cells.map((cell) => ({
          coordinate: coordinate(cell.coordinate),
          elements: cell.elements,
        })),
        edges: validated.board.edges.map((e) => ({
          first: coordinate(e.edge.first),
          second: coordinate(e.edge.second),
          features: e.features,
        })),
      },
    });
  } catch (error) {
    if (error instanceof ScenarioError) throw error;
    throw new ScenarioError(
      'invalid-scenario',
      error instanceof InputError ? error.code : 'malformed-scenario',
    );
  }
}
