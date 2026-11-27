# M3A interactive generic visibility calculator

The browser application exposes the three accepted generic rulesets plus the
[Memoir '44 2025 supported-subset editor](memoir-editor.md). It is an
English, desktop-first calculator built with native TypeScript, SVG, HTML and CSS.
No framework, backend, deployment configuration or runtime dependency is added.
Memoir controls and presentation are documented separately; full Spanish coverage
remains M3C. The existing geometry/application libraries retain their standalone
ESM/declaration build and zero runtime dependencies.

## Launch and inspect

Use pinned Node 22.13.1 / npm 10.9.2:

```sh
nvm use
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). For the
production application:

```sh
npm run build:app
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173`. `npm run build` still builds only the standalone
libraries into `dist/`; the application builds separately into `browser-dist/`.
Vite is pinned to **8.4.0**, compatible with the pinned Node version; see
[Vite's Node requirements](https://vite.dev/guide/). Browser tests use development-only
**@playwright/test 1.65.1** and its pinned Chromium distribution. The browser build
target is ES2022 with native BigInt, SVG, pointer events and standard DOM APIs.
Chromium desktop/mobile viewport behavior is verified; Firefox, Safari, physical
touch devices and a complete assistive-technology matrix remain unverified.

The initial board is a generic 13 × 9 staggered-row set with observer `(0,0)`,
target `(2,0)` and one obstacle at `(1,0)` to demonstrate blocking. It does not
claim the membership or layout of an official Memoir '44 battlefield.

Manual checks:

1. Inspect `(2,0)`: distance 2, in range, blocked by `element-1` over `[1/4,3/4]`.
2. Change presentation: membership and exact evidence stay the same. Drag anywhere, including over a cell or edge, to pan using the left or middle
   button, Space + drag, or touch. Motion of at least 5 screen pixels makes the
   gesture a drag; it cannot edit, even if it returns to its start. Use wheel/zoom
   buttons or focus the SVG and use arrows to pan and +/− to zoom. Enter/Space
   activates a focused cell/edge; Space gestures do not also trigger activation.
3. Select an explicit mode to set the observer, inspect a target, add/remove a cell
   or add/remove an obstacle. Dashed frontier cells include holes and boundary
   neighbors. The exact-coordinate form also supports disconnected cells.
4. Inspect cell contents, add obstacles/transparent markers, reorder the stack or
   remove by stable ID. Edge mode exposes all incident shared edges; alternatively
   choose a neighbor direction in the contents panel. Edge markers are explicitly
   ignored by all generic policies, and can be individually added/removed.
5. Board membership, ordered contents, edge features, observer, range and policy
   changes immediately clear old results and automatically schedule a complete pass
   after **150 ms** without another mathematical edit. **Evaluate all targets**
   still requests an immediate refresh. Hover, pan, zoom, orientation, target
   selection and inspection disclosure state do not rerun the mathematical batch.
6. Disable unlimited and enter range 1: target `(2,0)` has out-of-range styling,
   while inspection still reports blocked physical LOS independently. Invalid
   range input disables evaluation until corrected or unlimited is selected.
7. Toggle **Coordinate labels** to show/hide exact labels without recalculation.
   Generic mode defaults on; Memoir defaults off and retains a separate preference.
8. Remove the observer or target: only the removed selection is cleared. A missing
   observer prevents evaluation. Zero board dimensions produce an editable empty set.

## Architecture

| Module                                | Responsibility                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `web/state.ts`                        | Immutable application transitions through public board editing/generation APIs; stable IDs and selection cleanup |
| `web/limits.ts`                       | Strict canonical integer input and UI generation/edit admission budgets                                          |
| `web/recalculation.ts`                | Debounce, cancellation/revision guards and mathematical-input value comparison                                   |
| `web/evaluation.ts`                   | Whole-board preflight, existing visibility API calls, result-to-style projection and blocker identities          |
| `web/display.ts`                      | Exact rebasing, inverse affine embedding, presentation rotation, finite absent frontier and framing              |
| `web/render.ts`                       | SVG scene and exact target/contact/event inspection, with no geometry/rules predicates                           |
| `web/interaction.ts`                  | Pointer/keyboard identity selection, viewBox zoom and pan                                                        |
| `web/controls.ts`                     | Native forms, ordered-stack/edge controls and DOM helpers                                                        |
| `web/messages/en.ts`, `web/format.ts` | Language resources, semantic message formatting and status symbols                                               |
| `web/main.ts`                         | Wires controls, transitions, evaluation and rendering; manages current evaluation/edge selection                 |

UI imports use public `src/index.ts` and `src/application.ts` entry points. No
geometry, board, ruleset, visibility or serialization production module was changed.
The UI supplies the public `BUILTIN_RULESETS` collection. Generic and Memoir
workspaces retain separate compatible snapshots; no dynamic loader or fallback exists. Generic predicates are interpreted only by the existing
rulesets. Results retain full board/context, absent-cell evidence and simultaneous
incidences. Only the selected target's evidence is expanded in the inspection panel.

State owns the last completed batch for display; it is invalidated synchronously
when any mathematical input changes. `Recalculation` holds one immutable pending
snapshot, a 150 ms debounce timer and a revision token. Superseded timers/animation
frames are canceled and every deferred boundary/result publication checks its
revision. Invalid range input cancels pending work; correcting it schedules a fresh
pass even when its value equals the last valid input. Missing observers and resource
failures retain explicit unavailable/failed states, with no stale verdict.

The busy state is painted before the unchanged synchronous evaluation. No result
cache, worker or geometry optimization is added. JavaScript cannot process new
input while a synchronous pass runs; queued input is handled afterward and clears
results immediately. The revision guards prevent deferred or reentrant old work
from publishing over newer state. `data-phase` and `data-evaluations` on the status
node provide bounded diagnostics for browser verification and measurement.

Pointer activation is resolved from exact identities at pointer-down and committed
only on an uncanceled, stationary primary-pointer release. Pointer capture stays
on the SVG, survives scene rebuilds and is released on completion/cancel/loss/blur.
Secondary touch cancels activation; no pinch gesture is introduced. Browser pointer
compatibility clicks are suppressed; Enter, standalone Space and accessibility
clicks remain available. Text fields retain ordinary Space input.

## Display boundary

For embedded point P and local origin O, first compute `P - embed(O)` with bigint.
Only then convert safe integer differences to numbers, apply the inverse affine
scaling and invert Y for SVG. Flat-top presentation additionally rotates the
Euclidean layout by 30 degrees. Polygon vertices and shared-edge endpoints use
the same transform; line endpoints come from exact axial identities.

The local display origin is an existing board cell, or zero for an empty board.
Absolute coordinates beyond `2^53` therefore render normally for compact boards.
Unsafe relative spans are explicitly rejected before accepting an edit; model
coordinates are never rounded to fit the screen. Pointer selection reads stored
exact cell/edge identities. Panning/zooming never reverse-projects screen positions
into mathematical predicates. Orientation cannot regenerate membership.

SVG draws existing membership plus the finite absent neighbor frontier; an empty
board offers `(0,0)` as a seed. It does not attempt to render the infinite absent
lattice. Holes adjacent to existing cells have dashed outlines and coordinate labels.

Observer, visible, blocked, out-of-range, ruleset-invalid, failed and pending
states have distinct symbols/outlines as well as color. These physical-visibility
colors apply to generic policies. Memoir uses its separately labeled
[range/LOS-requirements projection](memoir-editor.md#range-physical-los-and-artillery),
including green exempt artillery with blocked physical LOS. Out-of-range styling wins
only for completed clear/blocked LOS; inspection retains both independent facts.
Failures, invalid/unsupported requests and ruleset-invalid LOS have distinct
projections and no ordinary blocked/visible verdict. Generic policies cannot
produce rule-invalid LOS, but the projection remains tested. Blocking cells for
the selected target receive a heavy outline and every matching obstacle remains
in exact evidence. Simultaneous evidence lists retain all causes at the same t.

## UI resource admission

These are browser-caller budgets, not changes to core generator/query semantics:

| Budget                                  |                    Limit | Failure behavior                                                                       |
| --------------------------------------- | -----------------------: | -------------------------------------------------------------------------------------- |
| Each generated dimension                |                       64 | Validate before calling the generator, including zero-area requests                    |
| Generated/existing board cells          |                      512 | Reject generation or incremental addition atomically                                   |
| Targets in a complete pass              |                      512 | Reject before evaluating any target                                                    |
| Sum of conservative candidates per pass |                  100,000 | Preflight with the existing exact count API; refuse the complete batch, never truncate |
| Candidates per sightline                | Existing default `1000n` | Preserve each explicit resource failure; do not turn it into blocked/visible           |
| Elements per cell                       |                       16 | Reject additional insertions                                                           |
| Features per shared edge                |                        8 | Reject additional insertions                                                           |
| Integer input length                    |           128 characters | Reject before bigint conversion                                                        |
| Relative embedded display components    |  Safe integer conversion | Reject unsafe spans before accepting edits                                             |

Dimension strings must be canonical nonnegative decimal integers; dimensions and
products remain bigint through admission. Finite range is similarly nonnegative,
with an explicit unlimited checkbox. Coordinates permit signed canonical integers.
An aggregate refusal leaves the whole board unevaluated. Admitted batches retain
all individual results, including failures, so no failed target becomes visible.
These limits do not promise fixed latency or memory use. Core board generators
and scenario codecs retain their separately documented budgets/limitations; no
scenario import UI was added.

The 512-cell limit covers the measured 468-cell workload with modest headroom.
The 100,000-candidate cap is an outer admission bound, not a latency target, and is
under 5 times the measured centered 468-cell pass. The dimension bound prevents
very elongated generated sets, while manual disconnected cells still face exact
batch and per-query budgets. The stack/edge limits bound the additional payload
and inspection work. The short debounce consolidates rapid edits because the measured larger pass
occupies hundreds of milliseconds; it does not eliminate that synchronous pause. See the reproducible measurements
and limitations in [M3A performance](m3a-performance.md).

## Verification and known limits

`npm run check` retains every M1/M2A/M2B test and adds pure UI boundary/state tests.
`npm run build:app` verifies the production bundle. For actual browser tests:

```sh
npx playwright install chromium
npm run build:app
npm run test:browser
```

On a fresh Linux CI image, `npx playwright install --with-deps chromium` also
installs browser OS prerequisites. CI runs all library checks, the browser build
and Chromium tests. Browser tests verify exact evidence, editing/ordering, edge
features, orientation, keyboard/zoom, responsive width, resource failures and
recovery from invalid inputs. Screenshots are evidence artifacts, not golden tests:
[desktop](screenshots/m3a-desktop.png), [mobile viewport](screenshots/m3a-mobile.png).

Changes are in-memory; reload discards edits. Undo, scenario import/export,
shareable URLs, deployment, attack eligibility and final branding
are excluded. Very large relative spans are refused, and large admitted synchronous
passes still pause interaction. Full Spanish parity and broader browser/device
accessibility verification remain M3C. No claims are made about legal attacks or
official game-board generation.
