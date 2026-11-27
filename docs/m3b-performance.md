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

Measured **2026-11-27T15:30:19.526Z**. Source SHA-256:
`5de105d4df8f653e87f51ec033b5ab58f57c04429f38d66b8eae102bb10dc5ab`. The manifest hashes ordered filenames, a NUL separator
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
|   117 |                85.5 / 95.3 |                             25.5 / 28.7 |                    10.6 / 23.8 |
|   468 |              753.5 / 796.1 |                             94.2 / 97.6 |                    29.1 / 37.7 |

## Responsiveness decision and limits

The 117-cell configuration is practical for the prototype; the populated 468-cell
configuration has a substantial synchronous pause. Automatic updates still use the
accepted 150 ms debounce/revision guards and remove stale verdicts immediately.
The measured evaluation alone occupies roughly three quarters of a second on this
machine; presentation adds further work. Debounce consolidates rapid edits but
cannot keep the main thread interactive during the pass.

All existing resource budgets remain: 512 cells/targets, 64 per generated dimension,
100,000 aggregate candidates, 1000n per sightline and existing stack/input/display
limits. The cap is admission, not a latency promise. No worker, result cache,
prevalidated-board shortcut or geometry traversal change is introduced.

The smallest next UI improvement to measure is cooperative yielding between target
batches, retaining exact preflight and invalidating superseded work through the
existing revision mechanism. This preserves the accepted per-query API and improves
opportunity to handle input; it does not reduce total work. Repeated full-board
validation is included here, but this timing alone does not isolate its cost.
Profile it before proposing a separately reviewed validated immutable-snapshot
contract. Frontend bypassing of validation is not recommended.

The [generic baseline and automatic-update workload](m3a-performance.md) were also
rerun after shared UI changes. Their mathematical complete-work checksums remain
unchanged. Geometry, board and ruleset production code is untouched.
