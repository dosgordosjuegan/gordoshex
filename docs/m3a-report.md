# M3A completion report

Historical milestone record. See the [M3C release guide](release-polish.md) for
current localization, accessibility, mobile and evaluation behavior.

Implemented the first interactive generic visibility calculator on
`feature/interactive-board`. PR #5 was already merged at reviewed head
`62fc1fef0eb88ef761f1a7fe0e382d3763415e5f`, with both CI checks successful.
Local main was fast-forwarded to `8be4ae9`; the merged feature branch was cleaned
up before starting M3A. The new PR remains open for review, without merging.

## Result and changed files

- `web/`: native application state/edits, UI limits, exact-rebased display,
  visibility orchestration/projection, SVG/inspection rendering, pointer/keyboard
  interaction, native controls, English resources and styles.
- `index.html`, `vite.config.ts`, `tsconfig.web.json`: separate Vite application
  entry, production browser build and strict frontend type checking.
- `package.json`, lockfile: development-only Vite **8.4.0** and Playwright **1.65.1**;
  exact dev/preview/browser-build/browser-test/browser-benchmark commands.
- `tests/web/application.test.ts`, `browser/app.spec.ts`, `playwright.config.ts`:
  pure state/display/projection tests and actual production Chromium verification.
- `.github/workflows/check.yml`, ESLint/ignore/TypeScript configuration: retain
  library checks and add production browser build/testing, excluding generated output.
- `benchmarks/browser*`, `benchmarks/automatic-run.mjs`,
  `benchmarks/automatic-results.json`, `vite.benchmark.config.ts`: reproducible production browser
  workload, raw samples, source identity and complete-work checksums.
- `benchmarks/results.json`, `docs/performance.md`: rerun M1 benchmark after tooling
  configuration changes; every original complete-work checksum is unchanged.
- README and [application documentation](interactive-app.md),
  [performance report](m3a-performance.md), this report and desktop/mobile screenshots.

The geometry, board, ruleset, visibility and serialization production files in
`src/` are unchanged. All original tests and the independent exact oracle remain
unchanged. The standalone library build retains ES2022 without DOM libraries;
frontend checking uses DOM declarations separately. No runtime dependencies,
frontend framework, worker, cache, traversal optimization or deployment was added.

## Capabilities and boundaries

The SVG board is the dominant desktop view, with responsive stacked controls on
narrow screens. It supports both orientations without changing membership,
exact local rebasing before numeric conversion, fit/zoom/pan, focus/hover,
existing/absent cells and holes. Pointer selection uses exact stored identities.
Labels, symbols and outlines accompany color. Simple original SVG shapes contain
no game artwork.

All three generic policies are selectable. The initial 13 × 9 staggered-row board
is explicitly generic. The UI generates axial/row-offset/column-offset rectangles,
adds/removes boundary and disconnected cells, edits ordered obstacle/transparent
marker stacks with stable IDs, and edits basic canonical shared-edge markers.
Generic edge markers remain explicitly ignored by policy; editing adds no game rule.
Deleting selected cells clears origin/target consistently.

Range and LOS remain independent, including blocked/out-of-range targets. Exact
intervals, classifications, side, semantic explanations and every simultaneous
cause are inspectable. Failed/resource-limited queries are visually distinct and
never labeled ordinary blocked/visible. Rule-invalid/invalid/unsupported
projections are preserved even though the exposed generic policies cannot normally
produce rule-invalid LOS.

Edits invalidate old results immediately; automatic evaluation after a 150 ms
debounce computes every existing target. The manual refresh button remains. Invalid range disables evaluation, and unsafe display spans reject
edits atomically. The application owns no duplicate geometry or game predicates.
All user-facing message templates are in language resources; Spanish parity is M3C.

UI caller limits: **64 per dimension, 512 existing/generated cells and targets,
100,000 aggregate conservative candidates**, retaining **1000n per sightline**.
Stacks allow 16 elements/cell, edges 8 features; input integers are at most 128
characters and relative display components must convert safely. Generation and
batch work are preflighted before allocation/evaluation; no partial batch is
silently presented as complete. These limits do not change library semantics.

## Verification

After a clean `npm ci`, with pinned Node **22.13.1** / npm **10.9.2**:

- `npm run check`: **184 tests / 14 files**, strict library/frontend type checking,
  ESLint, Prettier verification and standalone ESM/declaration build pass.
- All **162 pre-M3A tests** are retained, including deterministic properties,
  M1's independent exact oracle and 625 ordered bounded endpoint comparisons.
- **22 pure UI/regression tests** cover both transforms, regular hex shape, huge-coordinate
  rebasing, selection/edit transitions, resource boundaries, independent
  range/policy projection, simultaneous blocker highlighting and failure states.
- `npm run build:app`: production browser build passes independently of `dist/`.
- The documented Vite development server was also launched and inspected in Chromium: 117 cells, a completed visibility pass and no page errors.
- `npm run test:browser`: **12 Chromium smoke tests** pass against the production
  bundle, including pointer/keyboard behavior, orientation/membership, exact
  evidence, editing/ordering, edges, holes, input recovery, explicit resource
  failures, and a 390-pixel responsive viewport without horizontal overflow.
- `npm run benchmark:app`: complete 117/468-target browser workloads pass with
  stable full-result checksums on every repetition. `npm run benchmark` reruns
  unchanged geometry fixtures with all 21 workload checksums matching M1.
- Documentation links, source fingerprints, screenshot artifacts and
  `git diff --check` are verified. CI repeats library, production build and Chromium checks.

Browser tests exposed an exact accessible-label mismatch in the orientation
selector; the selector was given its explicit language-resource label. No
mathematical fixture or existing test was weakened.

## Performance and decisions

The retained browser run measures a staggered-row board with deterministic
obstacles, transparent markers and edge markers, centered observer, interior-only
policy and unlimited range. Three warmups, nine repetitions; p95 is nearest rank.
Raw hardware/runtime details, viewport, inputs and samples are documented separately.

| Targets | Candidates | Evaluation median / p95 ms | SVG DOM/layout median / p95 ms |
| ------: | ---------: | -------------------------: | -----------------------------: |
|     117 |      1,757 |                47.2 / 56.4 |                    17.0 / 18.9 |
|     468 |     20,525 |              326.5 / 353.3 |                    54.9 / 60.3 |

These measurements justify conservative UI admission and debounced calculation.
The larger synchronous pass is noticeably longer than a frame; the UI paints
busy status first but can pause interaction during calculation. The smallest next
solution, if live updates become necessary, is measured cooperative scheduling
between targets with invalidation of superseded work. No speculative worker or
geometry redesign is recommended here. DOM/layout timing does not claim isolated
GPU paint time or memory ceilings; two-frame waits are recorded separately.

## Deviations and remaining limitations

No changes to approved mathematical/ruleset semantics. Numeric browser limits and
debounced automatic evaluation are implementation decisions within the requested
resource scope. The generated example does not certify any official battlefield layout.

Edits are in-memory; reloading discards them. Browser verification is Chromium
(headless desktop and mobile viewport), not a complete physical-device or
assistive-technology matrix. Full Spanish support, Memoir editing/presentation,
scenario import/export UI, sharing, deployment, legal attacks and final visual
polish remain excluded/deferred. Large admitted synchronous workloads and
extremely dispersed coordinates retain the limitations described above.

Launch with `npm ci`, `npm run dev -- --host 127.0.0.1`, then open the printed URL.
For a production inspection use `npm run build:app` and `npm run preview -- --port 4173`.

## Manual-test usability corrections

The existing PR adds panning from cells, edges and background, middle/Space drag,
and touch drag. A sticky 5-pixel threshold separates activation from movement;
release/cancellation/lost capture/blur cannot commit an edit. A browser regression
also verifies release before `lostpointercapture` is emitted; actual capture
ownership is checked on movement/release rather than relying on that event alone. Automatic visibility
uses a 150 ms debounce and cancels superseded scheduled work. Mathematical value
comparison excludes target, inspection, hover and presentation changes. Invalid
input clears stale state and cancels queued work. These corrections preserve the
existing resource budgets and add no geometry/ruleset changes.

The exact manual regression uses observer `(7,2)`, obstacles `(7,3)` and `(5,5)`,
all cells present and unlimited range. Both targets are clear under interior-only
and blocked under the other generic policies:

| Target  | `(7,3)` contact                   | `(5,5)` contact                   |
| ------- | --------------------------------- | --------------------------------- |
| `(5,6)` | edge overlap `[1/6,1/3]`, side −1 | edge overlap `[2/3,5/6]`, side +1 |
| `(4,8)` | edge overlap `[1/9,2/9]`, side −1 | edge overlap `[4/9,5/9]`, side +1 |

The independent annotation uses the vertical embedded ray `X=16`, `Y=6+12t` or
`Y=6+18t`, and obstacle edge Y intervals `[8,10]` and `[14,16]`. All six
policy/target cases assert exact fractions and sides. The mathematical engine was
not changed. Four deterministic scheduler tests additionally cover consolidation,
value comparison, cancellation at deferred boundaries, superseded publication and
error propagation. Seven additional browser tests cover gestures and automatic work.
See [automatic responsiveness measurements](m3a-performance.md#automatic-input-to-result-responsiveness)
for complete input-to-result measurements and known synchronous limitations.

The production input-to-result measurement (including the 150 ms debounce) is
**273.4 / 280.1 ms median / p95** for 117 cells and **602.0 / 626.7
ms median / p95** for 468 cells. Pending DOM feedback takes **11.5 / 38.4 ms** median;
the two-frame completion observations are **287.1 / 637.4 ms** median. Each sample
verifies one evaluation and a complete stable presentation checksum per range.
The larger update is still noticeable; no worker/cache/geometry optimization was
added to conceal the synchronous pause.
