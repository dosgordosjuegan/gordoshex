import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { axial, traceSightline } from '../dist/index.js';
const limit = 1000n;
const origin = axial(0n, 0n);
const delta = axial(9007199254740993n, -9007199254740993n);
const shift = (c) => axial(c.q + delta.q, c.r + delta.r);
const serial = (v) =>
  JSON.stringify(v, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
const hash = (v) => createHash('sha256').update(serial(v)).digest('hex');
const board = (width, height) =>
  Array.from({ length: width * height }, (_, i) =>
    axial(BigInt(i % width), BigInt(Math.floor(i / width))),
  );
const datasets = [];
const add = (name, observer, targets, category = 'single') =>
  datasets.push({ name, observer, targets, category });
for (const [i, target] of [
  axial(2n, 0n),
  axial(2n, -1n),
  axial(4n, 1n),
  axial(3n, 1n),
].entries()) {
  add(`G${i + 1}`, origin, [target]);
  add(`G${i + 1}-huge-translation`, shift(origin), [shift(target)]);
}
add('rotated-edge-overlap', origin, [axial(1n, 1n)]);
for (const [width, height, observer] of [
  [13, 9, axial(6n, 4n)],
  [26, 18, axial(13n, 9n)],
]) {
  add(`${width}x${height}-short`, observer, [
    axial(observer.q + 1n, observer.r),
  ]);
  add(`${width}x${height}-long`, observer, [origin]);
  const targets = board(width, height);
  add(`${width}x${height}-whole-pass`, observer, targets, 'whole-pass');
  add(
    `${width}x${height}-whole-pass-huge-translation`,
    shift(observer),
    targets.map(shift),
    'whole-pass',
  );
}
add('budget-boundary-1000-horizontal', origin, [axial(999n, 0n)]);
add('near-budget-962-diagonal', origin, [axial(25n, 24n)]);
add(
  'preflight-rejection-enormous',
  origin,
  [axial(0n, 10n ** 100n)],
  'rejection',
);
const files = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'benchmarks/run.mjs',
  ...readdirSync('src/geometry')
    .sort()
    .map((f) => `src/geometry/${f}`),
  'src/index.ts',
];
const sourceSnapshot = createHash('sha256');
for (const file of files)
  sourceSnapshot.update(file).update('\0').update(readFileSync(file));
const result = {
  metadata: {
    date: new Date().toISOString(),
    sourceSha256: sourceSnapshot.digest('hex'),
    sourceFiles: files,
    node: process.version,
    npm:
      process.env.npm_config_user_agent?.match(/npm\/(\S+)/)?.[1] ??
      'unknown (run through npm run benchmark)',
    tools: JSON.parse(readFileSync('package.json', 'utf8')).devDependencies,
    os: {
      platform: os.platform(),
      release: os.release(),
      distribution: readFileSync('/etc/os-release', 'utf8'),
      arch: os.arch(),
    },
    cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    execution:
      'TypeScript ES2022 compiled ESM, native Node, single process, synchronous reference enumeration',
    seed: 'No randomness; targets listed in each dataset',
    maxCandidates: limit.toString(),
    warmups: 3,
    singleRepetitions: 50,
    wholePassRepetitions: 15,
    aggregate:
      'median (mean of middle two for even n); p95 = sorted[ceil(0.95*n)-1]',
    checksum:
      'SHA-256 of complete results with bigint decimal strings; verified outside timing for every run',
    memory:
      'RSS and heapUsed observations before/after dataset; no forced GC, no peak or per-query allocation claim',
  },
  datasets: [],
};
for (const data of datasets) {
  const run = () =>
    data.targets.map((target) => traceSightline(data.observer, target, limit));
  const reference = run();
  for (const entry of reference) {
    if (
      data.category === 'rejection'
        ? entry.status !== 'resource-limit'
        : entry.status !== 'complete'
    )
      throw new Error('Unexpected completion status');
  }
  const checksum = hash(reference);
  const verify = (outputs) => {
    if (hash(outputs) !== checksum) throw new Error('Work checksum changed');
  };
  for (let i = 0; i < 3; i++) verify(run());
  const before = process.memoryUsage(),
    samples = [];
  const reps = data.category === 'whole-pass' ? 15 : 50;
  for (let i = 0; i < reps; i++) {
    const start = performance.now();
    const outputs = run();
    samples.push(performance.now() - start);
    verify(outputs);
  }
  const after = process.memoryUsage(),
    sorted = [...samples].sort((a, b) => a - b);
  const counts = reference.map((r) => ({
    candidates: r.candidateCount.toString(),
    hits: r.status === 'complete' ? r.cells.length : null,
    edges: r.status === 'complete' ? r.edges.length : null,
    events: r.status === 'complete' ? r.events.length : null,
  }));
  const totals = counts.reduce(
    (a, c) => ({
      candidates: a.candidates + BigInt(c.candidates),
      hits: a.hits + (c.hits ?? 0),
      edges: a.edges + (c.edges ?? 0),
      events: a.events + (c.events ?? 0),
    }),
    { candidates: 0n, hits: 0, edges: 0, events: 0 },
  );
  const entry = {
    ...data,
    queries: data.targets.length,
    checksum,
    counts,
    totals,
    milliseconds: {
      samples,
      median:
        (sorted[Math.floor((reps - 1) / 2)] + sorted[Math.floor(reps / 2)]) / 2,
      p95: sorted[Math.ceil(0.95 * reps) - 1],
    },
    memoryBytes: {
      before: { rss: before.rss, heapUsed: before.heapUsed },
      after: { rss: after.rss, heapUsed: after.heapUsed },
    },
  };
  result.datasets.push(entry);
  console.log(
    `${data.name}: ${entry.milliseconds.median.toFixed(3)} ms median, ${entry.milliseconds.p95.toFixed(3)} ms p95; ${totals.candidates} candidates / ${totals.hits} hits / ${totals.edges} edges / ${totals.events} events`,
  );
}
writeFileSync('benchmarks/results.json', `${serial(result)}\n`);
