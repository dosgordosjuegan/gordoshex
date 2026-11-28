import '../web/style.css';
import { coordinateKey } from '../src/index.js';
import {
  evaluateVisibility,
  MEMOIR44_REFRESH2025,
  type Ruleset,
  type VisibilityResult,
} from '../src/application.js';
import {
  evaluateBoard,
  evaluateBoardCooperatively,
  type Batch,
  EVALUATION_CHUNK_MS,
  EVALUATION_CHUNK_TARGETS,
} from '../web/evaluation.js';
import { shell, element } from '../web/controls.js';
import { renderBoard, renderInspection } from '../web/render.js';
import {
  renderMemoirPalette,
  renderMemoirContents,
  syncProfileControls,
  syncRangeControls,
} from '../web/memoir-controls.js';
import { bindBoard } from '../web/interaction.js';
import type { AppState } from '../web/state.js';
import { memoirWorkload } from './memoir-workload.js';
const root = document.getElementById('app');
if (!root) throw new Error('App');
shell(root);
const svgNode = document.getElementById('board');
if (!(svgNode instanceof SVGSVGElement)) throw new Error('SVG');
const svg = svgNode;
const interaction = bindBoard(
  svg,
  () => {},
  () => {},
  () => {},
);
function present(state: AppState, batch: Batch | null): void {
  syncProfileControls(state);
  syncRangeControls(state);
  const drawing = renderBoard(svg, state, batch, null);
  interaction.fit(drawing.frame);
  renderInspection(
    element('target-inspection'),
    state,
    batch?.status === 'complete' ? batch.results.get('2,0') : undefined,
  );
  renderMemoirPalette(state, () => {});
  renderMemoirContents(state, () => {});
  svg.getBoundingClientRect();
}
async function checksum(
  results: ReadonlyMap<string, VisibilityResult>,
): Promise<string> {
  const text = JSON.stringify([...results], (_, value: unknown) =>
    typeof value === 'bigint' ? String(value) : value,
  );
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
  );
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
const data = [];
for (const [width, height] of [
  [13, 9],
  [26, 18],
] as const) {
  const state = memoirWorkload(width, height),
    reference = evaluateBoard(state);
  if (reference.status !== 'complete' || !state.origin)
    throw new Error('Reference');
  const expected = await checksum(reference.results),
    samples = [],
    quiescentSamples = [],
    validationSamples = [];
  for (let iteration = -3; iteration < 9; iteration++) {
    // Separate idle completion cost from the extra rendering work of continuous input.
    for (const mode of iteration % 2
      ? ['cooperative', 'synchronous']
      : ['synchronous', 'cooperative']) {
      const start = performance.now();
      present(state, null);
      const pendingMs = performance.now() - start;
      const evaluationStart = performance.now();
      const batch =
        mode === 'synchronous'
          ? evaluateBoard(state)
          : await evaluateBoardCooperatively(state, {
              cancelled: () => false,
              progress: (completed, total) => {
                element('batch-status').textContent = `${completed}/${total}`;
              },
            });
      const evaluationMs = performance.now() - evaluationStart;
      if (batch?.status !== 'complete' || batch.results.size !== width * height)
        throw new Error('Partial idle batch');
      const renderStart = performance.now();
      present(state, batch);
      const presentationMs = performance.now() - renderStart,
        completeDomMs = performance.now() - start;
      const actual = await checksum(batch.results);
      if (actual !== expected)
        throw new Error('Idle scheduling changed mathematics');
      if (iteration >= 0)
        quiescentSamples.push({
          mode,
          evaluationMs,
          pendingMs,
          presentationMs,
          completeDomMs,
          candidates: String(batch.candidates),
          checksum: actual,
        });
    }
    for (const mode of iteration % 2
      ? ['cooperative', 'synchronous']
      : ['synchronous', 'cooperative']) {
      let last = performance.now(),
        maxGap = 0,
        keyboardProbes = 0,
        wheelProbes = 0,
        active = false,
        evaluationLast = last,
        evaluationGap = 0;
      const timer = setInterval(() => {
        const now = performance.now();
        maxGap = Math.max(maxGap, now - last);
        last = now;
        if (active) {
          evaluationGap = Math.max(evaluationGap, now - evaluationLast);
          evaluationLast = now;
          svg.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'ArrowRight',
              bubbles: true,
              cancelable: true,
            }),
          );
          keyboardProbes++;
          svg.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY: -1,
              bubbles: true,
              cancelable: true,
            }),
          );
          wheelProbes++;
        }
      }, 16);
      const start = performance.now();
      present(state, null);
      const pendingMs = performance.now() - start;
      active = true;
      const evaluationStart = performance.now();
      evaluationLast = evaluationStart;
      evaluationGap = 0;
      const batch =
        mode === 'synchronous'
          ? evaluateBoard(state)
          : await evaluateBoardCooperatively(state, {
              cancelled: () => false,
              progress: (completed, total) => {
                element('batch-status').textContent = `${completed}/${total}`;
              },
            });
      const evaluationMs = performance.now() - evaluationStart,
        evaluationMaxGapMs = Math.max(
          evaluationGap,
          performance.now() - evaluationLast,
        );
      active = false;
      if (batch?.status !== 'complete' || batch.results.size !== width * height)
        throw new Error('Partial batch');
      const renderStart = performance.now();
      present(state, batch);
      const presentationMs = performance.now() - renderStart,
        completeDomMs = performance.now() - start;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      maxGap = Math.max(maxGap, performance.now() - last);
      clearInterval(timer);
      const actual = await checksum(batch.results);
      if (actual !== expected)
        throw new Error('Scheduling changed mathematics');
      if (iteration >= 0)
        samples.push({
          mode,
          evaluationMs,
          pendingMs,
          presentationMs,
          completeDomMs,
          evaluationMaxGapMs,
          maxHeartbeatGapMs: maxGap,
          keyboardProbes,
          wheelProbes,
          candidates: String(batch.candidates),
          checksum: actual,
        });
    }
    // Measure repeated validation inside the unchanged public evaluator, without bypassing it.
    let validationMs = 0,
      validationCalls = 0;
    const instrumented: Ruleset = {
      ...MEMOIR44_REFRESH2025,
      validateBoard: (board, configuration) => {
        const start = performance.now();
        const issues = MEMOIR44_REFRESH2025.validateBoard(board, configuration);
        validationMs += performance.now() - start;
        validationCalls++;
        return issues;
      },
    };
    const results = new Map<string, VisibilityResult>(),
      start = performance.now();
    for (const cell of state.board.cells)
      results.set(
        coordinateKey(cell.coordinate),
        evaluateVisibility(
          {
            board: state.board,
            origin: state.origin,
            target: cell.coordinate,
            range: state.range,
            ruleset: { id: state.rulesetId, version: '1', configuration: {} },
            maxCandidates: 1000n,
          },
          [instrumented],
        ),
      );
    const queryTotalMs = performance.now() - start,
      actual = await checksum(results);
    if (actual !== expected || validationCalls !== width * height)
      throw new Error('Profiling changed work');
    if (iteration >= 0)
      validationSamples.push({
        validationMs,
        queryTotalMs,
        validationSharePercent: (100 * validationMs) / queryTotalMs,
        validationCalls,
        checksum: actual,
      });
  }
  data.push({
    width,
    height,
    board: state.board.cells,
    observer: coordinateKey(state.origin),
    target: '2,0',
    ruleset: state.rulesetId,
    version: '1',
    range: 'no-additional-cap',
    candidates: String(reference.candidates),
    warmups: 3,
    repetitions: 9,
    chunkMs: EVALUATION_CHUNK_MS,
    chunkTargets: EVALUATION_CHUNK_TARGETS,
    heartbeatPeriodMs: 16,
    samples,
    quiescentSamples,
    validationSamples,
  });
}
const report = document.getElementById('report');
if (!report) throw new Error('Report');
report.textContent = JSON.stringify(
  {
    userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    data,
  },
  (_, value: unknown) => (typeof value === 'bigint' ? String(value) : value),
);
document.body.dataset.done = 'true';
