# M2B.2 completion report

Implemented `memoir44.refresh2025`, version `"1"`, empty configuration, for review.
The accepted PR #4 head was verified as
`d65d4a9e1ecbcdc24b4fe1ec848fc409eb3e3520` with successful CI before its authorized
merge. Local main was synchronized to `d2552af`, the merged documentation branch
was cleaned up, and work continued on `feature/memoir44-refresh2025`.

## Implementation and scope

New production modules:

- `src/rulesets/memoir44/entities.ts`: strict entity/stack validation, immutable
  semantic roles, supported vocabulary and intrinsic maxima.
- `src/rulesets/memoir44/refresh2025.ts`: eligibility/elevation filtering, global
  sided obstruction policy, physical LOS, independent range and exact evidence.
- `src/rulesets/registry.ts`: frozen built-in collection, retaining all three generic policies.

Updated the ruleset exports/contract and visibility integration. Added tests under
`tests/memoir44/` and updated README, board/visibility documentation, researched
rules/decision register and the [adapter API](rulesets/memoir44-refresh2025.md).
No runtime dependencies, geometry changes, board changes or serialization schema
changes were introduced. Existing geometry, board, generic rules and test oracles
are unchanged.

Supported terrain: open (also implicit), forest, hedgerow, town, church, hill,
river, ocean, beach, bridge. Installations: bunker, hedgehog, sandbags, wire,
sea-wall. Units: standard infantry, armor, artillery. Roles are independent of
stack order; multiple supported installation types are compositional for LOS.
This does not certify legal deployment. Unknown payloads, semantic duplicate
roles and all stored shared-edge features are rejected explicitly.

Official rules/deductions implemented: center-to-center LOS, endpoint exemptions,
intervening units regardless of affiliation, named blocking/transparent terrain,
global opposite-side boundary obstruction, refreshed categorical elevation with
the separate bare-hill exception, unit maxima 3/3/6, and the ordinary artillery
LOS exemption. The official refreshed PDF was rechecked at the URL recorded in
the [research source table](rulesets/memoir44.md); printed pp. 8–9 and 14–20
cover this subset. The downloaded PDF SHA-256 is
`12af03e45c15e160c546bbd2e783e3003d9beea349dd691310f080cab51be160`.
No publisher artwork or rulebook assets were added.

Approved calculator conventions: sided isolated vertices (not a publisher ruling),
positive-length absent-contact invalidity with singleton absence ignored, required
observer with empty-target/self inspection, additional user range cap, strict
entity schema and physical-LOS/artillery-exemption separation. Invalidity takes
precedence in LOS status while retaining physical blocking evidence. The existing
visibility boolean keeps its original meaning; no legal-attack result is inferred.

## Architecture and mathematical findings

Added optional `Ruleset.validateQuery` because only the selected query identifies
which cell must contain an observer; board/scenario validation alone cannot do
that. It runs before geometry, returns semantic input issues, and exceptions remain
evaluation failures. Scenario codecs still validate board/reference independently
of any selected observer, including empty boards. Generic adapters are unchanged.
This is a small additive interface change justified by the observer requirement;
no geometry, board, evidence or result redesign was required.

Mixed edge-overlap and singleton contacts on one center-to-center sightline are
mathematically impossible in the approved lattice. The [retained proof](rulesets/memoir44.md#mixed-boundary-contact-impossibility-d-mathematical)
reduces edge-parallel lines to vertical lines through the six vertex positions.
A 169-displacement check supports the proof. No impossible mixed fixture or
artificial adapter context was fabricated.

## Verification

Runtime: pinned Node 22.13.1 and npm 10.9.2. `npm run check` verifies strict types,
Vitest, ESLint, Prettier and the ESM/declaration build. `git diff --check` passes.

- **162 tests across 11 files:** all 74 existing tests plus 88 adapter tests.
- All **31 applicable refreshed reference fixtures** pass (M01–M30 and M32).
  M31 lakes and the legacy-only M14/M15/M18/M19 outcomes are explicitly deferred.
- Source-backed/deduced fixture expectations and approved-convention expectations
  carry distinct labels. Supplementary tests cover every supported terrain,
  installation and standard intervening unit class/affiliation.
- Edge and singleton pairs retain exact disjoint intervals and both sides; stacked
  and simultaneous evidence is complete. Elevation filtering precedes pairing.
- Seed **2201**, **200 runs**: translation by exact integers up to magnitude 10^30,
  rotations/reflections, complete evidence/interval/side and decision preservation.
- Seed **2202**, **150 runs**: physical LOS reversal with exact reversed intervals
  and sides. No asymmetric weapon-range invariance is assumed; artillery/infantry
  reversal separately verifies different range results.
- Independent M1 oracle comparisons, including all **625 ordered bounded endpoint
  pairs**, remain passing. No production clipping/bounds were added to the oracle.
- Serialization round trips retain IDs, membership, ordered stacks and equivalent
  evaluation; malformed adapter scenarios are rejected. Empty scenarios remain valid.
- Missing observers, unsupported configuration/data/features, invalidity precedence,
  resource failures and internal query-validator failures are covered explicitly.

A seeded property initially exposed a test assertion that negated zero into
JavaScript `-0`; its expected determinant was corrected to mathematical zero.
Production geometry and expected mathematical outcomes were unchanged.

## Deviations, limitations and remaining work

No deviations from the approved semantics. The additive query-validation hook and
impossibility finding are explained above. New performance claims/defaults are not
made: M1 geometry baselines/defaults are unchanged. Synchronous full-board semantic
validation repeats per query; batch performance and resource budgets for board
generation/scenario input remain deferred M2A considerations.

This is a supported subset, not exhaustive refreshed base-game compatibility.
Lakes, additional hill/terrain variants, special units, legacy plateaus, expansion
rules, scenario overrides, movement, cards, dice and legal attack assessment remain
outside scope. Official isolated-vertex behavior remains undocumented in inspected
sources; the chosen convention is explicit. Exact printed-board/half-hex membership
mapping is not supplied by generic rectangles. No UI, deployment or optimization
was added. The new PR is left open for review and must not be merged without approval.
