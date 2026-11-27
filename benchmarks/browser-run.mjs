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
    'benchmark-dist',
    '--host',
    '127.0.0.1',
    '--port',
    '4174',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
let browser;
try {
  for (let n = 0; n < 100; n++) {
    try {
      if (
        (
          await globalThis.fetch(
            'http://127.0.0.1:4174/benchmarks/browser.html',
          )
        ).ok
      )
        break;
    } catch {
      /* server startup */
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.goto('http://127.0.0.1:4174/benchmarks/browser.html');
  await page.waitForFunction(
    () => globalThis.document.body.dataset.done === 'true',
    {},
    { timeout: 120000 },
  );
  const raw = await page.locator('#report').textContent();
  if (!raw) throw new Error('No results');
  const result = JSON.parse(raw);
  const files = [];
  for (const dir of ['src', 'web'])
    for (const entry of await readdir(dir, { recursive: true }))
      if (entry.endsWith('.ts') || entry.endsWith('.css'))
        files.push(`${dir}/${entry}`);
  files.push(
    'benchmarks/browser.ts',
    'benchmarks/browser-run.mjs',
    'benchmarks/browser.html',
    'vite.benchmark.config.ts',
    'package-lock.json',
  );
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(await readFile(file));
  }
  const summarize = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.ceil(0.95 * sorted.length) - 1],
    };
  };
  for (const dataset of result.data)
    dataset.summary = {
      evaluationMs: summarize(dataset.samples.map((s) => s.evaluationMs)),
      renderMs: summarize(dataset.samples.map((s) => s.renderMs)),
      twoFrameMs: summarize(dataset.samples.map((s) => s.twoFrameMs)),
    };
  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      sourceSha256: hash.digest('hex'),
      sourceFiles: files,
      node: process.version,
      browser: browser.version(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      statistic: 'Median middle of 9; p95 nearest rank ceil(.95*n)-1',
      ...result,
    },
  };
  await writeFile(
    'benchmarks/browser-results.json',
    JSON.stringify(output, null, 2) + '\n',
  );
  console.log(
    JSON.stringify(
      result.data.map((d) => ({
        cells: d.width * d.height,
        candidates: d.samples[0].candidates,
        ...d.summary,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  server.kill();
}
