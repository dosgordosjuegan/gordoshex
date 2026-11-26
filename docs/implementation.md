# M1 implementation and development

The approved contracts in specification.md and geometry.md remain authoritative.
M1 implements geometry only. There is no board, ruleset, rendering or UI code.

## Toolchain

Use `nvm use`, then `npm ci`. The reproducible baseline is Node.js 22.13.1
(native BigInt), npm 10.9.2, TypeScript 5.9.3, Vitest 5.1.2, fast-check 4.11.0,
ESLint 10.15.0 / @eslint/js 10.0.1, typescript-eslint 8.74.0, Prettier 3.10.1 and
@types/node 22.13.1. Exact development versions and transitive resolutions are
in package.json and package-lock.json. Node 22 is a supported LTS line through
April 2027: [official release schedule](https://github.com/nodejs/Release).
The pinned patch establishes reproducibility; maintainers should update supported
security patches with the lockfile and rerun verification.

TypeScript targets ES2022 with strict mode, checked indexed access and exact
optional properties. The library build uses only the ES2022 standard library,
without DOM or Node ambient types. Vitest's transitive Vite is test tooling;
there is no Vite application initialization or frontend framework.
All installed packages are development dependencies; geometry has no runtime
dependencies and imports only its own modules.

Run `npm run check` for type checking, tests, linting, formatting and the declaration
build. `npm run benchmark` builds native ESM and records baseline samples.
GitHub Actions runs the same verification on the pinned runtime.

## Value and error conventions

Core coordinates and limits accept bigint only. Use integerFromString or
integerFromNumber at input boundaries; decimal strings must be canonical.
Mathematical value objects are frozen; collections exposed by geometry are frozen
readonly arrays. Coordinate and edge keys are canonical values, not reference
identities. Rational keys normalize by value.

Invalid arithmetic/configuration input throws TypeError, SyntaxError or RangeError.
A valid query denied by its candidate budget returns a discriminated resource-limit
result, carrying exact candidate count and limit and no partial geometry.
No visibility verdict exists at this layer. Runtime allocation failures propagate;
cancellation remains deferred under O2.

## Public geometry API

Import from `src/index.ts` in TypeScript or `dist/index.js` after building. Public
interfaces describe immutable values; construct sightlines with `sightline` rather
than assembling inconsistent endpoint/difference fields. This is a center-to-center
API, not an arbitrary-point segment API.

| Area                  | API                                                                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integers              | `integerFromString`, `integerFromNumber`, `floorDiv`, `ceilDiv`, `abs`, `sign`, `min`, `max`, `requireBigint`; `Sign`                                                                                                         |
| Rationals             | `rational`, `ZERO`, `ONE`, `compareRational`, `equalRational`, `addRational`, `subtractRational`, `multiplyRational`, `divideRational`, `rationalKey`, `minRational`, `maxRational`, `midpoint`, `inUnitInterval`; `Rational` |
| Coordinates           | `axial`, `coordinateKey`, `equalCoordinates`, `compareCoordinates`, `translate`, `embed`, `distance`, `neighbor`, `neighbors`, `DIRECTIONS`, `rotate`, `reflect`; `Axial`, `Direction`                                        |
| Embedded points       | `point`, `pointKey`, `addPoint`, `subtractPoint`, `comparePoints`, `determinant`, `dot`; `Point`                                                                                                                              |
| Sightlines            | `sightline`, `pointAt`; `Sightline`, `RationalPoint`                                                                                                                                                                          |
| Hexagons              | `polygonVertices`, `boundaryAt`, `constraintSlack`, `VERTICES`, `NORMALS`, `BOUNDS`, `EDGE_VERTICES`; `BoundaryIncidence`                                                                                                     |
| Clipping              | `clipCell`; `ContactClass`, `CellHit`, `CellMiss`, `CellContact`                                                                                                                                                              |
| Candidate preflight   | `candidateBounds`, `candidateRow`, `candidateCount`, `preflight`; `CandidateBounds`, `IntegerInterval`, `AdmittedCandidates`, `ResourceLimitFailure`                                                                          |
| Reference enumeration | `enumerateCells`, low-level `candidateCoordinates`; `CompleteCells`                                                                                                                                                           |
| Shared edges          | `edgeId`, `localEdge`, `equalEdges`, `edgeGeometry`, `intersectEdge`; `EdgeId`, `EdgeGeometry`, `EdgeIncidence`, `EdgeHit`, `EdgeMiss`                                                                                        |
| Events                | `groupEvents`; `GeometryEvent`                                                                                                                                                                                                |
| Complete query        | `traceSightline`, `DEFAULT_MAX_CANDIDATES`; `CompleteGeometry`                                                                                                                                                                |

`traceSightline(origin, target, maxCandidates = DEFAULT_MAX_CANDIDATES)` is the
normal entry point. The default is `1000n`, justified in performance.md. It returns:

- `{ status: 'complete', degenerate, line, candidateCount, cells, edges, events }`;
- or `{ status: 'resource-limit', candidateCount, maxCandidates }`.

`enumerateCells(line, maxCandidates)` returns the same cell completion fields,
without computing edges/events, and always requires an explicit budget. The
low-level `candidateCoordinates(bounds)` iterator deliberately exposes the reference
region for verification; it does not apply a budget itself. Use `preflight` before
consuming it. Direct cell/edge predicates do not enumerate a region.

Cell records retain exact `entry`, `exit`, determinant `side`, active entry/exit
polygon edges, global embedded vertex identities and `supportingEdges`. A miss is
`kind: 'none'` and has no interval. Hit kinds are `interior`, `edge-overlap`,
`isolated-vertex` and `degenerate-point`. The last has `[0,1]`, side zero and strict
interior location; the completed result has `degenerate: true`, no edges and no
events.

Edge IDs contain numerically ordered `first`/`second` coordinates and the canonical
`key`. `EdgeGeometry.u`/`.v` are numerically ordered embedded endpoints. Edge hits
retain `entry`/`exit`, edge-relative `uEntry`/`uExit`, both supporting-line signs,
incident coordinates, query/edge endpoint flags and vertex identities. `kind`
distinguishes `point`/`overlap`; `classification` distinguishes `proper-crossing`,
`touch` and `edge-overlap`. An edge miss has `kind: 'none'` without an interval.

An event has exact `t`, coordinate-key arrays `enteringCells`, `exitingCells`,
`isolatedVertexCells`, and edge-key arrays `edgePoints`, `overlapStarts`,
`overlapEnds`. These reference complete cell/edge records; singleton cells occur
in both entry and exit sets. Overlap records remain intervals. Query endpoints
are included for every nondegenerate query. Independently allocated equal
rational parameters merge by value, including nonreduced inputs to event grouping.

Cells use reference row order, edges use numeric coordinate order, events use
exact rational parameter order and incidence arrays use stable key order. Storage
order expresses no blocking, side selection or geometric priority.

## Verification and replay

`npm test` runs fixed fixtures, fast-check properties, exhaustive candidate-count
checks and the persistent independent oracle in `tests/support/oracle.ts`. The oracle
imports only coordinate value construction/keying, exact rational arithmetic and
production type declarations; it does not import production clipping, half-plane
constants, bounds, count, finite-edge or event algorithms. Its independent search
is the endpoint axial rectangle expanded by one. It intersects clockwise finite
polygon sides using orientations/interpolation, includes inside query endpoints,
and classifies using extrema and an exact midpoint. Collinear side projection uses
a dot product rather than production's nonzero-component division. Oracle events
scan records at each distinct parameter rather than accumulating incidences.

The 6,561-case candidate-count oracle independently tests the defining embedded
inequalities over a bounded larger axial box. It counts false positives too.
Resource tests spy on the row iterator and clipper to establish that rejected
queries reach neither. Enormous tests use separations of `10^100` and larger
translations without expanding their regions.

All nine fast-check properties pin seeds: 1101–1103, 1201, 1301 and 1401–1404.
Failures print the seed, shrinking path and bigint counterexample; Vitest prints
exact expected/actual records with IDs and rational fields. To replay, select the
failing test with `npm test -- -t '<test name>'` and add its reported `path` to that
property's `fc.assert` options while retaining its seed. No production predicate
or expected fixture needs to change to replay a failure.
