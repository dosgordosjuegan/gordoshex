import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--outDir',
    'browser-dist',
    '--host',
    '127.0.0.1',
    '--port',
    '4176',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
let browser;
try {
  for (let n = 0; n < 100; n++) {
    try {
      if ((await globalThis.fetch('http://127.0.0.1:4176')).ok) break;
    } catch {
      /* server startup */
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const data = [];
  for (const [width, height] of [
    [13, 9],
    [26, 18],
  ]) {
    await page.goto('http://127.0.0.1:4176');
    await page.waitForSelector('#batch-status[data-phase="complete"]');
    const obstacles = [];
    for (let row = 0; row < height; row++)
      for (let column = 0; column < width; column++)
        if ((row * width + column) % 17 === 0)
          obstacles.push({ q: column - Math.floor(row / 2), r: row });
    const observer = {
      q: Math.floor(width / 2) - Math.floor(Math.floor(height / 2) / 2),
      r: Math.floor(height / 2),
    };
    await page.evaluate(
      ({ width, height, obstacles, observer }) => {
        const doc = globalThis.document;
        const value = (id, value) => {
          const node = doc.getElementById(id);
          node.value = String(value);
        };
        const submit = (id) =>
          doc.getElementById(id).dispatchEvent(
            new globalThis.Event('submit', {
              bubbles: true,
              cancelable: true,
            }),
          );
        const mode = (value) => {
          doc.getElementById('mode').value = value;
          doc
            .getElementById('mode')
            .dispatchEvent(new globalThis.Event('change', { bubbles: true }));
        };
        value('width', width);
        value('height', height);
        submit('generate');
        mode('add-obstacle');
        for (const coordinate of obstacles) {
          value('q', coordinate.q);
          value('r', coordinate.r);
          submit('coordinate');
        }
        mode('observer');
        value('q', observer.q);
        value('r', observer.r);
        submit('coordinate');
        mode('inspect');
        value('q', 2);
        value('r', 0);
        submit('coordinate');
        doc.getElementById('unlimited').checked = false;
        doc
          .getElementById('unlimited')
          .dispatchEvent(new globalThis.Event('change', { bubbles: true }));
      },
      { width, height, obstacles, observer },
    );
    await page.waitForSelector('#batch-status[data-phase="complete"]');
    const samples = [],
      checksums = new Map();
    for (let iteration = -3; iteration < 9; iteration++) {
      const radius = iteration % 2 === 0 ? 2 : 3;
      const sample = await page.evaluate(
        (radius) =>
          new Promise((resolve, reject) => {
            const doc = globalThis.document,
              status = doc.getElementById('batch-status'),
              input = doc.getElementById('radius'),
              previous = Number(status.dataset.evaluations),
              start = globalThis.performance.now();
            let pendingMs,
              runningMs,
              finished = false;
            const timeout = globalThis.setTimeout(() => {
              observer.disconnect();
              reject(new Error('Automatic benchmark timed out'));
            }, 30000);
            const observer = new globalThis.MutationObserver(() => {
              const phase = status.dataset.phase;
              if (phase === 'running' && runningMs === undefined)
                runningMs = globalThis.performance.now() - start;
              if (
                phase !== 'complete' ||
                Number(status.dataset.evaluations) !== previous + 1 ||
                finished
              )
                return;
              finished = true;
              const completeMs = globalThis.performance.now() - start;
              observer.disconnect();
              globalThis.clearTimeout(timeout);
              const cells = [
                ...doc.querySelectorAll('[data-cell]:not(.absent)'),
              ].map((node) => ({
                coordinate: node.getAttribute('data-cell'),
                classes: node.getAttribute('class'),
              }));
              const inspection =
                doc.getElementById('target-inspection').textContent;
              globalThis.requestAnimationFrame(() =>
                globalThis.requestAnimationFrame(() =>
                  resolve({
                    radius,
                    pendingMs,
                    runningMs,
                    completeMs,
                    twoFrameCompleteMs: globalThis.performance.now() - start,
                    cells,
                    inspection,
                    status: status.textContent,
                    evaluations: Number(status.dataset.evaluations) - previous,
                  }),
                ),
              );
            });
            observer.observe(status, {
              attributes: true,
              childList: true,
              subtree: true,
            });
            input.value = String(radius);
            input.dispatchEvent(
              new globalThis.Event('input', { bubbles: true }),
            );
            pendingMs = globalThis.performance.now() - start;
            if (
              status.dataset.phase !== 'pending' ||
              doc.querySelector(
                '.cell.visible,.cell.blocked,.cell.out-of-range,.cell.failed',
              )
            ) {
              observer.disconnect();
              globalThis.clearTimeout(timeout);
              reject(new Error('Stale results remained after edit'));
            }
          }),
        radius,
      );
      if (
        sample.cells.length !== width * height ||
        sample.evaluations !== 1 ||
        sample.cells.some(
          (c) => c.classes.includes('pending') || c.classes.includes('failed'),
        )
      )
        throw new Error('Incomplete automatic pass');
      const checksum = createHash('sha256')
        .update(
          JSON.stringify({
            cells: sample.cells,
            inspection: sample.inspection,
          }),
        )
        .digest('hex');
      if (checksums.has(radius) && checksums.get(radius) !== checksum)
        throw new Error('Presentation checksum changed');
      checksums.set(radius, checksum);
      const timings = {
        radius: sample.radius,
        pendingMs: sample.pendingMs,
        runningMs: sample.runningMs,
        completeMs: sample.completeMs,
        twoFrameCompleteMs: sample.twoFrameCompleteMs,
        status: sample.status,
        evaluations: sample.evaluations,
      };
      if (iteration >= 0) samples.push({ ...timings, checksum });
    }
    const summarize = (key) => {
      const sorted = samples.map((s) => s[key]).sort((a, b) => a - b);
      return { median: sorted[4], p95: sorted[8] };
    };
    data.push({
      width,
      height,
      layout: 'pointy-odd-row',
      observer,
      obstacles,
      policy: 'generic.interior-only',
      radii: [2, 3],
      warmups: 3,
      repetitions: 9,
      samples,
      summary: Object.fromEntries(
        ['pendingMs', 'runningMs', 'completeMs', 'twoFrameCompleteMs'].map(
          (k) => [k, summarize(k)],
        ),
      ),
    });
  }
  if (errors.length) throw new Error(errors.join('; '));
  const files = [];
  for (const directory of ['src', 'web'])
    for (const path of await readdir(directory, { recursive: true }))
      if (path.endsWith('.ts') || path.endsWith('.css'))
        files.push(`${directory}/${path}`);
  files.push(
    'benchmarks/automatic-run.mjs',
    'index.html',
    'vite.config.ts',
    'package-lock.json',
  );
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(file));
  }
  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      sourceSha256: hash.digest('hex'),
      sourceFiles: files,
      node: process.version,
      browser: browser.version(),
      platform: os.platform(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      viewport: { width: 1440, height: 1000 },
      debounceMs: 150,
      statistic: 'Median middle of 9; p95 nearest rank ceil(.95*n)-1',
    },
    data,
  };
  await writeFile(
    'benchmarks/automatic-results.json',
    JSON.stringify(output, null, 2) + '\n',
  );
  console.log(
    JSON.stringify(
      data.map((d) => ({ cells: d.width * d.height, summary: d.summary })),
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  server.kill();
}
