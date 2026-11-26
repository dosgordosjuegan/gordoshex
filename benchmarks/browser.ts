import '../web/style.css';
import { axial, coordinateKey, rationalKey, localEdge } from '../src/index.js';
import {
  initialState,
  generate,
  addGeneric,
  editEdge,
  type AppState,
} from '../web/state.js';
import { evaluateBoard } from '../web/evaluation.js';
import { renderBoard } from '../web/render.js';
const svg = document.getElementById('bench-board');
if (!(svg instanceof SVGSVGElement)) throw new Error('SVG');
const report = document.getElementById('report');
if (!report) throw new Error('report');
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));
const data = [];
for (const [width, height] of [
  [13, 9],
  [26, 18],
] as const) {
  const base = generate(
    initialState(),
    String(width),
    String(height),
    'pointy-odd-row',
  );
  // Observe the middle local offset row/column, translated by the generator formula.
  let state: AppState = {
    ...base,
    origin: axial(
      BigInt(Math.floor(width / 2) - Math.floor(Math.floor(height / 2) / 2)),
      BigInt(Math.floor(height / 2)),
    ),
    target: axial(2n, 0n),
  };
  for (const [index, cell] of state.board.cells.entries()) {
    if (index % 17 === 0)
      state = addGeneric(state, cell.coordinate, 'obstacle');
    if (index % 41 === 0) state = addGeneric(state, cell.coordinate, 'marker');
    if (index % 59 === 0)
      state = editEdge(state, localEdge(cell.coordinate, 0));
  }
  const samples = [],
    referenceCounts = [],
    targets = state.board.cells.map((c) => coordinateKey(c.coordinate));
  let expected = '';
  for (let iteration = -3; iteration < 9; iteration++) {
    const start = performance.now(),
      batch = evaluateBoard(state),
      evaluationMs = performance.now() - start;
    if (batch.status !== 'complete' || batch.results.size !== width * height)
      throw new Error('Incomplete benchmark');
    const renderStart = performance.now(),
      drawing = renderBoard(svg, state, batch, null);
    svg.setAttribute(
      'viewBox',
      `${drawing.frame.x} ${drawing.frame.y} ${drawing.frame.width} ${drawing.frame.height}`,
    );
    svg.getBoundingClientRect();
    const renderMs = performance.now() - renderStart;
    const frameStart = performance.now();
    await frame();
    await frame();
    const twoFrameMs = performance.now() - frameStart;
    // Complete result checksum outside all timed regions; data contains BigInts.
    const canonical = JSON.stringify([...batch.results], (_, value: unknown) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
    // Evaluation elapsed-time metadata is not in result entries.
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(canonical),
        ),
      ),
    )
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
    if (expected && digest !== expected)
      throw new Error('Work checksum changed');
    expected = digest;
    const counts = [...batch.results.values()].map((result) => {
      if (result.status !== 'evaluated')
        throw new Error('Failed benchmark query');
      return {
        target: coordinateKey(result.context.target),
        candidates: String(result.context.geometry.candidateCount),
        cells: result.context.geometry.cells.length,
        edges: result.context.geometry.edges.length,
        events: result.context.geometry.events.map((e) => rationalKey(e.t)),
      };
    });
    if (iteration === 0) referenceCounts.push(...counts);
    if (iteration >= 0)
      samples.push({
        evaluationMs,
        renderMs,
        twoFrameMs,
        candidates: String(batch.candidates),
        checksum: digest,
      });
  }
  data.push({
    width,
    height,
    counts: referenceCounts,
    observer: state.origin ? coordinateKey(state.origin) : null,
    targets,
    warmups: 3,
    repetitions: 9,
    layout: 'pointy-odd-row',
    orientation: 'pointy',
    policy: state.rulesetId,
    range: 'unlimited',
    maxCandidates: '1000',
    samples,
  });
}
report.textContent = JSON.stringify({
  userAgent: navigator.userAgent,
  viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
  data,
});
document.body.dataset.done = 'true';
