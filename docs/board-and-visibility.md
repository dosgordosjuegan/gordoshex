# M2A board, rulesets, visibility and scenarios

M2A implements P2, P3, P8, P9 and the underlying P10 codec. The reviewed M0
specification remains authoritative. M1 geometry and its tests are unchanged.
There are no game-specific rules, UI, SVG, frontend frameworks or deployment.

The application entry point is `src/application.ts` (built `dist/application.js`).
The accepted geometry entry point remains `src/index.ts` (built `dist/index.js`).
Use relative ESM imports from these built files; this private repository is not
published as an npm package. All modules still have zero runtime dependencies.

## Board API

`new BoardSnapshot(cells = [], edges = [])` validates and copies an arbitrary
finite lattice subset. A cell is `{ coordinate: Axial, elements: BoardEntity[] }`.
An edge record is `{ edge: EdgeId, features: BoardEntity[] }`. An entity is
`{ id: string, kind: string, properties: JsonObject }`. Caller-assigned nonblank
IDs are stable and unique across **all elements and features in the board**.
No object-reference identity or third spatial dimension is introduced.

A snapshot exposes frozen `cells` and `edges` arrays, `cellAt(coordinate)`,
`hasCell(coordinate)` and `featuresAt(edge)`. Internal coordinate/edge maps are
private and never escape. All coordinates, records, stacks and payload trees
are copied and frozen. Freezing an exposed Map is deliberately avoided because
it would still permit `.set()`. Input array, coordinate and nested payload aliases
cannot modify a snapshot. `cellAt` returns `undefined` for absence; an existing
empty cell has an explicit empty element array. Edge lookup returns an empty
frozen feature list when no features exist.

Pure edit functions return new snapshots and retain the original:

| Function                                        | Behavior                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `addCell(board, coordinate)`                    | Adds an empty cell; rejects existing membership                                         |
| `removeCell(board, coordinate)`                 | Removes cell/elements; retains an edge feature list while either incident cell survives |
| `addElement(board, coordinate, entity, index?)` | Inserts into an existing cell; defaults to appending                                    |
| `removeElement(board, coordinate, id)`          | Removes the named element from that cell                                                |
| `reorderElements(board, coordinate, ids)`       | Requires an exact permutation of all existing element IDs                               |
| `addEdgeFeature(board, edge, entity)`           | Appends another feature to the canonical edge                                           |
| `removeEdgeFeature(board, edge, id)`            | Removes one feature; removes the edge record when its list becomes empty                |

Removing the last cell leaves empty cell and edge collections. Boundary edges
may carry features with only one existing incident cell. Detached edges, empty
stored feature lists, duplicate coordinates/edges/IDs, invalid coordinates,
nonadjacent edges, mismatched canonical keys, missing edit targets and invalid
stack positions/permutations reject with `InputError` or the geometry constructor's
input error. Nothing is silently dropped or reidentified.

Payloads are plain JSON objects: null, booleans, strings, finite numbers, nested
plain objects and dense arrays. Integer numbers must be safe; use strings for
larger exact integers in ruleset data. Accessors, symbols, undefined, functions,
BigInt, custom prototypes, Maps/Sets, sparse/extra-member arrays, nonfinite or
unsafe integer numbers and cycles are rejected. Fractional payload numbers have
ordinary JSON/JavaScript number semantics; they are never geometry inputs.
All nonblank element kinds are retained; rulesets validate their own semantics.

## Rectangle generators

`axialRectangle(width, height, origin?)`,
`pointyOddRowRectangle(width, height, origin?)` and
`flatOddColumnRectangle(width, height, origin?)` return empty-element snapshots.
Dimensions are nonnegative bigint values, and origin defaults to `(0,0)`.
Either zero dimension yields the empty board without iterating the other dimension.

For local nonnegative column `c` and row `row`, the coordinates before adding
origin are `(c,row)`, `(c-floor(row/2),row)` and `(c,row-floor(c/2))`, respectively.
Parity is local, including when origin has negative or enormous coordinates.
These are lattice generators, not Euclidean outer-rectangle promises. There is
no presentation orientation stored in a board; display changes cannot regenerate
membership. The lower-level `rectangle` function accepts an explicit layout tag.

## Ruleset contract

A `RulesetReference` is `{ id, version, configuration }`, with nonblank string ID
and version, and copied immutable JSON-object configuration. The `Ruleset` contract
contains matching `id`/`version`, four required synchronous hooks and an optional query-validation hook:

- `validateConfiguration(configuration)` returns accepted, invalid or unsupported.
- `validateBoard(board, configuration)` returns semantic input-validation issues.
- Optional `validateQuery(query)` checks selected-query requirements before geometry. It receives immutable board, origin, target, range and ruleset reference, and returns semantic input issues. It is not called by scenario codecs, which have no selected observer.
- `evaluateRange(context)` returns in-range or out-of-range with explanations.
- `evaluateLineOfSight(context)` returns clear, blocked or invalid-under-ruleset
  with explanations and all supporting evidence.

Callers can supply a static ruleset collection. The visibility evaluator defaults
to `BUILTIN_RULESETS` (the three unchanged `GENERIC_RULESETS` plus `MEMOIR44_REFRESH2025`); scenario codecs require the collection explicitly and do
not depend on a concrete game or demonstration policy implementation. No dynamic
loader, rules language, cache or worker infrastructure exists.

The immutable `RulesetContext` supplies the **complete** `BoardSnapshot`, origin,
target, unrestricted exact bigint distance, original range, ruleset reference and
complete `traceSightline` output. It also supplies every cell contact with explicit
present/absent membership and ordered elements, and every edge contact with its
ordered features. Complete geometric events remain available, including all
simultaneous incidences. Cells outside the sightline remain available via board.
Rulesets return decisions, never board mutations.

Range is `{ kind: 'unlimited' }` or `{ kind: 'radius', radius: bigint }` with a
nonnegative radius. `rangeValue` and `rulesetReference` validate/copy boundaries.
`inclusiveRange` implements the demonstrations' lattice-inclusive range policy.

Explanations use `message(code, arguments)` to create immutable semantic messages.
Arguments are JSON data; large exact integers use decimal strings. There are no
localized presentation strings. The evaluator snapshots returned messages and
evidence so adapter-owned arrays or payloads cannot later change the result.

## Visibility results

`evaluateVisibility(query, rulesets = GENERIC_RULESETS)` validates the query and
invokes the existing public geometry `traceSightline` API. Query fields are
`board`, `origin`, `target`, `range`, `ruleset`, and optional nonnegative bigint
`maxCandidates` (defaults to the measured M1 limit, `1000n`). Origin and target
must exist; absent intermediate coordinates remain in the geometric result.

| Result status                                | Contract                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `evaluated`                                  | Complete `context`, independent `range`, `los`, `visibility` and `evidenceEvents`                  |
| `invalid-query-input`                        | Malformed board/query/range/configuration or ruleset-owned data; semantic explanations, no verdict |
| `unsupported-ruleset-or-configuration`       | Well-formed unavailable ID/version/option; semantic explanations, no verdict                       |
| `evaluation-failure`, cause `resource-limit` | Exact `candidateCount`/`maxCandidates`; no partial range, LOS or visibility                        |
| `evaluation-failure`, cause `internal-error` | Unexpected geometry/adapter exception or inconsistent decision/evidence; no partial verdict        |

An evaluated range decision is `in-range` or `out-of-range`. An evaluated LOS
is `clear`, `blocked` or `invalid-under-ruleset`. For clear/blocked LOS,
`visibility` is `{ status: 'applicable', visible: inRange && clear }`. For
ruleset-invalid LOS it is `{ status: 'not-applicable' }`, with no boolean.
Range and LOS hooks both run for completed supported queries, regardless of
out-of-range, blocked or rule-invalid decisions. A thrown error prevents a
completed result. Resource rejection precedes decision hooks and also applies
to self-queries. No failure masquerades as a blocked or false-visibility verdict.

`Evidence` contains an `effect` (`blocking`, `invalidating`, `transparent`,
`ignored`), semantic `reason`, exact source `contact` and `location`:

- Cell: `{ kind: 'cell', coordinate, absent, elementId? }`.
- Edge: `{ kind: 'edge', edge, featureId? }`.

Coordinate-only absence evidence needs no invented element or feature ID.
`cellEvidence` and `edgeEvidence` build such facts from context contacts. The
evaluator checks contact membership, actual board membership and referenced IDs.
Clear decisions cannot contain blocking/invalidating facts; blocked decisions
require blocker evidence; invalid decisions require invalidating evidence or a
semantic explanation. `evidenceEvents` groups all evidence whose closed contact
interval contains each exact geometric event parameter. No first-blocker or side
selection occurs. Full intervals and all causes remain independently inspectable.

## Public demonstration rulesets

All public policies have version `"1"` and accept only empty configuration `{}`.
A well-formed nonempty configuration is unsupported. An `obstacle` element has
properties `{}` only; other obstacle payloads are invalid query/scenario input.
Other element kinds remain transparent with opaque JSON data. Edge feature kinds
and JSON properties are retained but explicitly ignored when intersected.

| Export              | ID                          | Intermediate obstacle contact that blocks       |
| ------------------- | --------------------------- | ----------------------------------------------- |
| `INTERIOR_ONLY`     | `generic.interior-only`     | Strict interior                                 |
| `INTERIOR_AND_EDGE` | `generic.interior-and-edge` | Strict interior or positive-length edge overlap |
| `ANY_CONTACT`       | `generic.any-contact`       | Interior, edge overlap or isolated vertex       |

`GENERIC_RULESETS` contains only these three policies. Every matching stacked
obstacle is reported. Stack order is retained without adding priority. Both
neighbors of an overlapped edge can block simultaneously. Endpoint obstacles are
ignored; self-visibility is clear at distance zero. Empty existing cells and
absent intermediate cells are transparent; absent contacts retain explicit
coordinate evidence with `generic.absent-transparent`. Endpoint obstacles,
nonmatching contacts and edge features use explicit ignored semantic codes.
All three policies use inclusive lattice range and explicit unlimited range.
These policies do not represent Memoir '44.

## Scenario schema version 1

`serializeScenario({ board, ruleset }, rulesets)` returns JSON text.
`deserializeScenario(text, rulesets)` returns an immutable `{ board, ruleset }`.
The explicit ruleset collection supplies version/configuration/payload validation.
Both functions throw `ScenarioError` with `code` `invalid-scenario` or
`unsupported-scenario`, plus a stable `reason`. No migration is implicit.

Every field below is required; extra fields at every schema level are rejected.
Coordinates are canonical decimal strings (`0` or optional minus with nonzero
leading digits), never JSON numbers. Entity properties and configuration are
JSON objects owned by the selected ruleset.

```json
{
  "schemaVersion": 1,
  "ruleset": {
    "id": "generic.interior-only",
    "version": "1",
    "configuration": {}
  },
  "board": {
    "cells": [
      {
        "coordinate": { "q": "0", "r": "0" },
        "elements": [{ "id": "O1", "kind": "obstacle", "properties": {} }]
      }
    ],
    "edges": [
      {
        "first": { "q": "0", "r": "0" },
        "second": { "q": "1", "r": "0" },
        "features": [{ "id": "F1", "kind": "wall", "properties": {} }]
      }
    ]
  }
}
```

Serialized cells and edges use numeric canonical coordinate order. Ordered
entity lists are preserved. The decoder canonicalizes an unordered adjacent
edge pair; opposite references still count as a duplicate edge. Duplicate JSON
member names are rejected, including Unicode-escaped aliases and nested payload
members, rather than allowing native JSON parsing to overwrite earlier values.
All membership/ID/edge invariants and ruleset payload validation apply to decoding.
Absent cells are omitted, while existing empty cells have explicit empty lists.
Neither cube `s`, cached geometry, visibility, display coordinates nor query state
is persisted. Rational evidence is not scenario state in this version.

## Usage

```ts
import { axial } from './dist/index.js';
import {
  axialRectangle,
  addElement,
  evaluateVisibility,
  serializeScenario,
  deserializeScenario,
  GENERIC_RULESETS,
  INTERIOR_ONLY,
} from './dist/application.js';

let board = axialRectangle(3n, 1n);
board = addElement(board, axial(1n, 0n), {
  id: 'O1',
  kind: 'obstacle',
  properties: {},
});
const ruleset = {
  id: INTERIOR_ONLY.id,
  version: INTERIOR_ONLY.version,
  configuration: {},
};
const result = evaluateVisibility({
  board,
  origin: axial(0n, 0n),
  target: axial(2n, 0n),
  range: { kind: 'radius', radius: 1n },
  ruleset,
});
// result.status === 'evaluated': out-of-range AND blocked; O1 is retained.
const saved = serializeScenario({ board, ruleset }, GENERIC_RULESETS);
const restored = deserializeScenario(saved, GENERIC_RULESETS);
```

## Limitations

All operations are synchronous. Edits rebuild/revalidate snapshots, favoring
simple invariants over premature optimization. Board generators and codecs have
no separate size/depth budget; callers must bound imported text, generated board
sizes and batch workloads according to their environment. Very deep data can
exhaust the JavaScript stack; evaluation exceptions never become valid verdicts.
The per-sightline geometry limit is not a batch or total-memory limit.

Custom rulesets are trusted static code, not sandboxed plugins. Their outputs are
validated and copied, but completeness of game-specific evidence remains the
adapter's responsibility. Payloads intentionally exclude non-JSON values.
Cancellation, scheduling, schemas for persisted query evidence, localized message
catalogues and all presentation/import-export UI remain deferred. M1 performance
evidence still describes geometry only; no new application performance claim is
made. The Memoir '44 adapter additionally invalidates positive-length absent contacts under its approved arbitrary-board convention. The absence-blocking demonstration remains test-only.
