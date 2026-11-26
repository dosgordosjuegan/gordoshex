# GordosHex specification — M0

## Status and terminology

This is the reviewed, documentation-only M0 specification. **Agreed** identifies project requirements; **Approved** records review decisions; **Approved in principle** preserves deferred detail; **Open** and **Deferred** identify remaining decisions. P1–P9 are approved with the P6/P8 clarifications incorporated below. P10 is approved in principle, with the complete schema deferred to M2. No application implementation, dependency installation or framework initialization belongs to M0.

The decision register below owns decision status. Approved contracts and their expected fixtures are the M1/M2 baseline. Exact tool versions and implementation details explicitly left open are not selected by implication.

## Identity and release scope

**Agreed.** GordosHex is developed by Dos Gordos Juegan in `dosgordosjuegan/gordoshex`. It provides freely accessible browser tools for hexagonal tabletop games. The first tool calculates line of sight and range; the first game-specific ruleset is Memoir '44. English and Spanish interfaces and desktop/mobile browsers are required. Intended hosting is GitHub Pages, without a backend, database, authentication or proprietary runtime dependencies.

The intended stack is TypeScript, SVG, HTML, CSS, Vite and Vitest. Dependencies should be minimal. M0 does not choose package versions or install tools.

**Agreed first-release capabilities:** resizable board generation; adding/removing individual cells; generic obstacle placement; observer selection; adjustable range, including unlimited; ruleset selection; editing ordered cell elements and basic shared-edge features; distinguishing blocked, out-of-range and visible cells; and selecting a target to inspect its sightline and explanation.

Scenario import/export, shareable URLs, PNG/SVG export and more game rulesets are future capabilities, not first-release commitments. Scenario serialization still has a separate architectural boundary now. General tabletop simulation, movement simulation, three-dimensional geometry, networking and accounts are outside this scope.

## Architecture and dependency contracts

**Agreed.** Separate geometry, board topology/state, rulesets, visibility evaluation, serialization, rendering/UI and internationalization. Geometry must be usable and testable without a browser, a board instance or knowledge of any game. Rulesets are replaceable; geometry cannot know about obstacles, elevation, units or Memoir '44.

**Approved (P1).** Use these logical modules; filenames and package structure can be chosen in M1–M3.

| Module | Owns | Allowed project dependencies |
| --- | --- | --- |
| Geometry | Integer coordinates, rationals, distance, polygons, clipping, edge identities, geometric events | None |
| Board | Finite membership, cell stacks, edge features, topology, editing invariants | Geometry |
| Rulesets | Game interpretation, range policy, blocking policies and semantic explanation codes | Geometry and board contracts |
| Visibility | Query validation, geometry orchestration, invoking selected ruleset, combining independent results | Geometry, board, ruleset contracts |
| Serialization | Versioned scenario encoding/decoding and validation | Geometry/board/ruleset data contracts; no UI |
| Internationalization | English/Spanish messages and explanation formatting | Semantic data contracts; no geometry decisions |
| UI/rendering | Editing, selection, SVG layout, responsive interaction and presentation | Public interfaces of the above |

Calls into a ruleset receive immutable query snapshots. A ruleset returns decisions rather than mutating board state. Geometry emits facts; rulesets interpret them; visibility orchestrates; UI formats explanations. No module below the UI requires the DOM, SVG APIs, Vite or translated text. Geometry must be testable in a non-browser environment.

Rendering pointy-top or flat-top is a presentation transform of the same axial model. **M3 requirement:** translate large exact lattice coordinates relative to a suitable local display origin using exact arithmetic before converting the differences to floating-point rendering coordinates. Converting absolute coordinates first and subtracting rounded numbers is insufficient. Display coordinates must never feed approximate positions into visibility predicates; rebasing, panning, zooming and orientation cannot change mathematical visibility results. Pointer selection resolves to a cell/edge identity before querying geometry.

## Board topology and state

**Agreed.** A cell is identified by integer axial `(q,r)`, with implicit cube coordinate `s=-q-r`. The board is an arbitrary finite subset of the infinite lattice, including holes, disconnected components and the empty set. Membership is independent of occupancy: an existing cell with an empty element list differs from an absent cell. Distance is unrestricted lattice distance, never a shortest path through board membership or obstacles.

Multiple ordered elements may occupy one cell. Stacking is ordering of game data, not a third coordinate. Elevation is a ruleset property. Rulesets may interpret neighboring cells, stack order and shared-edge features together.

**Approved (P2).** Model the board as a finite map keyed by coordinate value, plus a separate map keyed by canonical lattice edge identity. Each cell holds an ordered list of elements with stable IDs, a kind and ruleset-owned properties. Index zero means the first element; whether that is ground, bottom, earliest or highest priority is a ruleset convention. Reordering changes state; no visibility priority follows automatically. The evaluator passes every element to the ruleset.

Edge features also have stable IDs and ruleset properties; a list permits multiple features on one edge. An edge identity is the unordered pair of its two adjacent lattice coordinates, canonically sorted as in [geometry.md](geometry.md#canonical-shared-edges--p7). It exists geometrically even if one or both cells are absent. Board state may store features only on edges incident to at least one existing cell. Boundary edges may therefore carry features. Removing a cell removes its elements and deletes edge features only when neither incident cell remains. Removing the last cell yields empty cell/feature maps. This edge-feature deletion behavior is approved under P2; detached features are not retained.

Coordinate/edge identity uses value equality, not object reference identity. Stable element/feature IDs are unique within a scenario. Ruleset payloads must be validated at the ruleset/serialization boundary. Geometry does not inspect payloads.

**Approved (P3).** Provide clearly named generator families rather than an ambiguous “rectangle”:

- An axial rectangle: `{(q0+i,r0+j) : 0<=i<width, 0<=j<height}`. Its Euclidean display is generally a parallelogram.
- An offset rectangle with indices `(c,row)` over `width × height`. For pointy-top odd-row layout, map to `r=r0+row`, `q=q0+c-floor(row/2)`. For flat-top odd-column layout, map to `q=q0+c`, `r=r0+row-floor(c/2)`. Parity refers to local nonnegative indices; translate by `(q0,r0)` afterward.

Dimensions are nonnegative integers; either zero dimension generates an empty board; invalid dimensions are errors. These are staggered arrays, not a promise of a rectangular outer polygon. Changing display orientation on an existing board never regenerates membership. Generator naming, parity options and UI default remain M2/M3 decisions.

Reserve an extension boundary for vertex-associated data. Exact integer embedded vertex positions already offer a geometric identity; do not introduce vertex gameplay storage or editing in M0. Do not make extensibility depend on a permanent cell/edge-only feature assumption.

## Geometry contract

**Agreed.** Use the specified affine embedding and exact closed-segment/closed-polygon intersections. Include all intersected lattice cells, whether present or absent. Return exact rational entry/exit parameters, contact class and determinant side. No epsilon, perturbation, approximate raycasting or arbitrary geometric tie-breaking is allowed. Define `A=B` separately. Shared edges have canonical identities.

**Approved (P4–P7).** The arithmetic, clipping, finite candidate region and completeness proof, classification, degenerate record, edge intersections and simultaneous event contracts are in [geometry.md](geometry.md). M1 retains the conservative embedded bounding-region reference algorithm; no optimized lattice traversal is introduced. Before enumeration, require a configurable nonnegative bigint maximum candidate count per sightline and an exact bigint preflight count using the bounded-cost formula in geometry.md. Counting must not iterate over the candidate region or its rows. Reject a count above the limit before allocating/enumerating candidates or clipping; allow a count equal to the limit. A resource-limit failure has an explicit code and exact count/limit diagnostics, no truncated result and no valid visibility verdict. Default numeric limits will be selected after M1 measurements.

## Visibility queries and results

**Approved (P8, clarified by review).** A validated query supplies the complete board snapshot, ruleset ID/version/configuration, existing origin and target coordinates and a range parameter. Range is a nonnegative exact integer radius or an explicit unlimited variant; do not serialize floating-point `Infinity`. Missing origin/target cells produce `invalid-query-input`, distinct from absence encountered along a valid sightline. Geometry accepts any lattice endpoints independently of membership. Invalid input values (including malformed configuration) differ from well-formed but unsupported ruleset versions or configuration options.

The ruleset context additionally contains unrestricted lattice distance; complete cell intersections, including absent coordinates; exact edge intersections with incident cell identities; simultaneous event groups; and board feature/element references. Side, entry/exit, boundary incidence and ordered stacks are retained. Rulesets may need the full board, not just intersected obstacles.

The following six semantic outcomes must remain distinguishable; exact TypeScript field names remain an M1/M2 implementation detail:

| Semantic outcome | Contract |
| --- | --- |
| Clear sightline | Evaluation completed; LOS is `clear`; range is independently evaluated |
| Blocked sightline | Evaluation completed; LOS is `blocked`, with evidence; range is independently evaluated |
| Sightline invalid under ruleset | Evaluation completed; LOS is `invalid-under-ruleset`, with reasons/evidence, such as an absent-cell crossing forbidden by that ruleset; range is independently evaluated |
| Invalid query input | Query/board/range/configuration input violates the accepted input contract; no evaluated visibility result |
| Unsupported ruleset or configuration | Well-formed requested ruleset/version/option is unavailable; no evaluated visibility result |
| Evaluation failure | Evaluation could not complete, including `resource-limit`, cancellation or internal failure; no evaluated visibility result |

Conceptually, the outer result discriminates `evaluated`, `invalid-query-input`, `unsupported-ruleset-or-configuration` and `evaluation-failure`. Only `evaluated` carries an independent range decision and a LOS decision (`clear`, `blocked` or `invalid-under-ruleset`). A ruleset-invalid sightline is not malformed query input, an opaque obstacle or an engine failure. It may be reported even when the same query is out of range.

For accepted, supported queries whose evaluation completes, evaluate range and LOS independently; do not skip geometry because range fails or skip range because LOS is blocked or invalid under ruleset. Neither an obstacle nor absence changes lattice distance. A ruleset may impose its own range policy but cannot redefine geometric distance. If evaluation fails, any partial diagnostics are not a completed range/LOS result and cannot be used as a visibility verdict.

| Evaluated result field | Meaning |
| --- | --- |
| Distance and range | Exact distance; original range input; `in-range` or `out-of-range` with semantic reasons |
| Line of sight | `clear`, `blocked` or `invalid-under-ruleset`, independently evaluated |
| Blocking/invalidity evidence | Location references and supporting geometric record/event references; all relevant causes retained |
| Explanations | Stable semantic codes and structured arguments; no localized text from geometry or ruleset evaluation |

Evidence must support an existing element ID plus cell coordinate, an edge-feature ID plus EdgeId, or a **cell coordinate with no element/feature ID**, explicitly marked absent when applicable. Thus an adapter can block on absent coordinates or invalidate a sightline through them without inventing an obstacle ID. Retain exact interval/contact/event references and cause codes for each such fact. Group simultaneous causes; do not choose one “first blocker” using arbitrary iteration order. Generic P9 rulesets continue to treat absence as transparent.

For evaluated results with `clear` or `blocked` LOS, `visible = in-range AND clear`. For `invalid-under-ruleset`, visibility is **not applicable**, not a clear/blocked boolean. Invalid input, unsupported requests and evaluation failures likewise carry no valid visibility verdict; a failure must not masquerade as `visible=false` or a valid blocked result.

The approved UI projection for clear/blocked LOS shows out-of-range styling first while retaining both facts in inspection. In-range blocked and in-range clear targets have their respective blocked/visible styles. Rule-invalid sightlines and failed/invalid/unsupported queries require distinct inspection/status handling; exact M3 visual treatment is open. Localized English/Spanish presentation remains outside geometry and ruleset evaluation.

## Generic demonstration rulesets

**Agreed.** Provide three generic contact policies: interior only; interior plus positive-length edge overlap; and any contact. Memoir '44 rules are deferred and must not be inferred from these examples.

“Interior intersections block” is ambiguous without specifying what in the cell blocks. Making every existing empty cell opaque would make the calculator unusable. **Approved (P9):** apply these policies to explicit generic obstacle elements in intermediate existing cells. Report every matching obstacle; other cell elements are transparent for these examples.

| Situation | Approved common policy for all three generic rulesets |
| --- | --- |
| Origin and target | Must exist; ignore all obstacles in both endpoint cells |
| Existing empty cell | Transparent |
| Absent intermediate cell | Transparent, but retained in evidence; never truncates the sightline |
| Ordered elements | Any matching obstacle can block; order has no additional meaning |
| Shared-edge features | Passed through and explained as ignored by these examples; no automatic edge blocking |
| Elevation or other properties | No special meaning in generic examples |
| Range | Inclusive lattice radius `d<=R`; unlimited always passes |
| `A=B` | Distance zero, clear, in range for every valid range; endpoint content ignored |
| Unsupported generic payload | Validation error rather than an invented interpretation |

Other rulesets may block on absent coordinates or mark the sightline `invalid-under-ruleset`; this does not invalidate the query input. Transparent absence is approved for the generic examples only. Each future ruleset must declare its own absent-cell, endpoint, edge, stacking, range and degenerate policies.

| Intermediate obstacle cell relationship | Interior only | Interior + edge | Any contact |
| --- | --- | --- | --- |
| No intersection | Clear | Clear | Clear |
| Interior intersection | Blocks | Blocks | Blocks |
| Positive-length edge overlap | Clear | Blocks | Blocks |
| Isolated vertex contact | Clear | Clear | Blocks |

Two obstacles on opposite sides of an overlapped edge both qualify under the last two policies. There is no “pick a side” rule. Cell contact policy does not define how a feature *on* that edge acts. A later edge-aware ruleset must explicitly decide how transverse crossings, vertex touches, overlaps and endpoints affect its features.

**Deferred to M2 (O1).** Memoir '44 requires separate research using identified authoritative rules and explicit expansion/variant scope. No compatibility claim or Memoir '44 rule implementation is authorized by this document.

## Serialization and internationalization

**Agreed.** Keep serialization separate even while user-facing import/export is deferred. Keep English/Spanish interface strings separate from geometry and game decisions.

**Approved in principle (P10).** Future scenarios carry a schema version, ruleset ID/version, finite membership, ordered elements and canonical edge feature records. Encode arbitrary integers as canonical decimal strings, not JSON numbers. Derive `s`; do not persist approximate SVG positions or cached visibility. Validate coordinate syntax, duplicates, element IDs, edge adjacency, incident-cell constraints and ruleset payloads. Unknown schema/ruleset versions produce explicit errors or documented migrations, never silent reinterpretation. The complete schema is an M2 task, not an M1 blocker.

Explanation codes and stable identifiers are language-neutral. English and Spanish must expose the same facts and editing capabilities. Locale cannot change arithmetic, identity, contact classification or ruleset behavior.

## Critical review of the initial brief

| Issue | Finding and reviewed resolution |
| --- | --- |
| Affine versus Euclidean geometry | Supplied embedding/half-planes are consistent. Affine coordinates preserve incidence, not Euclidean angles/lengths. Derive distance axially; render regular hexagons through the inverse embedding. |
| Contact classes | An interior crossing also has boundary endpoints. Classify by strict interior existence, then overlap, then singleton vertex; preserve boundary metadata separately. |
| Degenerate sightline | `A=B` makes every parameter map to one point; a singleton spatial intersection is not `[t,t]`. Use a separate point record and preimage `[0,1]`. |
| “Rectangular” boards | Axial bounds and staggered arrays are different shapes. Specify generator semantics explicitly (P3). |
| Enumeration | Enumerating only board members loses absent cells and policy evidence. Bound the infinite lattice geometrically, then attach membership. |
| Simultaneous events | Multiple cells/edges may meet at one parameter; traversal order cannot decide blocking. Group events and retain every incidence. |
| Exact integers | Safe input numbers do not imply safe determinant products. Use bigint throughout the geometry core (P4 approved). |
| Edge “crossing” | Crossing an edge interior differs from touching its vertex or crossing its infinite supporting line. Preserve finite incidence and supporting-side signs (P7). |
| Generic rules | Endpoints, empty/absent cells, edge features and stacks lack specified policies. P9 now supplies approved policies for the generic rulesets; other adapters must declare their own. |
| Resource feasibility | Exact preflight must itself avoid region/row enumeration. The parity-based closed form counts the approved region using bounded bigint operations; reject above the configured limit before enumeration (P6). |
| Result-state gap | The original clear/blocked-only field could not express ruleset-invalid sightlines or absent-cell causes. P8 now separates all six outcomes and supports coordinate-only evidence. |
| Budget versus symmetry | The axis-aligned region count can change under rotation although mathematical contacts remain invariant. Resource admission is not a mathematical invariant; compare exact outputs for completed evaluations and test failures separately. No geometry semantics change. |
| Supporting-line verification wording | Only feasible supporting-line intersections define polygon vertices; other pairwise line intersections can lie outside the polygon. The geometry proof now states this explicitly, without changing the polygon or fixtures. |

## Intended M1 tooling baseline

The following baseline is agreed by review. Exact mutually compatible versions and relevant configuration details must be selected and recorded during M1, rather than guessed in M0:

- A supported Node.js LTS release.
- npm, with committed `package-lock.json` for M1 reproducibility.
- TypeScript strict mode and a stable ES2020-or-later compilation target with native BigInt.
- Vitest and fast-check for property-based testing, replay and shrinking.
- ESLint and Prettier.
- GitHub Actions for automated verification.
- **Zero runtime dependencies for the geometry module.** Test/build/lint tools are development dependencies.

M1 must record versions, lock dependencies and verify the toolchain together. No Vite initialization or frontend-framework selection belongs to the geometry milestone. No tools are installed or configuration/lockfiles generated in this M0 revision.

## Decision register and M1 gate

This register records the completed architectural/mathematical review; it supersedes the earlier pending-proposal status.

| ID | Decision | Review status and remaining scope |
| --- | --- | --- |
| P1 | Pure geometry, module dependencies and immutable snapshots | **Approved** |
| P2 | Board/stacks/features, stable IDs and deletion cleanup | **Approved**, including deletion when neither incident cell remains |
| P3 | Rectangle families and local offset parity | **Approved**; additional options/UI defaults remain open |
| P4 | Bigint coordinates/products/rationals, value equality and input normalization | **Approved** |
| P5 | Contact classes, strict-interior precedence, side convention and degenerate record | **Approved**, including separate degenerate-point preimage `[0,1]` |
| P6 | Embedded bounds, signed floor/ceil, preflight and resource failure | **Approved subject to the incorporated resource-limit contract**; default numeric limits follow M1 measurements |
| P7 | Adjacent-cell edge IDs, incidence metadata and simultaneous groups | **Approved** |
| P8 | Endpoints, independent results, unlimited tag and UI precedence | **Approved subject to the incorporated six-outcome clarification**; exact type names and additional UI treatment remain open |
| P9 | Generic policies, transparent absence and ignored endpoint obstacles | **Approved** |
| P10 | Versioned scenarios and decimal-string integers | **Approved in principle**; complete schema deferred to M2 |
| O1 | Authoritative Memoir '44 rules, variants and compatibility wording | **Deferred to M2** |
| O2 | Exact compatible tool versions, concrete compilation target, default limits, benchmark protocol, cancellation details and browser support matrix | **Open** within the agreed tooling/resource baseline; select M1 details during M1 and browser/UI details in M3 |

**M1 readiness:** no remaining mathematical or architectural approval blocker. Begin with exact compatible tool-version selection, public type/module naming and the reproducible measurement protocol. Those are M1 implementation tasks, not a reason to reopen approved contracts. Numeric defaults are deliberately deferred until measurements; limit tests use explicit configured limits. Cancellation strategy and browser support remain explicit follow-up decisions. The schema, Memoir '44 research and UI defaults do not block independent geometry work.

## Independently reviewable milestones

| Milestone | Deliverables and acceptance gate |
| --- | --- |
| M0 — specification | Four consistent documents; reviewed proofs/fixtures and candidate-count derivation; approvals and remaining open items recorded; no application code. |
| M1 — geometry | Standalone strict TypeScript geometry, zero runtime dependencies, exact rationals/distance/clipping and reference enumeration/edges/events; no DOM/game assumptions or optimized traversal. Pin the baseline tools; pass [testing.md](testing.md), including a persistent independent exact oracle and resource-boundary tests; publish reproducible sightline/whole-board workload measurements before choosing default limits. |
| M2 — board and rules | Editing/topology, stacks/edges, visibility, independent range/LOS and three generic policies with explanations; implement approved P2/P3/P8/P9, complete the P10 schema and test absence/endpoints/result states. Research/specify Memoir '44 separately before its adapter. |
| M3 — application | SVG editing/inspection, every agreed UI capability, both orientations, English/Spanish parity, keyboard/touch-accessible controls and desktop/mobile verification. Rebase exact coordinates to a local display origin before floating-point conversion; display never changes exact results. |
| M4 — publication | GitHub Pages, reproducible build/test instructions, user/developer documentation, known limitations and clear ruleset support status. No backend or proprietary runtime requirement. |

Recommended sequence: select and record compatible baseline tool versions during M1; implement the approved exact contracts with the persistent independent oracle and preflight tests; measure the reference implementation and select default limits; then implement approved board/generic policies and complete schema/Memoir research in M2. M0 does not authorize application code, installations, commits, pushes or publication.
