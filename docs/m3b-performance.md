# M3B populated Memoir performance

Raw configuration, exact board membership/stacks/IDs, per-query counts/outcomes,
complete-work checksums, source identity and all samples are retained in
[memoir-results.json](../benchmarks/memoir-results.json).

Reproduce with pinned Node 22.13.1 / npm 10.9.2, without concurrent test/benchmark workloads:

```sh
nvm use
npm ci
npx playwright install chromium
npm run check
npx vite build --config vite.benchmark.config.ts
node benchmarks/browser-run.mjs memoir
```

The separate benchmark build contains the generic and Memoir entries; benchmark
code is not shipped in `browser-dist/`. The driver serves it on local port 4174,
launches pinned headless Chromium and closes browser/server on completion. The
same Node driver still supports the original `npm run benchmark:app` workload.

Measured **2026-11-28T12:23:32.306Z**. Source SHA-256:
`3c94de23fcb3100b81846f8256c67eea5b5717118adafe79e0589846f237432c`. The manifest hashes ordered filenames, a NUL separator
and file contents: production source/CSS, benchmark entries/driver/config and lockfile.
Documentation, screenshots and tests are excluded from this identity.

Hardware/runtime: Intel(R) Core(TM) i7-2600 CPU @ 3.40GHz, 8 logical CPUs,
16,130,686,976 bytes RAM; Ubuntu 26.04.1 / Linux 7.0.0-44-generic,
x64; Node v22.13.1, npm 10.9.2, Vite 8.4.0, Playwright 1.65.1,
Chromium 159.0.8154.6. Viewport 1440 × 1000, device pixel ratio 1.
No CPU throttling, forced GC or deliberate parallel workload. These are headless
measurements, not physical mobile-device performance or a memory-ceiling claim.

## Complete populated workloads

Both boards are staggered-row subsets translated from `(0,0)`, pointy display,
`memoir44.refresh2025` version `"1"`, with no additional user range cap and the
unchanged 1000n per-sightline limit. The selected observer is standard Artillery at
the middle local offset cell, `(4,4)` / `(9,9)`; target inspection uses `(2,0)`.
All existing cells are evaluated, including self and out-of-range cells.

In numeric snapshot order, terrain cycles through all ten supported values on
every cell, an installation appears every fourth cell and cycles through all five
values, and a standard unit appears every eleventh cell, cycling Infantry/Armor/
Artillery with alternating affiliations. The observer is forced to standard
Artillery without adding a second unit. The exact input board is retained. This
is a schema-valid LOS calculator fixture, not a legal-deployment/scenario claim.

| Cells | Terrain entities | Installations | Units | Candidates total |
| ----: | ---------------: | ------------: | ----: | ---------------: |
|   117 |              117 |            30 |    12 |            1,757 |
|   468 |              468 |           117 |    44 |           20,525 |

Each dataset has 3 warmups and 9 measured repetitions. Median is the middle of
nine; p95 is nearest rank `sorted[ceil(.95*n)-1]` (the maximum). Each pass must
complete every target without an evaluation failure. SHA-256 covers the complete
ordered result map (full context/board, geometry, decisions and all evidence), with
BigInts as decimal strings, outside timed regions on every repetition. Checksums
must remain identical. No result is silently truncated and no cross-machine
latency gate is imposed in tests.

- **Evaluation:** complete `evaluateBoard` call, including exact aggregate preflight,
  repeated adapter board validation, clipping/edges/events, range and LOS decisions,
  evidence snapshots and result-map construction.
- **Presentation:** actual production `renderBoard`, Memoir palette/contents,
  profile/range controls, target inspection and exact evidence DOM construction,
  viewBox assignment and forced layout. The benchmark uses the real HTML/CSS shell.
  It excludes debounce/pending/busy transitions and pointer interaction; it is not
  a complete input-to-paint measurement or isolated GPU time.
- **Two-frame wait:** separately observed rendering opportunity after presentation,
  not a precise GPU painting measurement. Do not add medians into a p95.

| Cells | Evaluation median / p95 ms | Presentation DOM/layout median / p95 ms | Two-frame wait median / p95 ms |
| ----: | -------------------------: | --------------------------------------: | -----------------------------: |
|   117 |                83.5 / 95.9 |                             25.5 / 38.5 |                    19.4 / 27.6 |
|   468 |              749.8 / 770.3 |                             76.9 / 79.3 |                    24.3 / 34.4 |

## Responsiveness decision and limits

The 117-cell configuration is practical for the prototype; the populated 468-cell
configuration has a substantial synchronous pause. Automatic updates still use the
accepted 150 ms debounce/revision guards and remove stale verdicts immediately.
The measured evaluation alone occupies roughly 0.75 seconds on this
machine; presentation adds further work. Debounce consolidates rapid edits but
cannot keep the main thread interactive during the pass.

All existing resource budgets remain: 512 cells/targets, 64 per generated dimension,
100,000 aggregate candidates, 1000n per sightline and existing stack/input/display
limits. The cap is admission, not a latency promise. No worker, result cache,
prevalidated-board shortcut or geometry traversal change is introduced.

M3C now implements cooperative yielding between bounded target chunks, preserving
the accepted per-query API and revision cancellation. See the
[before/after comparison and validation profile](m3c-performance.md). It improves
input opportunities without reducing total work. The synchronous reference here
still includes repeated board validation. No frontend bypass or separately
validated-snapshot API is introduced.

The [generic baseline and automatic-update workload](m3a-performance.md) were also
rerun after shared UI changes. Their mathematical complete-work checksums remain
unchanged. Geometry, board and ruleset production code is untouched.

Refreshed for M3C source identity. These evaluation tables retain the synchronous
reference; the browser now uses cooperative evaluation. See the
[M3C before/after comparison and validation profile](m3c-performance.md).
