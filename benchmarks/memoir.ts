import '../web/style.css';
import { coordinateKey } from '../src/index.js';
import { memoirWorkload } from './memoir-workload.js';
import { evaluateBoard } from '../web/evaluation.js';
import { renderBoard, renderInspection } from '../web/render.js';
import { shell, element } from '../web/controls.js';
import {
  renderMemoirPalette,
  renderMemoirContents,
  syncProfileControls,
  syncRangeControls,
} from '../web/memoir-controls.js';
const root = document.getElementById('app');
if (!root) throw new Error('App');
shell(root);
const svg = document.getElementById('board');
if (!(svg instanceof SVGSVGElement)) throw new Error('SVG');
const report = document.getElementById('report');
if (!report) throw new Error('Report');
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));
const data = [];
for (const [width, height] of [
  [13, 9],
  [26, 18],
] as const) {
  const state = memoirWorkload(width, height),
    board = state.board,
    observer = state.origin;
  if (!observer) throw new Error('Observer');
  const samples = [];
  let expected = '';
  let counts: unknown = null;
  for (let iteration = -3; iteration < 9; iteration++) {
    const start = performance.now(),
      batch = evaluateBoard(state),
      evaluationMs = performance.now() - start;
    if (batch.status !== 'complete' || batch.results.size !== width * height)
      throw new Error('Incomplete pass');
    const renderStart = performance.now();
    syncProfileControls(state);
    syncRangeControls(state);
    const drawing = renderBoard(svg, state, batch, null);
    svg.setAttribute(
      'viewBox',
      `${drawing.frame.x} ${drawing.frame.y} ${drawing.frame.width} ${drawing.frame.height}`,
    );
    renderInspection(
      element('target-inspection'),
      state,
      batch.results.get('2,0'),
    );
    renderMemoirPalette(state, () => {});
    renderMemoirContents(state, () => {});
    svg.getBoundingClientRect();
    const presentationMs = performance.now() - renderStart,
      frameStart = performance.now();
    await frame();
    await frame();
    const twoFrameMs = performance.now() - frameStart;
    const canonical = JSON.stringify([...batch.results], (_, value: unknown) =>
      typeof value === 'bigint' ? String(value) : value,
    );
    const checksum = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(canonical),
        ),
      ),
    )
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    if (expected && expected !== checksum) throw new Error('Work changed');
    expected = checksum;
    if (iteration === 0)
      counts = [...batch.results.values()].map((result) => {
        if (result.status !== 'evaluated') throw new Error('Evaluation failed');
        return {
          target: coordinateKey(result.context.target),
          candidates: String(result.context.geometry.candidateCount),
          cells: result.context.geometry.cells.length,
          edges: result.context.geometry.edges.length,
          events: result.context.geometry.events.length,
          los: result.los.status,
          range: result.range.status,
        };
      });
    if (iteration >= 0)
      samples.push({
        evaluationMs,
        presentationMs,
        twoFrameMs,
        candidates: String(batch.candidates),
        checksum,
      });
  }
  data.push({
    width,
    height,
    observer: coordinateKey(observer),
    policy: state.rulesetId,
    version: '1',
    range: 'no-additional-cap',
    maxCandidates: '1000',
    layout: 'pointy-odd-row',
    orientation: 'pointy',
    warmups: 3,
    repetitions: 9,
    board: board.cells,
    counts,
    samples,
  });
}
report.textContent = JSON.stringify(
  {
    userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    data,
  },
  (_, value: unknown) => (typeof value === 'bigint' ? String(value) : value),
);
document.body.dataset.done = 'true';
