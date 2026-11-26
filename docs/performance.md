# Reproducible M1 performance baseline

Source snapshot SHA-256: `f438b686384681d4437ff670a1ce7c4710be13811dbdad5bdc028493f6375edc`. Raw samples, exact target lists, per-query counts, checksums and memory observations are retained in [benchmarks/results.json](../benchmarks/results.json). The snapshot hashes the ordered filenames, NUL separator and contents listed in `metadata.sourceFiles`; documentation and tests are outside this production/benchmark identity.

Run `nvm use`, `npm ci`, then `npm run benchmark`. This rebuilds the library and replaces the raw result file. No service, board model, ruleset or rendering is involved. Whole passes evaluate geometry from one observer to every coordinate in the specified axial target set, including self.

Measured 2026-11-26T22:18:17.839Z on Ubuntu 26.04.1 LTS, Linux 7.0.0-44-generic, x64; Intel(R) Core(TM) i7-2600 CPU @ 3.40GHz, 8 logical CPUs; 16,130,686,976 bytes physical RAM. Node v22.13.1, npm 10.9.2; exact tool versions are in the raw metadata and implementation.md. Native compiled ES2022 ESM, one synchronous process; no parallel queries or forced garbage collection.

Every dataset uses an explicit `1000n` candidate limit, three warmups and deterministic endpoint lists (no random seed). Singles/rejections have 50 measured repetitions; whole passes have 15. Timing uses `performance.now()` around complete query construction only. Each output is hashed and compared with its reference outside the timed region on every repetition. Checksums cover full records, not just counts. Work is identical across repetitions. Large translated copies use `(9007199254740993,-9007199254740993)`.

Median averages the two middle samples for even repetition counts. P95 is the nearest-rank statistic `sorted[ceil(0.95*n)-1]`. Raw samples are retained; no cross-machine timing gates are imposed. The original nontranslated G1–G4 datasets also include cold JIT effects after three warmups; shorter translated timings do not establish that huge coordinates are faster.

| Dataset                           | Queries | Candidates / hits / edges / events | Median ms |  P95 ms |
| --------------------------------- | ------: | ---------------------------------- | --------: | ------: |
| G1                                |       1 | 3 / 3 / 2 / 4                      |     0.344 |   0.501 |
| G1-huge-translation               |       1 | 3 / 3 / 2 / 4                      |     0.258 |   0.622 |
| G2                                |       1 | 6 / 4 / 5 / 4                      |     0.276 |   0.520 |
| G2-huge-translation               |       1 | 6 / 4 / 5 / 4                      |     0.286 |   0.506 |
| G3                                |       1 | 12 / 8 / 9 / 7                     |     0.476 |   0.808 |
| G3-huge-translation               |       1 | 12 / 8 / 9 / 7                     |     0.497 |   0.895 |
| G4                                |       1 | 10 / 6 / 5 / 7                     |     0.319 |   0.527 |
| G4-huge-translation               |       1 | 10 / 6 / 5 / 7                     |     0.327 |   0.704 |
| rotated-edge-overlap              |       1 | 6 / 4 / 5 / 4                      |     0.218 |   0.363 |
| 13x9-short                        |       1 | 2 / 2 / 1 / 3                      |     0.110 |   0.145 |
| 13x9-long                         |       1 | 47 / 11 / 10 / 12                  |     0.615 |   0.951 |
| 13x9-whole-pass                   |     117 | 1819 / 739 / 718 / 796             |    41.501 |  55.255 |
| 13x9-whole-pass-huge-translation  |     117 | 1819 / 739 / 718 / 796             |    44.345 |  53.516 |
| 26x18-short                       |       1 | 2 / 2 / 1 / 3                      |     0.105 |   0.288 |
| 26x18-long                        |       1 | 190 / 24 / 23 / 25                 |     1.448 |   1.839 |
| 26x18-whole-pass                  |     468 | 21485 / 5489 / 5491 / 5628         |   314.830 | 367.777 |
| 26x18-whole-pass-huge-translation |     468 | 21485 / 5489 / 5491 / 5628         |   337.024 | 405.401 |
| budget-boundary-1000-horizontal   |       1 | 1000 / 1000 / 999 / 1001           |    52.211 |  67.703 |
| near-budget-962-diagonal          |       1 | 962 / 50 / 49 / 51                 |     4.124 |   4.887 |
| preflight-rejection-enormous      |       1 | rejected; exact N in raw file      |     0.007 |   0.018 |

The board-shaped target sets are `0<=q<13, 0<=r<9`, observer `(6,4)` (117 queries), and `0<=q<26, 0<=r<18`, observer `(13,9)` (468 queries). Short targets are one neighbor in direction 0; long targets are `(0,0)`. Maximum individual candidate counts are 47 and 190 respectively. G2 and its rotated companion exercise edge overlaps; G3 exercises isolated vertex contacts. The rejection target is `(0,10^100)`; its exact count is `(T*T+4*T+2)/2`, and all records are absent because preflight rejects it. Rejection has no completed hit/edge/event counts; zeros in console summaries are not a completed empty geometry.

Memory measurements are before/after RSS and heapUsed observations for each dataset, with no forced GC. They include retained references, runtime state, checksum work and earlier workloads; they are neither peak usage nor per-query allocation estimates. They are recorded for reproducibility and do not establish a memory ceiling.

M3A reran this unchanged geometry workload because the development-tooling and
TypeScript configuration fingerprint changed. Every complete-work checksum matches
the original M1 result. Earlier timing samples remain available in Git history.

## Resource default

The selected default is `DEFAULT_MAX_CANDIDATES = 1000n` per sightline. It admits every reference board query, with about 5.3 times the largest measured candidate count. The separately measured exact 1,000-candidate horizontal boundary also exercises the high-output case (1,000 hits, 999 edges, 1,001 events). Its roughly 52 ms median and 68 ms p95 on this machine support a conservative default rather than a much larger unmeasured cap. A near-limit diagonal needs far fewer output records and is much cheaper, so candidate count is a resource admission measure rather than a latency predictor.

The cap is configurable, inclusive and applies before the degenerate shortcut. Zero denies every sightline. Explicit budgets are recommended for batch callers; the per-query cap does not cap total batch work. No geometry is truncated. Integer bit length and allocation cost remain additional factors; this cap is not a universal time/memory guarantee. Whole passes of 468 queries already take roughly 0.31–0.41 seconds here; future UI orchestration will need to account for batch scheduling/cancellation, which remains outside M1. No traversal optimization is proposed or implemented.
