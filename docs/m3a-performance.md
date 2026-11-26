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

Measured **2026-11-26T22:21:25.017Z**, Linux 7.0.0-44-generic x64 on Ubuntu 26.04.1,
Intel Core i7-2600 @ 3.40 GHz, 8 logical CPUs, 16,130,686,976 bytes physical RAM.
Node **22.13.1**, npm **10.9.2**, Vite **8.4.0**, Playwright **1.65.1**, Chromium
**159.0.8154.6**. Viewport 1440 × 1000, device pixel ratio 1; SVG 1100 × 750.
No CPU throttling or forced garbage collection. Headless results do not establish
physical mobile-device performance.

Source snapshot SHA-256:
`350ed36c96978f153b3618d73f0e4c33090e6502e843ef91b72bc1003a373f69`.
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
| 13 × 9  |     117 |                         1,757 |                49.7 / 62.2 |                    18.6 / 19.8 |                    15.4 / 18.9 |
| 26 × 18 |     468 |                        20,525 |              345.5 / 391.8 |                   58.0 / 111.3 |                    23.0 / 41.0 |

## Limits and recommendation

The UI's **512-cell** generation/batch limit covers the measured 468-cell workload
with modest headroom. Each dimension is at most **64**, and the aggregate exact
candidate budget is **100,000**. The aggregate cap admits this representative pass
with under 5 times its measured work; it is a denial boundary, not a latency promise.
Other shapes, observers, stacks and hardware can cost more. Existing **1000n per
sightline** admission remains independent; a failed individual target retains its
explicit failure, and a refused batch never silently evaluates a subset.

A 468-target synchronous pass visibly exceeds a frame budget. The smallest solution
used here is an explicit **Evaluate all targets** action, invalidating results after
mathematical edits and avoiding recomputation during hover, orientation, zoom, pan
or target inspection. The busy status is painted before synchronous evaluation;
interaction can still pause for hundreds of milliseconds during a large pass.
This limitation is shown candidly rather than hidden by stale visibility colors.

If continuous editing/live evaluation is required next, first measure cooperative
batches that yield between targets and invalidate superseded work. That is a smaller
change than introducing workers or redesigning the accepted exact geometry. No
worker, speculative cache or optimized traversal is justified or added in M3A.
The separate [geometry baseline](performance.md) was rerun because tooling/config
fingerprints changed; mathematical production code remained unchanged.
