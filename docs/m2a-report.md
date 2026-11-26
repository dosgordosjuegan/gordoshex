# M2A completion report

## Delivery and scope

PR #2 was already merged when this task began. Its reviewed head remained exactly
`104b33e58c444d3167759f0b335b17c7cffdd928`, and both GitHub Actions checks passed.
Local `main` was fast-forwarded to merged revision
`909f7a2`, the merged local/remote `feature/exact-geometry` branches were removed,
and work proceeded on `feature/board-and-generic-rulesets`.

M2A adds board state, three generic rulesets, synchronous visibility orchestration
and the P10 version-1 scenario codec. It introduces no Memoir '44 policy, rendering,
SVG, frontend framework, UI, deployment, dynamic loading, caching or workers.
The accepted geometry source and all M1 tests remain unchanged.

## Implementation

| Area                        | Files and behavior                                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Immutable JSON/input values | `src/data/validation.ts`, `src/data/json.ts`: strict structural validation; copied/frozen JSON payloads without mutable aliases                                                                     |
| Board snapshots             | `src/board/model.ts`: private coordinate/edge maps, frozen public records, global stable entity IDs and full P2 validation                                                                          |
| Pure board edits            | `src/board/editing.ts`: add/remove cells/elements/features, stack insertion/reordering and last-incident-cell cleanup                                                                               |
| Generators                  | `src/board/generators.ts`: bigint axial, pointy odd-row and flat odd-column rectangles with local parity                                                                                            |
| Ruleset contracts           | `src/rulesets/contracts.ts`, `resolve.ts`: immutable full query context, separate range/LOS hooks, version/configuration/payload validation and semantic evidence                                   |
| Demonstrations              | `src/rulesets/generic.ts`: P9 interior-only, interior-plus-edge and any-contact policies, inclusive range, transparent absence and explicit ignored-feature evidence                                |
| Visibility                  | `src/visibility/evaluate.ts`, `evidence.ts`: `traceSightline` orchestration, independent range/LOS, all six semantic outcomes, explicit failures and simultaneous evidence groups                   |
| Scenario codec              | `src/serialization/scenario.ts`: strict version-1 JSON, exact decimal coordinate strings, full membership/stacks/features/identity, duplicate-member checks and explicit invalid/unsupported errors |
| Public API                  | `src/application.ts` and module index files: additive M2A API; M1 `src/index.ts` remains unchanged                                                                                                  |
| Verification                | `tests/board.test.ts`, `tests/visibility.test.ts`, `tests/serialization.test.ts`                                                                                                                    |
| Documentation               | `docs/board-and-visibility.md`, this report, README status/links and M1 implementation cross-reference                                                                                              |

No dependencies or tooling versions changed. Library compilation still excludes
DOM and Node ambient APIs, and all runtime dependencies remain internal modules.
The new API builds to `dist/application.js` with declarations.

## Architectural decisions

- Board snapshots expose frozen arrays and values backed by private maps. Input
  coordinates, arrays and nested JSON payloads are copied, not merely shallow
  frozen. Edits construct and validate new snapshots for straightforward invariants.
- Caller-provided element/feature IDs are nonblank and globally unique across the
  board. Stack order is explicit data, with no extra geometric dimension or
  default blocking priority.
- Custom rulesets are a small static collection supplied by code. The complete
  immutable board and all geometry are available to each adapter. The scenario
  codec requires the collection explicitly and imports no concrete generic policy.
- Generic obstacle properties are `{}` only. Other element kinds remain transparent;
  intersected edge features retain arbitrary valid JSON payloads but are explicitly
  ignored. Nonempty generic configuration is well-formed but unsupported.
- Only completed evaluations contain independent range and LOS decisions. A
  ruleset-invalid sightline has visibility not applicable. Resource/internal
  failures contain neither a partial range/LOS result nor a visibility boolean.
- Evidence refers to actual context contact records, retaining exact intervals,
  boundary metadata and IDs. Coordinate-only absent-cell facts do not invent IDs.
  Returned messages, evidence locations and collections are copied/frozen.
- P10 schema version 1 persists only board state and ruleset identity/configuration.
  Unknown fields, duplicate JSON members, invalid IDs/topology/payloads and unknown
  versions/options reject explicitly. No UI or cached query/geometry persistence
  is introduced.

These details complete the implementation choices left open by M0 and this M2A
request; no mathematical or architectural contract was silently revised.

## Verification evidence

A clean pinned-toolchain `npm ci` install and `npm run check` pass. The latter
includes strict type checking, all **74 tests**, ESLint, Prettier verification and
the ESM/declaration build.

- **31 M1 tests** are retained unchanged, including 2,650 fixed-seed generated cases,
  all G1–G6 fixtures, the persistent exact oracle's 625 ordered endpoint pairs,
  6,561 independent candidate-count pairs and enormous preflight rejection tests.
- **43 M2A tests**: 11 board, 18 visibility and 14 serialization tests.
- **250 new fixed-seed generated cases**: seed 2101 covers all three rectangle
  formulas under arbitrary signed/large translations (100 cases); seed 2102 covers
  scenario round trips with bounded arbitrary membership, ordered payloads and
  boundary edge features (150 cases). Failures retain fast-check replay paths.
- Board tests exercise empty/holed/disconnected boards, value membership, frozen
  snapshots, coordinate/stack/nested payload aliases, IDs, edge adjacency/incidence,
  feature retention/deletion, stack permutations and zero/invalid dimensions.
- Visibility tests cover every approved M2 reference row: G1 interior obstacles,
  G2 both overlapped neighbors, G3 isolated vertices, ignored endpoints/features,
  self-visibility, inclusive/unlimited range and independently retained blocked/
  out-of-range facts. All matching obstacles and simultaneous causes survive.
- Test-only absent-cell adapters independently return blocked or
  invalid-under-ruleset, including when out of range. They are not public policies.
  A test-only edge adapter verifies blocking feature evidence.
- Resource rejection, malformed query/configuration/payloads, unavailable versions,
  validator/decision/geometry exceptions and fabricated evidence are distinguished
  without a valid visibility verdict on failure.
- Codec tests retain empty membership versus absence, ordered IDs, multiple shared
  edge features and huge exact coordinates; malformed/unsupported schemas,
  duplicate identifiers/member names, unknown fields and invalid topology reject.
- The build's documented usage example runs against the emitted ESM API.
- `git diff --check` passes; accepted geometry/specification files and M1 test
  sources remain unchanged. The retained M1 benchmark source fingerprint still
  matches; no geometry performance claim or benchmark revision is introduced.

Remote CI status and the PR URL are reported in the PR/handoff rather than
asserted before publication.

## Deviations and remaining risks

No scope or specification deviations and no unresolved substantive ambiguities
were found. The schema, payload format and API names above are explicit M2A
implementation decisions permitted by the approved contracts.

Execution is synchronous. Edits rebuild snapshots and generators/serialization
have no separate size/depth budget. Very large boards, deeply nested JSON and
large batches require caller resource controls. The M1 per-sightline candidate
limit does not bound batch cost, integer bit length or total memory. Custom
rulesets are trusted static code; validation does not sandbox adapters or prove
all game-specific evidence complete. Cancellation/scheduling, localized message
catalogues and presentation remain deferred. No Memoir '44 compatibility is
claimed. The M2A pull request must await explicit approval before merging.
