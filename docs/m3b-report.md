# M3B completion report

The Memoir '44 graphical editor is implemented on `feature/memoir44-editor` for
review. PR #6 was already merged at reviewed head
`55c4aac83c7ffeca7665d1e9448ffd30e4282de2`, with both CI runs successful. Main was
fast-forwarded to `0f10e2d`, the merged branch cleaned up, and this branch created.
The new PR must remain open for review, without merging.

## Implementation decisions

The ruleset selector uses `BUILTIN_RULESETS` and exposes all three generic policies
plus `memoir44.refresh2025`, version `"1"`. `WorkingBoards` retains separate generic
and Memoir editing snapshots in session memory; policy changes within generic mode
retain its board. Cross-mode conversion is rejected by the lower-level state helper.
Switching restores the appropriate board/selection/range/tools, clears evaluation
and fits its display. No entity is silently reinterpreted or discarded.

The Memoir palette supports all accepted base-core terrain (Open, Forest, Hedgerow,
Town, Church, Hill, River, Ocean, Beach, Bridge), installations (Bunker, Hedgehog,
Sandbags, Wire, Sea wall), and standard Infantry/Armor/Artillery with Allies/Axis
styles. Replacement uses existing immutable board edits and adapter schema helpers.
It preserves independent layers and their stable IDs/order; changed roles receive
new IDs and identical repainting is a no-op. Clear/removal tools act on one role
or installation type. Shared-edge editing is hidden and guarded in Memoir mode;
generic edge state remains in the generic workspace.

Original SVG paths depict terrain and installations; unit boxes use crossed lines,
oval and dot, with A/X letters and affiliation styling. Terrain remains visible
under status discs/outlines, and units/installations/observer/target/blockers remain
independently labeled. No official tiles, artwork, logos or assets were copied.

Observer requirements and invalidity come from the existing evaluator. Removing
the observing unit retains its coordinate and produces clear missing-unit feedback;
replacing it updates the query. Empty/friendly/self inspection remains permitted.
The inspector reads adapter-owned structured range/exemption facts; it does not
recompute maxima, elevation, obstruction eligibility or side pairing. Artillery has
a separate A annotation and human exemption text while blocked LOS and the original
`visible` boolean remain intact. No attack verdict is introduced.

All Memoir semantic codes have English human-readable explanations. Exact evidence,
fractions, sides, events and raw semantic records remain expandable technical
inspection. Unsupported data/results remain explicit. All automatic recalculation,
pointer-capture safety, debounce/revision guards, zoom/pan and resource budgets are
retained. There is no new dependency, result cache, worker or geometry optimization.

## Files and architecture

New UI modules: `web/memoir-editing.ts`, `workspaces.ts`, `memoir-controls.ts`,
`memoir-svg.ts`, `svg.ts`, `memoir-presentation.ts`, `messages/memoir-en.ts`.
Existing UI state, controls, evaluation, formatting, rendering, main wiring and CSS
are extended. **No production file under `src/` changes**, including geometry,
board, rulesets, visibility and serialization. Standalone ESM/declaration builds
remain usable. Frontend build configuration only adds the benchmark entry to
strict checking and the separate benchmark build.

New verification artifacts: `tests/web/memoir-editor.test.ts`,
`browser/memoir.spec.ts`, `benchmarks/memoir.ts`, `memoir.html`,
`memoir-results.json`. The existing benchmark driver accepts `memoir`; affected
generic benchmark artifacts are refreshed. README, interactive/adapter/editor
usage, performance documentation and screenshots reflect the supported content.

## Verification

Pinned Node 22.13.1 / npm 10.9.2; no tooling/dependency versions changed.

- `npm run check`: **211 tests / 15 files**, strict library/frontend type checking,
  ESLint, Prettier and standalone library/declaration build pass.
- All **184 pre-M3B tests** are retained; **27 UI tests** add safe workspace switching,
  every terrain/unit/installation, independent immutable layers, stable IDs/no-op,
  observer removal/replacement, unit range caps, unsupported/invalid results, human
  messages and the Memoir manual fixture.
- `npm run build:app`: production browser bundle passes.
- `npm run test:browser`: **19 Chromium tests** pass: all 12 existing tests plus 7
  Memoir workflows. Coverage includes palette/replacement/removal, affiliation,
  safe mode switching, missing observer, ranges/artillery, elevation/global boundary
  explanations, absence invalidity, isolated vertices, safe gestures, responsive
  layout and desktop/mobile captures.
- The manual fixture uses Infantry at `(7,2)`, Forest `(7,3)`, Town `(5,5)` and
  targets `(5,6)` / `(4,8)`. Both are physically blocked, at distances **4 / 6** and
  out of Infantry range. Artillery places both within its inclusive maximum 6,
  preserving blocked physical LOS and `visible: false` with separate exemption.
- M1/M2 mathematical fixtures/properties, independent exact oracle and bounded
  comparisons remain untouched and passing. Generic benchmark complete-work
  checksums remain identical to the accepted M3A workload.
- Populated Memoir and generic benchmarks, source fingerprints, documentation links
  and `git diff --check` are verified. Screenshots show actual production Chromium.

The first terrain-replacement test used Forest over an existing Forest, correctly
returning the original snapshot; its setup was corrected to replace a different
terrain so the immutability assertion tests a real edit. A preliminary browser
expectation at artillery distance 6 was corrected after checking exact lattice
distance and inclusive range; production mathematical behavior was unchanged.

## Performance and limitations

See [M3B performance](m3b-performance.md) for complete inputs, raw samples, source
identity, hardware/runtime details, checksums and measured timings. Workloads have
117/468 cells populated with all supported terrain, installations and standard
units. Measurements include full public evaluation and actual SVG/controls/target
inspection DOM/layout. All resource admission limits remain unchanged.

| Cells | Evaluation median / p95 ms | Full presentation median / p95 ms |
| ----: | -------------------------: | --------------------------------: |
|   117 |                85.5 / 95.3 |                       25.5 / 28.7 |
|   468 |              753.5 / 796.1 |                       94.2 / 97.6 |

The 468-cell synchronous Memoir pass is noticeable. Debouncing consolidates rapid
edits but cannot make calculation interactive while it runs. The smallest next
improvement to measure is cooperative yielding between target batches with existing
revision cancellation. If profiling shows repeated full-board validation dominates,
a validated immutable-snapshot contract needs separate review; no speculative
validation cache or ruleset redesign is included here.

No deviations from accepted mathematical/game semantics. Remaining limits include
English-only resources, headless Chromium desktop/mobile viewport verification,
in-memory boards without persistence, and safe relative display-span/resource
bounds. Full Spanish/device/accessibility coverage and visual refinement remain
M3C. Lakes, terrain variants, special units, legacy rules, expansions, movement,
attack legality, scenario import/export and deployment remain excluded. This is a
supported subset, not exhaustive Memoir compatibility or official endorsement.

Launch with `nvm use`, `npm ci`, `npm run dev -- --host 127.0.0.1`; choose the Memoir
supported-subset entry. Production inspection uses `npm run build:app` followed by
`npm run preview -- --port 4173`.
