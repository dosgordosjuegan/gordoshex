# M1 completion report

## 1. Files created or modified

Modified: `README.md` with current status, build instructions and an exact-query example.
Root-level `AGENTS.md` records the required development, verification and PR workflow.
The approved `docs/specification.md`, `docs/geometry.md` and `docs/testing.md` are
retained verbatim and excluded from automatic reformatting.

Created:

- Tooling: `package.json`, `package-lock.json`, `.nvmrc`, `tsconfig.json`,
  `tsconfig.build.json`, `vitest.config.ts`, `eslint.config.mjs`, `.prettierrc.json`,
  `.prettierignore`, `.github/workflows/check.yml`.
- Library: `src/index.ts`; `src/geometry/integer.ts`, `rational.ts`, `coordinates.ts`,
  `sightline.ts`, `polygon.ts`, `clipping.ts`, `candidates.ts`, `enumeration.ts`,
  `edges.ts`, `events.ts`, `query.ts`.
- Tests: `tests/arithmetic.test.ts`, `tests/clipping.test.ts`,
  `tests/candidates.test.ts`, `tests/geometry.test.ts`,
  `tests/support/fixtures.ts`, `tests/support/oracle.ts`.
- Measurements: `benchmarks/run.mjs`, `benchmarks/results.json`.
- Documentation: `docs/implementation.md`, `docs/performance.md`, this report.

`dist/` is generated and ignored. There are no board, ruleset, visibility, UI,
rendering, internationalization, frontend-framework or deployment implementations.

## 2. Public geometry API

The entry point is `src/index.ts` (built ESM/declarations: `dist/index.js` and
`dist/index.d.ts`). The normal entry point is
`traceSightline(origin, target, maxCandidates = 1000n)`; lower-level exact arithmetic,
coordinates, clipping, preflight, enumeration, edge and event APIs are listed in
[implementation.md](implementation.md#public-geometry-api).

A completed result explicitly carries `status: 'complete'`, a top-level
`degenerate` flag, exact candidate count and complete cell/edge/event records.
A denied query carries `status: 'resource-limit'`, exact candidate count and limit,
with no partial result. Invalid arithmetic/configuration throws an explicit
input error. Immutable records preserve all simultaneous incidences and absent
lattice cells. All geometric predicates use bigint/rationals exclusively.

## 3. Selected tooling

Node.js 22.13.1 LTS, npm 10.9.2, TypeScript 5.9.3, Vitest 5.1.2, fast-check 4.11.0,
ESLint 10.15.0, @eslint/js 10.0.1, typescript-eslint 8.74.0, Prettier 3.10.1 and
@types/node 22.13.1. Strict ES2022 compilation; the library build has neither DOM
nor Node ambient types. Exact development dependencies and transitive resolutions
are locked. There are zero runtime dependencies. The selected development tree
reports zero npm audit vulnerabilities at installation.

## 4. Fixed fixture results

| Fixture | Candidates | Cell hits | Edge hits | Events | Verified facts                                                                                                  |
| ------- | ---------: | --------: | --------: | -----: | --------------------------------------------------------------------------------------------------------------- |
| G1      |          3 |         3 |         2 |      4 | All approved interior intervals, proper crossings at 1/4 and 3/4, u=1/2, supporting signs                       |
| G2      |          6 |         4 |         5 |      4 | Both [1/3,2/3] overlap neighbors, opposite determinant sides, one edge overlap and four vertex touches          |
| G3      |         12 |         8 |         9 |      7 | Both isolated vertices, six edge touches, three proper crossings, all three incidences at each vertex           |
| G4      |         10 |         6 |         5 |      7 | Approved asymmetric fractions and sides; explicit reversed (1,0) and (1,1) intervals                            |
| G5      |          1 |         1 |         0 |      0 | Separate strict-interior degenerate-point record [0,1], including huge translations; limit zero rejects         |
| G6      |          — |         — |         — |      — | Canonical identities/endpoints, opposite local references, numeric/negative ordering and invalid-pair rejection |

The rotated G2 companion is checked explicitly. Arithmetic fixtures include
normalization, denominator/division errors, signed floor/ceiling, exact large
translations, near-cancelling determinants with result one and rational comparisons
whose cross-product difference is one. Strict boundary adapters reject unsafe or
noninteger numbers, nonfinite values, noncanonical strings and trailing newlines.

## 5. Property-based results

All nine fixed-seed properties pass: **2,650 generated cases**, with shrinking and
replay paths provided by fast-check. Seeds are 1101–1103, 1201, 1301 and 1401–1404.
Coverage includes integer round trips, lattice metrics/adjacency, rational laws,
exact clipping, candidate-count translation/reversal, limit boundaries, all six
rotations, reflection, huge translations, full-result reversal, finite edge/cell
consistency, open-span coverage and shuffled event grouping. Symmetry-derived
boundary cases and explicit fixtures supplement random generation.

## 6. Independent oracle comparisons

The persistent exact oracle matches complete production records for **all 625
ordered endpoint pairs with q/r in [-2,2]**. It independently searches the axial
endpoint rectangle expanded by one, intersects all six finite polygon sides,
includes inside endpoints and classifies by exact extrema/midpoint. It does not
use production clipping, bounds, candidate count, edge geometry/intersection or
event grouping. Comparisons include every cell field, boundary metadata, exact
edge fields and grouped incidences. Every expected hit is also checked against
the production candidate set.

Additional comparisons cover fixed fixtures, huge/signed translations, X/Y-constant
queries, reversal and 800 generated transformed queries. An independently expressed
candidate-inequality oracle matches the closed form and candidate sets for **all
6,561 ordered endpoint pairs with q/r in [-4,4]**. Resource tests confirm bounded
preflight rejection at separation `10^100`, including large translations and
reversal, with no candidate iterator or clipper calls. A bounded breadth-first
search independently checks the distance formula.

## 7. Performance measurements

[performance.md](performance.md) gives the complete protocol and dataset table;
[raw results](../benchmarks/results.json) retain samples, snapshot identity,
hardware/runtime/tool versions, endpoints, counts, output checksums and memory
observations. The host is an Intel i7-2600 at 3.40 GHz, eight logical CPUs, about
16.1 GB physical RAM, Ubuntu 26.04.1, Node 22.13.1 and npm 10.9.2. Native compiled
ES2022 ESM; three warmups; 50 single-query or 15 whole-pass samples; median and
nearest-rank p95.

| Workload                                  | Median ms |  P95 ms |
| ----------------------------------------- | --------: | ------: |
| 117-query whole pass                      |    41.125 |  55.680 |
| 468-query whole pass                      |   310.936 | 350.748 |
| 468-query pass, huge translation          |   336.499 | 378.804 |
| Exact 1,000-candidate horizontal boundary |    51.639 |  58.807 |
| 962-candidate diagonal                    |     4.485 |   5.128 |
| Enormous preflight rejection              |     0.007 |   0.009 |

These are geometry timings, with full edge/event construction, independent of
future board/ruleset orchestration. No optimization was introduced.

## 8. Resource recommendation

The measured default is **1,000 candidates per sightline**, inclusive and
configurable as bigint. It admits every tabletop-shaped reference query with
roughly 5.3 times the largest observed count (190), and has a measured high-output
boundary. Count is an admission budget, not a latency or memory guarantee.
Keep explicit budgets for reproducible batches; no batch-wide limit is implied.
Do not raise the default to an unmeasured large value. Details and limitations
are in performance.md.

## 9. Deviations

No mathematical or scope deviations and no unresolved substantive contradictions.
Names and file layout are implementation choices allowed by M0. The conservative
reference enumerator and approved closed-form count remain intact. Approved M0
contract documents are unchanged. The lockfile is included for reproducible installs.
Development commits, branch publication and PR review follow root-level AGENTS.md;
merging requires explicit user approval.

## 10. Verification and remaining risks

Final local verification: all **31 tests** pass; strict type checking, ESLint,
Prettier verification and the standalone declaration/ESM build pass through
`npm run check`. The benchmark completed all 20 datasets, checking full-output
checksums outside every timed interval. CI is configured for the same checks;
remote GitHub Actions results are reported separately on the pull request.

The reference candidate region can grow quadratically with distance; explicit
resource rejection handles large output regions without truncation. Integer bit
length, batch size and allocation failures remain separate resource factors.
Allocation/internal exceptions propagate and cannot become a successful geometry
result. Cancellation remains deferred under O2. Timing samples come from one
machine, are not browser measurements and are not cross-machine guarantees.
Node security-patch maintenance remains routine toolchain upkeep. Board semantics,
visibility and UI scheduling are intentionally M2/M3 work. No remaining M1
mathematical ambiguity or failing check is known.
