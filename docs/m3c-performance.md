# M3C responsiveness and validation profile

This protocol compares synchronous and cooperative evaluation of the same accepted
populated 117-cell and 468-cell Memoir workloads. Final measurements below use the verified source, with no overlapping test or
benchmark workload.

```sh
nvm use
npm ci
npx playwright install --with-deps chromium
npx vite build --config vite.benchmark.config.ts
node benchmarks/browser-run.mjs release
```

The separate benchmark build contains an unshipped `release.html` entry. Its raw
artifact retains exact input boards, stable IDs, observer, candidates, all timing
samples, complete result-map hashes, source fingerprints and hardware/runtime.
The shared workload builder preserves the M3B numeric snapshot-order seeding:
terrain on every cell, installations every fourth cell, units every eleventh cell,
centered standard Artillery observer, target `(2,0)`, no additional user cap.
The same 1757/20525 conservative candidates are fully evaluated.

There are three warmups and nine measured paired repetitions per board, with mode
order alternating. Each iteration measures the quiescent pair first, the
continuous-interaction stress pair second, then the validation profile. Median is the middle of nine; p95 uses nearest rank and is the
maximum. No deliberate parallel test/benchmark workload, CPU throttling or forced
GC is used. Headless Chromium desktop measurements are not physical-device timing,
a hard frame deadline, a memory-ceiling claim or a cross-machine test gate.

Each pass constructs pending presentation, evaluates all targets, then atomically
constructs the completed SVG, controls and exact inspection. Partial result maps
stay private. Reported times distinguish evaluation wall time (including yields
for cooperative mode), pending DOM, completed presentation DOM/layout and total
time to completed DOM. They do not claim exact GPU paint completion.

The quiescent pair has no synthetic input or heartbeat. The separate stress pair
uses a native 16-ms interval that dispatches keyboard pan and wheel zoom events while
calculation is active. Probe counts show whether the browser gets opportunities
to process those events before the batch finishes. Maximum probe gaps are a task
queue responsiveness proxy, not measured hardware-input latency. Separate maxima
cover evaluation and the full pending/evaluation/final-DOM pass. Final atomic
rendering remains synchronous. The same interaction code is used in the actual
application; browser tests also send real Playwright keyboard input mid-evaluation.

Every full result map, including context, geometry, decisions, exact evidence and
simultaneous events, must match the synchronous reference SHA-256. Hashing and
reference construction occur outside timed regions. Geometry/board/ruleset source
is unchanged. The unchanged synchronous reference remains available to distinguish
scheduling cost from mathematical cost.

Repeated board validation is profiled in a separate pass by wrapping only the
accepted ruleset's `validateBoard` function and timing its ordinary public evaluator
invocations. The wrapper forwards every call with no caching or bypass. It must
produce the identical full result-map checksum and exactly one validation call per
target. Query totals include normal public evaluation and instrumentation, excluding
batch preflight/presentation. Validation share is nested validation time divided by
that pass's query time; it is not a claim that removing validation would recover
that entire duration. Profiling overhead and allocation/GC effects are not isolated.

The 8-ms / 8-target chunk policy yields through native timers. An individual query
can exceed the chunk budget; repeated validation is retained. Admission limits stay
unchanged. Any recommendation beyond cooperative yielding requires separate
profiling/review, particularly a validated-snapshot API, caching, workers or a
geometry traversal change.

## Final measured results

Measured **2026-11-28T12:26:34.843Z**. Source SHA-256:
`3c94de23fcb3100b81846f8256c67eea5b5717118adafe79e0589846f237432c`. Raw inputs, all samples and fingerprints:
[release-results.json](../benchmarks/release-results.json).

Hardware/runtime: Intel(R) Core(TM) i7-2600 CPU @ 3.40GHz; 8 logical CPUs;
16,130,686,976 bytes RAM; linux 7.0.0-44-generic x64;
Node v22.13.1, npm 10.9.2, Vite 8.4.0, Playwright 1.65.1,
Chromium 159.0.8154.6. Viewport 1440 × 1000, device pixel ratio 1.

### Quiescent completion (no synthetic input)

| Cells | Mode        | Evaluation median / p95 ms | Complete DOM median / p95 ms |
| ----: | ----------- | -------------------------: | ---------------------------: |
|   117 | synchronous |              128.6 / 141.1 |                186.6 / 199.0 |
|   117 | cooperative |              223.1 / 271.7 |                278.6 / 348.2 |
|   468 | synchronous |             740.4 / 1204.7 |               877.7 / 1464.5 |
|   468 | cooperative |            1469.8 / 2305.9 |              1614.0 / 2490.0 |

### Continuous-interaction stress (16-ms pan/zoom probes)

The following completion times include the extra rendering work of input handled
during cooperative evaluation. They are not isolated scheduling overhead.

| Cells | Mode        | Evaluation median / p95 ms | Complete DOM median / p95 ms | Evaluation probe gap median / p95 ms | Whole-pass probe gap median / p95 ms |
| ----: | ----------- | -------------------------: | ---------------------------: | -----------------------------------: | -----------------------------------: |
|   117 | synchronous |              126.5 / 132.4 |                184.0 / 188.9 |                        126.5 / 132.4 |                        190.9 / 201.4 |
|   117 | cooperative |              392.4 / 428.7 |                447.3 / 507.5 |                          38.0 / 49.0 |                          48.8 / 70.4 |
|   468 | synchronous |             718.5 / 1220.0 |               875.7 / 1404.2 |                       718.5 / 1220.0 |                       903.0 / 1427.4 |
|   468 | cooperative |            2383.1 / 5082.5 |              2529.9 / 5382.2 |                         60.9 / 118.5 |                        103.5 / 232.4 |

| Cells | Full-board validation median / p95 ms | Public query total median / p95 ms | Validation share median / p95 % | Calls per pass |
| ----: | ------------------------------------: | ---------------------------------: | ------------------------------: | -------------: |
|   117 |                           36.3 / 41.0 |                      127.4 / 142.4 |                     28.4 / 30.8 |            117 |
|   468 |                         332.1 / 672.0 |                     743.2 / 1422.1 |                     45.0 / 47.3 |            468 |

Cooperative runs process keyboard and wheel probes during evaluation; synchronous
runs cannot. Yielding improves input opportunities. The quiescent pair quantifies
completion cost without active interaction; the stress pair also includes the
additional rendering work of continuous pan/zoom. Neither reduces mathematical
work or repeated validation.
Whole-pass gaps retain the cost of atomic pending/completed DOM work.

The 8-ms / 8-target policy is retained as a small UI scheduling change. No new
resource default, validated-snapshot API, worker or cache is introduced. Validation
is a measured contribution, not permission to bypass it. A single query and final
rendering remain indivisible; physical-device and low-end-device measurements
remain unverified.

The generic synchronous reference, populated Memoir synchronous reference and
actual production automatic-update protocol were also rerun. See
[M3A baseline/automatic measurements](m3a-performance.md) and
[M3B populated reference](m3b-performance.md). All complete mathematical result
hashes match the accepted pre-M3C workloads; scheduling/profile result hashes do too.
