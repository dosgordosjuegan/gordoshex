# Reproducible M3A browser performance

Raw metadata, source fingerprint, exact target lists, per-query counts, full-result
checksums and every timing sample are retained in
[benchmarks/browser-results.json](../benchmarks/browser-results.json).
This measures the complete board/visibility orchestration and production SVG path,
not just geometry. No runtime optimization is introduced.

```sh
nvm use
npm ci
npx playwright install chromium
npm run benchmark:app
```

The command builds a separate production benchmark entry with the same Vite,
ES2022 target, production modules and CSS as the application, then starts a local
preview on port 4174 and runs headless Chromium. Benchmark-only code is not shipped
in `browser-dist/`. The runner closes its browser and server on completion.

Measured **2026-11-28T12:23:04.523Z**, Linux 7.0.0-44-generic x64 on Ubuntu 26.04.1,
Intel Core i7-2600 @ 3.40 GHz, 8 logical CPUs, 16,130,686,976 bytes physical RAM.
Node **22.13.1**, npm **10.9.2**, Vite **8.4.0**, Playwright **1.65.1**, Chromium
**159.0.8154.6**. Viewport 1440 × 1000, device pixel ratio 1; SVG 1100 × 750.
No CPU throttling or forced garbage collection. Headless results do not establish
physical mobile-device performance.

Source snapshot SHA-256:
`3c94de23fcb3100b81846f8256c67eea5b5717118adafe79e0589846f237432c`.
The ordered source filenames, NUL separator and contents are hashed; the raw file
lists all inputs, including production modules, CSS, benchmark code/configuration
and lockfile. Documentation, screenshots and tests are outside that identity.

## Workload and timing method

Both datasets use staggered-row generators with origin `(0,0)`, pointy display,
interior-only generic policy and unlimited range. Observers are the middle local
offset cell: `(4,4)` for 13 × 9 and `(9,9)` for 26 × 18. Every existing coordinate
is a target, including self. The board is seeded deterministically in numeric
snapshot order: an obstacle every 17th cell, transparent marker every 41st cell,
and an edge marker in direction 0 every 59th cell, including index zero. This
exercises actual board validation, payloads and ignored edge evidence. No random
seed is needed; all exact target lists and counts are retained.

Each dataset runs **3 warmups and 9 measured repetitions**, synchronously, without
parallel queries. Per-sightline budget is `1000n`; aggregate UI limits are applied.
Every pass must complete all targets. The complete ordered visibility-result map
(including geometry, full context, decisions and evidence) is serialized with
BigInts as strings and SHA-256 checked outside timed regions on every repetition.
The checksum must remain identical. These are complete-work checks, not count-only
checks. Memory ceilings and peak allocations were not measured.

- **Evaluation:** elapsed time around `evaluateBoard`, including aggregate exact
  preflight, repeated board validation, all geometry/ruleset calls and result-map
  construction. The benchmark measures the whole call, including work outside
  the UI's displayed per-pass evaluation timer.
- **SVG DOM/layout:** elapsed time for the production `renderBoard` scene creation,
  insertion, viewBox assignment and forced layout read. It does not include the
  full controls/inspection panel, nor promise completion of GPU painting.
- **Two-frame wait:** separately observed time across two animation frames after
  insertion/layout. It records scheduling/render opportunity, not isolated GPU time;
  do not interpret it as a precise paint measurement or add medians into a p95.

Median is the middle of nine sorted samples. P95 is nearest rank
`sorted[ceil(.95*n)-1]` (the maximum with nine samples). No cross-machine timing
assertions are imposed in tests.

| Board   | Queries | Conservative candidates total | Evaluation median / p95 ms | SVG DOM/layout median / p95 ms | Two-frame wait median / p95 ms |
| ------- | ------: | ----------------------------: | -------------------------: | -----------------------------: | -----------------------------: |
| 13 × 9  |     117 |                         1,757 |                49.2 / 57.7 |                    19.1 / 23.4 |                    13.9 / 20.5 |
| 26 × 18 |     468 |                        20,525 |              363.0 / 385.8 |                    57.5 / 63.0 |                    22.5 / 27.8 |

## Limits and recommendation

The UI's **512-cell** generation/batch limit covers the measured 468-cell workload
with modest headroom. Each dimension is at most **64**, and the aggregate exact
candidate budget is **100,000**. The aggregate cap admits this representative pass
with under 5 times its measured work; it is a denial boundary, not a latency promise.
Other shapes, observers, stacks and hardware can cost more. Existing **1000n per
sightline** admission remains independent; a failed individual target retains its
explicit failure, and a refused batch never silently evaluates a subset.

A 468-target synchronous pass visibly exceeds a frame budget. After manual testing,
visibility now updates automatically after a **150 ms debounce**. Mathematical
edits immediately clear old results; superseded deferred work is canceled and
revision-guarded. Hover, orientation, zoom, pan, target selection and inspection
state do not trigger evaluation. Manual **Evaluate all targets** remains available.
The debounce consolidates rapid edits; it does not reduce synchronous computation
cost or eliminate the interaction pause during a pass. No worker, result cache or
optimized traversal is added. M3C adds cooperative yielding between bounded target chunks; the table above
retains the synchronous comparison path. See the [M3C comparison](m3c-performance.md).

The separate [geometry baseline](performance.md) was rerun for the original M3A
tooling/config changes. This usability correction changes no mathematical production
code or geometry benchmark inputs.

Refreshed during M3B after shared UI changes. Populated Memoir workloads use a
separate [presentation/evaluation measurement](m3b-performance.md).

## Automatic input-to-result responsiveness

Reproduce separately, without concurrent benchmark/test workloads:

```sh
npm run build:app
node benchmarks/automatic-run.mjs
```

The driver serves the actual production application on local port 4176. Raw
metadata, every sample and source identity are retained in
[automatic-results.json](../benchmarks/automatic-results.json). It uses the same
machine, Node/npm, pinned Chromium and 1440 × 1000 viewport as the baseline above.
Three warmups and nine measured repetitions per board; median is the middle of
nine, p95 nearest rank (the maximum). No timing gates are added to tests.

Boards are generated through actual controls in staggered-row layout, with an
obstacle on every 17th local row-major cell (including zero), centered observer
`(4,4)` / `(9,9)`, target `(2,0)`, interior-only policy, and finite radius alternating
2 and 3. Every existing target is evaluated regardless of range. Exact obstacle
coordinates are retained. These boards differ from the pure baseline's numeric
snapshot-order stack/edge seeding; their times should not be subtracted to infer
isolated debounce overhead.

The driver dispatches a range input event and measures:

- **Pending DOM:** synchronous event completion with old verdicts removed and
  pending styles already in the DOM.
- **Running DOM:** observer notification after debounce and busy-state DOM update.
- **Complete DOM:** observer notification after the complete result/inspection DOM
  update. This includes debounce, preflight, geometry, rules, pending/running/final
  scene updates and target inspection.
- **Two-frame completion:** two subsequent animation-frame callbacks, a rendering
  opportunity observation rather than a precise GPU paint measurement.

Every edit must yield exactly one evaluation, the full expected cell count and no
pending/failed cell style. Complete cell presentation and exact target-inspection
text are SHA-256 checked per radius across repetitions. The pure baseline separately
checks complete mathematical results. No stale result is accepted as completion.

| Cells | Pending DOM median / p95 ms | Running DOM median / p95 ms | Complete DOM median / p95 ms | Two-frame completion median / p95 ms |
| ----: | --------------------------: | --------------------------: | ---------------------------: | -----------------------------------: |
|   117 |                 11.4 / 14.3 |               161.4 / 167.7 |                284.8 / 346.3 |                        298.3 / 364.2 |
|   468 |                 39.9 / 55.7 |               190.7 / 209.8 |                927.5 / 996.5 |                       968.3 / 1045.9 |

Measured **2026-11-28T12:20:46.097Z**. Source SHA-256:
`580f72de92330dff6cf5574167cf19fe6233c0050a3aea456c6061dc48abdc23`. The manifest hashes production
modules/CSS, the driver, app HTML/Vite configuration and lockfile.

A representative generic 117-cell edit completes in 284.8 ms median;
468 cells take 927.5 ms (968.3 ms including the two-frame observation).
Pending feedback arrives synchronously in 11.4 / 39.9 ms median on this machine.
The larger automatic update remains noticeable. Debouncing prevents repeated passes
while edits arrive rapidly and revision guards protect publication; neither is a
responsiveness guarantee. Workers, caching and geometry optimization remain deferred.

Refreshed for M3C source identity. These evaluation tables retain the synchronous
reference; the browser now uses cooperative evaluation. See the
[M3C before/after comparison and validation profile](m3c-performance.md).
