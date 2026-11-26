# Mathematical reference and testing plan — M0

## Status, scope and test layers

**Agreed.** M1 must test distance/adjacency, translations, 60-degree rotations, reflections, reversal, rational interval reversal, interiors, overlaps, vertex contacts, simultaneity, degeneracy, missing cells, edge identity, enumeration completeness and large integers.

The exact expected values below follow [geometry.md](geometry.md). P4–P7 and P8/P9 are **Approved** with the resource-limit and result-state clarifications in the [decision register](specification.md#decision-register-and-m1-gate). Existing mathematical fixtures and invariants are preserved. These are specifications for future tests, not a claim that a TypeScript implementation or test suite already exists. M0 adds no dependencies.

| Layer | Responsibility | Planned milestone |
| --- | --- | --- |
| Arithmetic unit/reference tests | Rational normalization, comparison, signed division, exact products and rejection | M1 |
| Geometry examples | Explicit coordinates and exact expected hit/edge/event records | M1 |
| Geometry properties | Algebra, symmetries, reversal, clipping correctness and persistent independent exact oracle | M1 |
| Resource/performance checks | Exact bounded-cost counts, limit boundaries, no-enumeration rejection and reproducible baseline workloads | M1 |
| Board and ruleset tests | Absence versus emptiness, editing, stacks, edge features, independent range/LOS and explanations | M2 |
| Rendering/UI checks | Exact model independence, both orientations/locales, responsive editing and inspection | M3 |

The agreed M1 baseline uses a supported Node.js LTS release, npm with a committed `package-lock.json`, strict TypeScript targeting ES2020 or later with native BigInt, Vitest, **fast-check** for property generation/replay/shrinking, ESLint, Prettier and GitHub Actions. Select and record exact mutually compatible versions during M1. Geometry has zero runtime dependencies; these tools are development tooling. M0 installs nothing. M1 must not initialize Vite or select a frontend framework. Tests run without a browser and without Memoir '44 knowledge.

## Fixture notation and independent checking

All named cells are **axial** pairs unless explicitly identified as embedded points. `A` and `B` in table headings denote endpoint cells; apply `C(q,r)=(2q+r,3r)` to obtain centers. Fractions are reduced exact rationals. `+`, `-`, `0` in side columns are determinant signs, not signed distances.

“No hit” means no entry/exit interval, not `[0,0]`. For a complete-list fixture, all cells not listed are no-hits, including absent cells. Intersected cells are listed independently of board membership.

Expected intervals can be verified by substituting `L(t)-H` into the six inequalities. Edge cases can independently be checked by integer orientation determinants and exact segment–edge intersection, then midpoint strict-interior tests. A test must compare against fixed expected values, not generate its own expected output by the production clipper.

## Distance and adjacency reference cases

| A | B | Difference `(dq,dr,ds)` | Expected distance |
| --- | --- | --- | --- |
| `(0,0)` | `(0,0)` | `(0,0,0)` | `0` |
| `(0,0)` | `(1,0)` | `(1,0,-1)` | `1` |
| `(0,0)` | `(0,1)` | `(0,1,-1)` | `1` |
| `(0,0)` | `(-1,1)` | `(-1,1,0)` | `1` |
| `(0,0)` | `(-1,0)` | `(-1,0,1)` | `1` |
| `(0,0)` | `(0,-1)` | `(0,-1,1)` | `1` |
| `(0,0)` | `(1,-1)` | `(1,-1,0)` | `1` |
| `(0,0)` | `(2,-1)` | `(2,-1,-1)` | `2` |
| `(-2,3)` | `(4,-1)` | `(6,-4,-2)` | `6` |

Test identity of indiscernibles, symmetry, nonnegativity, integer output and triangle inequality. A coordinate has exactly six unique neighbors, each at distance one, with reciprocal adjacency; there are no other distance-one cells. Cross-check the max formula against the half-sum formula and, on small bounded examples, unrestricted lattice breadth-first distance using a sufficiently large search region. Do not use board connectivity as the distance oracle.

## G1 — horizontal interior crossings

`A=(0,0)`, `B=(2,0)`. Embedded `L(t)=(4t,0)`. Distance `2`. Complete hit list:

| Cell | Class | Entry | Exit | Side |
| --- | --- | --- | --- | --- |
| `(0,0)` | Interior | `0` | `1/4` | `0` |
| `(1,0)` | Interior | `1/4` | `3/4` | `0` |
| `(2,0)` | Interior | `3/4` | `1` | `0` |

Explicit no-hit probe: `(0,1)`, center `(1,3)`. For the middle cell the strict-interior portion is `1/4<t<3/4`; the reported interval includes the boundary endpoints.

At `t=1/4`, `P=(1,0)`: the edge between `(0,0)` and `(1,0)` has endpoints `(1,-1),(1,1)`. It is a **proper crossing**, with canonical endpoint orientation giving `u=1/2`. The canonical edge-support signs at A/B are `+/-`. The edge between `(1,0)` and `(2,0)` is crossed at `t=3/4`, also `u=1/2`. These are the only intersected edges.

Expected event parameters: `{0,1/4,3/4,1}`. At `1/4`, the origin cell exits, middle cell enters and one edge is crossed in the **same** event.

Approved enumeration bounds give `r=0`, `q=0,1,2`, exactly these candidates. Reversing endpoints changes the middle interval to itself and the endpoint intervals to `[3/4,1]` and `[0,1/4]` for their original identities.

## G2 — positive-length shared-edge overlap

`A=(0,0)`, `B=(2,-1)`. Embedded `L(t)=(3t,-3t)`. Distance `2`. Complete hit list:

| Cell | Class | Entry | Exit | Side |
| --- | --- | --- | --- | --- |
| `(0,0)` | Interior | `0` | `1/3` | `0` |
| `(1,-1)` | Edge overlap | `1/3` | `2/3` | `-` |
| `(1,0)` | Edge overlap | `1/3` | `2/3` | `+` |
| `(2,-1)` | Interior | `2/3` | `1` | `0` |

For H=`(1,0)`, local `pX+pY=-2` along the entire overlap; for H=`(1,-1)`, `pX+pY=2`. Neither cell has a strict interior sightline point. Their determinant values are respectively `+6` and `-6`.

Their canonical shared edge is `1,-1|1,0`, from embedded `U=(1,-1)` to `V=(2,-2)`. It overlaps for `[1/3,2/3]`, with edge coordinate u going from 0 to 1. Both edge-support endpoint signs are zero. Report this one edge once, alongside both cell overlaps.

At `t=1/3`, the vertex `(1,-1)` is incident to `(0,0)`, `(1,-1)` and `(1,0)`. The two other edges there have point touches; the shared edge starts its overlap. At `t=2/3`, vertex `(2,-2)` similarly has two point touches and the shared overlap ending. There are **five distinct intersected edges** overall: one overlap and four vertex touches. These are not proper crossings.

Expected event parameters: `{0,1/3,2/3,1}`. At `1/3`, origin exit and both overlap-cell entries are simultaneous. Approved enumeration candidates are `(0,-1),(1,-1),(2,-1),(0,0),(1,0),(2,0)`; `(0,-1)` and `(2,0)` are no-hits. This checks that candidate membership alone does not imply a contact.

A rotated companion fixture is `A=(0,0)`, `B=(1,1)`, with overlap cells `(0,1)` on side `+` and `(1,0)` on side `-`, both `[1/3,2/3]`. This follows by applying `R(q,r)=(-r,q+r)` to G2.

## G3 — isolated vertex contacts and simultaneous events

`A=(0,0)`, `B=(4,1)`. Embedded `L(t)=(9t,3t)`. Distance `5`. Complete hit list:

| Cell | Class | Entry | Exit | Side |
| --- | --- | --- | --- | --- |
| `(0,0)` | Interior | `0` | `1/9` | `0` |
| `(1,0)` | Interior | `1/9` | `1/3` | `-` |
| `(1,1)` | Isolated vertex | `1/3` | `1/3` | `+` |
| `(2,0)` | Interior | `1/3` | `1/2` | `-` |
| `(2,1)` | Interior | `1/2` | `2/3` | `+` |
| `(3,0)` | Isolated vertex | `2/3` | `2/3` | `-` |
| `(3,1)` | Interior | `2/3` | `8/9` | `+` |
| `(4,1)` | Interior | `8/9` | `1` | `0` |

At `t=1/3`, embedded `P=(3,1)`. For cell `(1,1)`, center `(3,3)`, local P is bottom vertex `(0,-2)`. Its determinant is `9*3-3*3=18>0`. No positive-length intersection exists there. The same event has cell `(1,0)` exiting and `(2,0)` entering. It contains all three point-touch edges:

| Canonical EdgeId | Intersection | Proper crossing? |
| --- | --- | --- |
| `1,0|1,1` | Vertex `(3,1)`, `t=1/3` | No |
| `1,0|2,0` | Vertex `(3,1)`, `t=1/3` | No |
| `1,1|2,0` | Vertex `(3,1)`, `t=1/3` | No |

For the vertical edge `1,0|2,0`, endpoint side signs are opposite, so the sightline crosses its **supporting line**. It still touches an edge endpoint (`u=1` in canonical orientation), rather than properly crossing the finite edge interior. This tests the distinction explicitly.

At `t=2/3`, embedded `P=(6,2)`, cell `(3,0)` has local top vertex `(0,2)` and determinant `-18`. Both singleton cell records must survive reversal and event grouping. At `t=1/2`, the edge between `(2,0)` and `(2,1)` is crossed in its relative interior at `(9/2,3/2)` with `u=1/2`.

Expected event parameters: `{0,1/9,1/3,1/2,2/3,8/9,1}`. At `1/3` there are three closed cell memberships; on the open interval just before it only `(1,0)` is active, and just after it only `(2,0)` is active. There are nine distinct intersected edges overall: six vertex touches and three proper crossings (`1/9,1/2,8/9`).

## G4 — asymmetric rational intervals and reversal

`A=(0,0)`, `B=(3,1)`. Embedded `L(t)=(7t,3t)`. Complete hit list:

| Cell | Class | Entry | Exit | Side |
| --- | --- | --- | --- | --- |
| `(0,0)` | Interior | `0` | `1/7` | `0` |
| `(1,0)` | Interior | `1/7` | `2/5` | `-` |
| `(1,1)` | Interior | `2/5` | `1/2` | `+` |
| `(2,0)` | Interior | `1/2` | `3/5` | `-` |
| `(2,1)` | Interior | `3/5` | `6/7` | `+` |
| `(3,1)` | Interior | `6/7` | `1` | `0` |

With endpoints reversed, cell `(1,0)` must give `[3/5,6/7]`, side `+`; cell `(1,1)` must give `[1/2,3/5]`, side `-`. Compare exact numerators/denominators, not approximate decimal values. Reversing twice restores every cell/edge/event record, up to representation ordering.

## G5 — degenerate sightline

`A=B=(0,0)`: distance zero; one approved `degenerate-point` record for `(0,0)`, strict-interior location, parameter preimage `[0,1]`, side zero. No edges and no ordinary nondegenerate event list. Every other cell is a no-hit. Repeat after a translation larger than `2^53`, and with `(0,0)` absent from a board: geometry is unchanged; an M2 visibility query with missing endpoints is invalid under P8.

Test that this is neither an edge overlap nor an isolated vertex contact. Reversal leaves `[0,1]` unchanged. Do not feed D=0 into the collinear edge algorithm's nonzero-component division.

## G6 — canonical edge identity and boundary topology

The following local references must all resolve as indicated:

| First reference | Opposite reference | Canonical EdgeId | Embedded endpoints |
| --- | --- | --- | --- |
| `(0,0)`, direction 0 | `(1,0)`, direction 3 | `0,0|1,0` | `(1,-1),(1,1)` |
| `(0,0)`, direction 1 | `(0,1)`, direction 4 | `0,0|0,1` | `(0,2),(1,1)` |
| `(1,0)`, direction 4 | `(1,-1)`, direction 1 | `1,-1|1,0` | `(1,-1),(2,-2)` |

Embedded endpoints in this table are unordered geometric sets. Canonical endpoint orientation is computed separately. Normalize reversed cell-pair input to the same ID. Reject `(0,0)|(0,0)` and `(0,0)|(2,0)` as invalid edges.

Numeric sorting example: adjacent `(9,0)` and `(10,0)` give `9,0|10,0`, despite decimal string ordering. Negative-coordinate example: `(-1,0)` and `(0,0)` give `-1,0|0,0`. A feature referenced through either adjacent cell must resolve to one stored feature, even when one neighbor is absent.

## Arithmetic and large-integer fixtures

| Input or operation | Expected result |
| --- | --- |
| Rational `2/6` | `1/3` |
| Rational `1/-3` | `-1/3` |
| Rational `-2/-6` | `1/3` |
| Rational `0/-7` | `0/1` |
| Rational denominator `0` | Explicit error |
| Compare `1/3` and `2/6` | Equal |
| `floorDiv(-1,3)`, `ceilDiv(-1,3)` | `-1`, `0` |
| `floorDiv(-4,3)`, `ceilDiv(-4,3)` | `-2`, `-1` |
| `floorDiv(-6,3)`, `ceilDiv(-6,3)` | `-2`, `-2` |

Let `N=9007199254740993` (a bigint/string value, never an already-rounded number).

- Distance from `(N,-N)` to `(N+2,-N-1)` is `2`.
- Translate G1 by `(N,-N)`. All three classifications, intervals and sides remain identical; embedded center offsets are `(N,-3N)`. This is a small-output test of huge coordinates.
- `det((N,N-1),(N+1,N))=N^2-(N-1)(N+1)=1`. This forces enormous nearly cancelling products; a number-based path can lose the sign.
- Compare `N/(N+1)` and `(N-1)/N`. The first is strictly greater, with cross-product difference exactly `1`.
- Distance `(0,0)` to `(N,-N)` is `N`. Test the distance directly; do not enumerate a sightline with that many cells in the routine suite.

Arithmetic boundary adapters must reject unsafe number input, noninteger numbers, NaN/infinity and malformed decimal strings. Test canonical string round trips, zero normalization, rational equality across allocations and event merging of `1/3` with an independently produced `2/6`. Raw `JSON.stringify` on bigint is not a serialization implementation; the future explicit codec must round-trip strings without precision loss.

## Mathematical property-based tests

Generate bounded signed axial endpoints and candidate cells, deliberately including zero differences, neighbors, negative coordinates, all six directions, mixed-sign slopes, equal/parallel constraints and larger bigint translations. Include symmetry-derived edge and vertex cases; uniform random endpoints alone rarely exercise them. Use fixed seeds and shrinking that retains a reproducible exact failure. Log a replay seed, endpoints, cell/edge IDs and rational results.

1. **Translation:** transform endpoints, cells and edges by an arbitrary axial integer vector. Contact sets, classes, intervals and sides are unchanged after remapping identities.
2. **Rotation:** apply `R(q,r)=(-r,q+r)` one through six times. Distances, classes, parameters and determinant sides are preserved. Six applications restore all identities.
3. **Reflection:** apply `F(q,r)=(q+r,-r)`. Distances/classes/parameters are preserved; determinant signs negate. Two applications restore the query. Regenerate canonical edge ordering after the transform.
4. **Reversal:** compare hit sets for A→B and B→A by cell value. `[a,b]` becomes `[1-b,1-a]`, side negates, overlap endpoints reverse and grouped event t becomes `1-t`. Do not merely compare counts. Include singleton contacts, endpoint cells and the degenerate record.
5. **Clipping soundness:** every returned interval is ordered within `[0,1]`; its endpoints satisfy every closed inequality exactly. Interior-class midpoints satisfy all strict inequalities; edge-overlap points share a supporting equality; vertex singletons equal a listed integer vertex. Check excluded directions immediately beyond entry/exit through an independent interval/edge oracle, rather than an arbitrary numerical epsilon.
6. **Clipping classification:** the four nondegenerate classes are mutually exclusive and exhaustive in the agreed center-to-center domain. Each candidate has at most one closed interval. Distinct cell strict interiors cannot overlap at the same t; boundary intervals may coincide.
7. **Shared-edge identity:** both local references yield equal value IDs and endpoint sets; invalid pairs are rejected. Every intersected edge appears once regardless of incident hit count; endpoints are exactly the shared polygon side.
8. **Edge/cell consistency:** an edge contact point lies in both incident closed cell intervals. Every vertex event retains all incident cells and three distinct lattice edges. A proper crossing has both parameters strictly internal; a supporting-line transition at a vertex remains a touch.
9. **Simultaneity:** shuffling candidate and edge iteration order leaves the same grouped facts. Each exact t occurs once in the event index. Overlaps remain intervals; singleton cells appear in both entry/exit sets. No insertion order selects a blocking side.
10. **Whole-segment coverage:** for nondegenerate queries, the union of returned closed cell intervals covers `[0,1]`. On every open event span, a rational midpoint is in one strict-interior cell or exactly two overlapped-edge cells. Three cells may meet at a vertex event. A coverage test alone does not prove completeness; it can miss grazing cells.
11. **Large values:** rerun small-shape fixtures with huge translations, rational scaling/reduction and cancelling determinant products. Use string/bigint generators throughout. Keep coordinate magnitude independent from segment length so tests remain tractable.

These are mathematical invariants. Symmetry of *rendering* does not justify reusing rounded screen positions as a mathematical oracle. Candidate **sets** need not be rotationally invariant because the conservative bounding region is axis-aligned; final hit/edge/event sets must be invariant.

## Independent candidate-enumeration completeness checks

The proof in [geometry.md](geometry.md#complete-finite-candidate-enumeration--p6) is the primary guarantee. **M1 must retain a persistent independent exact oracle in the test suite**, equivalent in purpose to the temporary M0 calculation. It must not call production clipping or production candidate-bound helpers to generate expected results. Store and maintain its independent segment–polygon-side method and independent search-region logic as test support. Tests provide bounded evidence and guard implementation errors:

- Exhaust all ordered endpoint pairs with q/r in `[-2,2]`. Independently enumerate the axial q/r endpoint box expanded by one, justified by the local `2/3` bound. This oracle does not derive its search box from the production embedded bound.
- Classify every oracle cell with a separate exact method: intersect the sightline with all six finite polygon sides, include inside segment endpoints, then use exact parameter extrema and midpoint tests. Avoid invoking the production clipping function or production bound helper to decide the expected set.
- Assert that every oracle hit is a production candidate, and that clipping the production candidates yields **exactly** the oracle hit records, including singleton vertices and both overlap neighbors. Candidates may include false positives.
- Compare all exact edge intersections and grouped parameters by value. Add large translated versions, negative r bounds, X or Y constant, symmetry transforms, and G2/G3 boundary equality examples.
- Direct bound-helper tests check signed ceil/floor, inclusive extrema and empty integer intervals; candidate enumeration contains no duplicates and is finite for every accepted finite input.
- For `A=B`, verify the specified degenerate shortcut independently. For a simulated resource rejection, assert explicit failure with no complete visibility verdict; do not run an enormous exhaustive test to exhaust the machine.

A second implementation sharing the same bound and clipping routine is not an independent oracle. Sharing canonical value types is acceptable, but expected results must not depend on production clipping/bound decisions. Exhaustive small cases cannot replace the general completeness proof. Choose limits high enough for both sides of every symmetry/oracle comparison. Optimized traversal is excluded from M1; a later traversal must match the reference enumerator's complete facts, not just a blocked boolean.

## Candidate-count and resource-limit tests — M1

Test the closed form in [geometry.md](geometry.md#exact-bounded-cost-candidate-count) against independently enumerated **candidate counts** on a small exhaustive endpoint domain. The counting oracle uses independently expressed signed mathematical bounds, not production count/bound helpers. It must count false-positive candidates too; the separate polygon-side hit oracle cannot substitute for this count check.

| Query (axial endpoints) | Exact candidate count N | Expected boundary behavior |
| --- | --- | --- |
| G1 `(0,0)` to `(2,0)` | 3 | Limit 3 admits; limit 2 rejects (N is immediately above limit) |
| `(0,0)` to `(3,0)` | 4 | Limit 3 rejects; complements G1 at the same configured limit |
| G2 `(0,0)` to `(2,-1)` | 6 | Limit 6 admits; limit 5 rejects |
| G3 `(0,0)` to `(4,1)` | 12 | Limit 12 admits although only 8 cells are actual hits; limit 11 rejects |
| G4 `(0,0)` to `(3,1)` | 10 | Limit 10 admits; limit 9 rejects |
| G5 `(0,0)` to itself | 1 | Limit 1 admits the point record; limit 0 rejects before the shortcut |
| G1 translated by `(-5,-4)` | 3 | Signed row/bound arithmetic; same boundary behavior |
| G2 translated by `(-5,-4)` | 6 | Both endpoints negative; same boundary behavior |
| G1 translated by `(9007199254740993,-9007199254740993)` | 3 | Exact large translation; no conversion to number |
| G1 rotated to `(0,0)` to `(0,2)` | 7 | Limit 3 rejects despite admitting unrotated G1; limit 7 admits |

For every small fixture/property case, compare limits `N-1`, N and `N+1`. The results must be failure, success and success respectively. Zero is a valid limit, not a configuration error. Negative, fractional or malformed limits are invalid input/configuration; no candidate work occurs. Reversal and every integer lattice translation preserve N; rotation need not. Existing mathematical symmetry properties apply to completed results with sufficient limits.

Let `T=10^100`, an exact even bigint value:

- Horizontal endpoints `(0,0)` to `(T,0)` have N=`T+1`, without iterating over the enormous row width.
- Endpoints `(0,0)` to `(0,T)` have `n=T+1`, `W=T+3`, `E=T/2`, hence N=`(T*T+4*T+2)/2`, without iterating over T+1 rows.
- Repeat both with a much larger exact signed translation and reversed endpoints; counts and resource decisions remain identical.
- With any small explicit limit, require immediate resource-limit rejection through bounded-cost preflight. Assert that no row/candidate enumerator, clipping callback or candidate-sized allocation is reached. Code review must confirm no loop/recursion scales with row count; bounded completion tests and instrumentation guard against accidental scanning, without a brittle performance threshold.

A failure must identify the `resource-limit` cause, exact N and configured limit, expose no complete geometry result and never silently truncate to the first K candidates. In the M2 visibility integration, assert `evaluation-failure` and absence of a valid visibility verdict. Inject cancellation/other internal failure separately to verify that neither becomes clear, blocked or ruleset-invalid LOS. Test default limits only after measurements select them; explicit limits make all tests reproducible now.

## Reproducible performance baseline — M1

Require measurements for representative tabletop-sized **single sightlines and whole-board visibility workloads**. This is baseline evidence for defaults and later comparison, not an optimization mandate or a change to the reference algorithm. M1 has no board/ruleset implementation: its whole-board workload means evaluating one observer-to-target geometry query for every coordinate in a fixed finite board-shaped target set. M2 can additionally measure complete board/ruleset orchestration.

Required baseline datasets include G1–G4, both a short and a long sightline inside each of the following target sets, and the full observer-to-every-target workload:

| Target set (axial) | Observer | Number of queries per whole-board pass |
| --- | --- | --- |
| `0<=q<13`, `0<=r<9` | `(6,4)` | 117, including self |
| `0<=q<26`, `0<=r<18` | `(13,9)` | 468, including self |

These are generic benchmark shapes, not claims about any game's board. Include edge-overlap/vertex-contact datasets and a large translated copy to separate magnitude cost from shape/length. Choose and record explicit candidate limits sufficient for all benchmark queries; report candidate/hit/edge/event counts so rejection or incomplete work cannot appear as a speed improvement. Include at least one separately labeled preflight-rejection workload with enormous separation.

Record repository revision or source snapshot identity, OS/CPU/memory, exact Node/tool versions, compilation/execution mode, seeds, endpoint/target lists, limit settings, warmup count, measured repetition count and aggregation method. Run from a documented reproducible command and retain raw timing samples plus median and an explicitly defined tail statistic (for example p95); report per-sightline and whole-pass timings separately. Record memory observations where measured and distinguish them from estimates. Check outputs outside the timed region or via a documented fixed checksum to establish equal work. Avoid hard cross-machine timing gates in unit tests. Select numeric default limits only after reviewing these measurements; do not add an optimized traversal in M1.

## Board and ruleset-specific reference tests — M2

The following expected outcomes follow **approved P2/P8/P9** and must not be asserted as universal geometric laws. Unless a row tests rejection, configure a candidate limit large enough for completion.

| Setup | Expected generic-policy behavior |
| --- | --- |
| G1 with cells `(0,0),(1,0),(2,0)` all empty | Distance 2, clear under all three policies |
| G1 with middle `(1,0)` absent; endpoints present | Same geometric hits, explicit absent membership, clear under all three |
| G1 with one generic obstacle in existing `(1,0)` | Blocked under all three; obstacle ID and `[1/4,3/4]` evidence reported |
| G2 with only obstacle `(1,0)` | Clear under interior-only; blocked under interior+edge and any-contact |
| G2 with obstacles in both `(1,0)` and `(1,-1)` | Both IDs reported under the latter two policies, regardless of insertion order |
| G3 with only obstacle `(1,1)` | Clear under first two; blocked under any-contact, evidence `[1/3,1/3]` |
| G1 with obstacles only in origin/target | Clear under all three, because endpoints are ignored |
| G5 with an obstacle in the owning cell | Clear, distance 0, in range even for radius 0 |
| Any completed supported query with unlimited range | Range passes independently of clear/blocked/ruleset-invalid LOS |
| G1 with range 1 and middle obstacle | Both out-of-range and blocked; retain both explanations |
| G1 with range 1 and no obstacle | Out-of-range and clear; visible is false |
| G1 with range 2 and no obstacle | In-range and clear; visible is true |
| Distinct adjacent target with radius 0 | Out-of-range; LOS still evaluated |
| Missing origin or target | Invalid visibility query; raw geometry still accepts those coordinates |
| Negative/fractional range or malformed configuration | `invalid-query-input`; no evaluated visibility verdict |
| Well-formed unknown ruleset/version or unsupported option | `unsupported-ruleset-or-configuration`; distinct from invalid input and evaluation failure |
| Edge feature on a crossed or overlapped edge | Evidence retained, feature ignored with explanation by these generic examples |

For stacked elements, use an intermediate cell with transparent element T and obstacles O1/O2; both obstacle IDs block under a matching policy. Reorder `[T,O1,O2]` and verify unchanged generic LOS while state order changes. A future stack-sensitive adapter may intentionally differ.

For board holes/disconnected regions, compare identical endpoint queries across boards with different memberships and equal endpoint cells. Raw geometric records stay identical. Use two dedicated test adapters on G1 with absent middle `(1,0)`: one returns blocked with coordinate-only absent-cell evidence `[1/4,3/4]`; the other returns `invalid-under-ruleset` with the same coordinate/interval and a semantic cause code. Neither needs an existing element ID. The three generic rulesets still return clear. Repeat with range 1: the blocking adapter returns blocked plus out-of-range; the invalidating adapter returns ruleset-invalid plus out-of-range with visibility not applicable. This verifies delegation and independent range/LOS evaluation.

For topology, removing a cell deletes its elements; a feature on an edge with a surviving neighbor remains; removing the last incident cell deletes the feature under P2. Membership of a present empty cell remains distinct from absence after serialization. Reject duplicate coordinates/IDs and malformed edge records. Test axial and offset generator formulas, zero dimensions and independence of membership from display orientation.

For explanations, require stable codes and exact location/event references for every blocker or invalidity cause, including absent-coordinate evidence and simultaneous causes. English and Spanish resolve the same codes without influencing verdicts. A target can be both blocked and out-of-range even if the UI chooses one primary color. Directional game rules may violate reversal; terrain/facing rules may violate rotation or reflection. Test those policies only when promised by that ruleset. Memoir '44 tests await researched, approved rules.

## Rendering boundary checks — M3

Render G1 and a copy translated beyond `2^53` using matching exact local display origins; relative cell/vertex positions should agree. Verify that subtracting the origin occurs in bigint/rational model coordinates **before** floating-point conversion, rather than subtracting rounded absolute numbers. Check rebasing/panning, zoom, pointy/flat orientation and locale changes while comparing exact mathematical visibility results. View culling/conversion details remain M3 choices; rendering must never alter geometry or ruleset inputs.

## M1 review and completion evidence

M1 must supply exact reference assertions for G1–G6, arithmetic fixtures, replayable fast-check properties, the persistent independent exact oracle, exhaustive bounded comparisons and resource-boundary tests; publish reproducible performance evidence and record compatible runtime/compiler/test/lint/format tool versions and configuration. Verify the geometry module imports no DOM or ruleset code. A failed property must yield a small coordinate counterexample. Do not use screenshots or floating-point tolerance assertions as evidence of exact arithmetic.

M0 verification is limited to reviewing these contracts, deriving the displayed fractions/signs and independently checking finite examples. A temporary exact-rational calculation checked all 625 ordered endpoint pairs with q/r in `[-2,2]`, comprising 13,225 oracle-cell checks. Half-plane clipping and a separate segment–polygon-side method agreed; the candidate bounds included all oracle hits; reversal, rotation and reflection matched exact records. G1–G4 hit tables were also calculated directly. This is bounded mathematical evidence alongside the general proof, not a TypeScript regression suite. No application test suite has been implemented or run in this milestone.

During the final M0 revision, the parity-based candidate-count formula was checked against direct defining-inequality enumeration for all 6,561 ordered endpoint pairs with q/r in `[-4,4]`. Exact count fixtures, reversal, signed/huge translations, limit comparisons and the enormous-separation formulas above agreed. This verifies the documented formula on a finite domain; the derivation establishes its general validity. Performance measurements and the persistent oracle remain required M1 artifacts, not completed M0 work.
