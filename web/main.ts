import './style.css';
import {
  axial,
  coordinateKey,
  localEdge,
  DIRECTIONS,
  type Axial,
  type EdgeId,
} from '../src/index.js';
import {
  initialState,
  activateCell,
  generate,
  setRange,
  selectionKey,
  type AppState,
  type Mode,
} from './state.js';
import { evaluateBoardCooperatively, type Batch } from './evaluation.js';
import { renderBoard, renderInspection } from './render.js';
import { bindBoard } from './interaction.js';
import {
  shell,
  element,
  input,
  select,
  renderContents,
  renderEdge,
} from './controls.js';
import { integerInput } from './limits.js';
import { t, semantic } from './format.js';
import { vertices, frontier } from './display.js';
import { memoirMode } from './memoir-editing.js';
import { WorkingBoards } from './workspaces.js';
import {
  renderMemoirPalette,
  renderMemoirContents,
  syncProfileControls,
  syncRangeControls,
} from './memoir-controls.js';
import {
  initializeLanguage,
  currentLanguage,
  persistLanguage,
  refreshTranslations,
} from './i18n.js';
import { preserveFocus } from './focus.js';
import { Recalculation, mathematicalInputsChanged } from './recalculation.js';
let storage: Storage | undefined;
try {
  storage = localStorage;
} catch {
  /* Browser storage is optional. */
}
initializeLanguage(navigator.languages, storage);
const root = document.getElementById('app');
if (!root) throw new Error('Missing app');
shell(root);
refreshTranslations();
select('language').value = currentLanguage();
if (matchMedia('(max-width: 900px)').matches) {
  const settings = element('board-settings');
  if (settings instanceof HTMLDetailsElement) settings.open = false;
}
function boardSvg(): SVGSVGElement {
  const node = document.getElementById('board');
  if (!(node instanceof SVGSVGElement)) throw new Error('Missing SVG');
  return node;
}
const svg = boardSvg();
let state = initialState(),
  batch: Batch | null = null,
  selectedEdge: EdgeId | null = null,
  busy = false,
  evaluations = 0,
  progress: { completed: number; total: number } | null = null,
  feedbackKey: string | null = null,
  hoverKey = '';
const workingBoards = new WorkingBoards(state);
const interaction = bindBoard(
  svg,
  (a) => attempt(() => change(activateCell(state, a))),
  (edge) =>
    attempt(() => {
      if (state.mode === 'edge') {
        selectedEdge = edge;
        render();
      }
    }),
  (key) => {
    hoverKey = key;
    element('hover').textContent = key ? `${t('hover.label')}: ${key}` : '';
  },
);
function attempt(action: () => void): void {
  try {
    feedbackKey = null;
    element('feedback').hidden = true;
    action();
  } catch (error) {
    const node = element('feedback');
    node.hidden = false;
    feedbackKey =
      error instanceof Error ? error.message : 'evaluation.internal-error';
    node.textContent = `${t('feedback.error')}: ${t(feedbackKey)}`;
  }
}
function change(next: AppState, fit = false): void {
  const displayOrigin = next.board.cells[0]?.coordinate ?? axial(0n, 0n);
  for (const coordinate of [
    ...next.board.cells.map((cell) => cell.coordinate),
    ...frontier(next.board),
  ])
    vertices(coordinate, displayOrigin, next.orientation);
  const mathematicalChange = mathematicalInputsChanged(state, next);
  state = next;
  if (
    selectedEdge &&
    !state.board.hasCell(selectedEdge.first) &&
    !state.board.hasCell(selectedEdge.second)
  )
    selectedEdge = null;
  if (mathematicalChange) requestEvaluation(undefined, fit);
  else render(fit);
}
function render(fit = false): void {
  syncProfileControls(state);
  const restoreFocus = preserveFocus();
  const drawing = renderBoard(svg, state, batch, selectedEdge);
  if (fit) interaction.fit(drawing.frame);
  element('hover').textContent = hoverKey
    ? `${t('hover.label')}: ${hoverKey}`
    : '';
  element('board-count').textContent =
    `${state.board.cells.length} ${t('board.count')}`;
  element('selections').textContent =
    `${t('query.observer')}: ${selectionKey(state.origin) || t('query.none')} · ${t('query.target')}: ${selectionKey(state.target) || t('query.none')}`;
  element('batch-status').dataset.evaluations = String(evaluations);
  element('batch-status').dataset.phase = busy
    ? 'running'
    : batch?.status === 'complete'
      ? 'complete'
      : batch?.status === 'unavailable'
        ? 'unavailable'
        : 'pending';
  element('batch-status').textContent = busy
    ? `${t('query.busy')}${progress ? ` ${t('query.progress')}: ${progress.completed} / ${progress.total}` : ''}`
    : batch?.status === 'complete'
      ? `${t('query.complete')} · ${t('timing.label')}: ${batch.milliseconds.toFixed(1)} · ${t('details.candidates')}: ${batch.candidates}`
      : batch?.status === 'unavailable'
        ? t(batch.reason)
        : t('query.pending');
  const progressNode = element('evaluation-progress');
  if (progressNode instanceof HTMLProgressElement) {
    progressNode.hidden = !busy;
    progressNode.max = progress?.total || 1;
    progressNode.value = progress?.completed ?? 0;
  }
  if (feedbackKey)
    element('feedback').textContent =
      `${t('feedback.error')}: ${t(feedbackKey)}`;
  element('target-inspection').setAttribute('aria-busy', String(busy));
  const problem =
    memoirMode(state) && batch?.status === 'complete'
      ? [...batch.results.values()].find(
          (value) =>
            value.status === 'invalid-query-input' ||
            value.status === 'unsupported-ruleset-or-configuration',
        )
      : undefined;
  element('profile-feedback').hidden = !problem;
  element('profile-feedback').textContent =
    problem && 'explanations' in problem
      ? problem.explanations.map(semantic).join(' ')
      : '';
  const result =
    state.target && batch?.status === 'complete'
      ? batch.results.get(coordinateKey(state.target))
      : undefined;
  renderInspection(element('target-inspection'), state, result);
  const mutate = (operation: (current: AppState) => AppState): void =>
    attempt(() => change(operation(state)));
  renderMemoirPalette(state, mutate);
  if (memoirMode(state)) renderMemoirContents(state, mutate);
  else {
    renderContents(state, mutate);
    renderEdge(state, selectedEdge, mutate);
  }
  restoreFocus();
}
const recalculation: Recalculation = new Recalculation(
  (snapshot) => {
    const revision = recalculation.revision;
    return evaluateBoardCooperatively(snapshot, {
      cancelled: () => !recalculation.isCurrent(revision),
      progress: (completed, total) => {
        if (!recalculation.isCurrent(revision)) return;
        progress = { completed, total };
        element('batch-status').textContent =
          `${t('query.busy')} ${t('query.progress')}: ${completed} / ${total}`;
        const node = element('evaluation-progress');
        if (node instanceof HTMLProgressElement) {
          node.max = total || 1;
          node.value = completed;
        }
      },
    });
  },
  () => {
    busy = true;
    evaluations++;
    progress = { completed: 0, total: state.board.cells.length };
    render();
    element('announcements').textContent = t('query.busy');
  },
  (result) => {
    batch = result;
    busy = false;
    progress = null;
    render();
    element('announcements').textContent =
      result.status === 'complete' ? t('query.complete') : t(result.reason);
  },
  (error) => {
    batch = { status: 'unavailable', reason: 'evaluation.internal-error' };
    busy = false;
    attempt(() => {
      throw error;
    });
    render();
  },
);
function requestEvaluation(delay?: number, fit = false): void {
  batch = null;
  busy = false;
  progress = null;
  if (input('radius').checkValidity()) recalculation.request(state, delay);
  else recalculation.cancel();
  render(fit);
}
function evaluate(): void {
  if (!busy) requestEvaluation(0);
}
element('generate').addEventListener('submit', (event) => {
  event.preventDefault();
  attempt(() => {
    const layout = select('layout').value;
    if (
      layout !== 'axial' &&
      layout !== 'pointy-odd-row' &&
      layout !== 'flat-odd-column'
    )
      throw new Error('input.dimensions');
    change(
      generate(state, input('width').value, input('height').value, layout),
      true,
    );
  });
});
select('orientation').addEventListener('change', () => {
  const orientation = select('orientation').value;
  if (orientation === 'pointy' || orientation === 'flat')
    change({ ...state, orientation }, true);
});
select('mode').addEventListener('change', () => {
  const mode = select('mode').value;
  const modes: readonly Mode[] = [
    'inspect',
    'observer',
    'add-cell',
    'remove-cell',
    'add-obstacle',
    'remove-obstacle',
    'edge',
    'paint',
  ];
  const chosen = modes.find((m) => m === mode);
  if (chosen) change({ ...state, mode: chosen });
});
select('ruleset').addEventListener('change', () =>
  attempt(() => {
    const next = workingBoards.switch(state, select('ruleset').value);
    selectedEdge = null;
    syncRangeControls(next);
    change(next, true);
  }),
);
function updateRange(): void {
  attempt(() => {
    const unlimited = input('unlimited').checked;
    input('radius').disabled = unlimited;
    const wasInvalid = !input('radius').checkValidity();
    input('radius').setCustomValidity('');
    try {
      const radius = unlimited ? 0n : integerInput(input('radius').value);
      const next = setRange(
        state,
        unlimited ? { kind: 'unlimited' } : { kind: 'radius', radius },
      );
      element('evaluate').removeAttribute('disabled');
      change(next);
      if (wasInvalid) requestEvaluation();
    } catch (error) {
      recalculation.cancel();
      batch = null;
      busy = false;
      input('radius').setCustomValidity(t('input.range'));
      element('evaluate').setAttribute('disabled', '');
      render();
      throw error;
    }
  });
}
input('unlimited').addEventListener('change', updateRange);
input('radius').addEventListener('input', updateRange);
input('radius').addEventListener('change', updateRange);
element('coordinate').addEventListener('submit', (event) => {
  event.preventDefault();
  attempt(() => {
    const a: Axial = axial(
      integerInput(input('q').value),
      integerInput(input('r').value),
    );
    change(activateCell(state, a), state.mode === 'add-cell');
  });
});
element('edge-side').addEventListener('submit', (event) => {
  event.preventDefault();
  attempt(() => {
    if (!state.inspected || !state.board.hasCell(state.inspected))
      throw new Error('input.absent');
    const direction = DIRECTIONS.find(
      (d) => String(d) === select('direction').value,
    );
    if (direction === undefined) throw new Error('input.integer');
    selectedEdge = localEdge(state.inspected, direction);
    render();
  });
});
select('language').addEventListener('change', () => {
  const next = select('language').value;
  if (next !== 'en' && next !== 'es') return;
  persistLanguage(next, storage);
  refreshTranslations();
  if (!input('radius').checkValidity())
    input('radius').setCustomValidity(t('input.range'));
  render();
  element('announcements').textContent = t('language.changed');
});
input('coordinates').addEventListener('change', () =>
  change({ ...state, showCoordinates: input('coordinates').checked }),
);
element('evaluate').addEventListener('click', evaluate);
element('fit').addEventListener('click', () => render(true));
element('zoom-in').addEventListener('click', () => interaction.zoom(1.2));
element('zoom-out').addEventListener('click', () => interaction.zoom(1 / 1.2));
requestEvaluation(undefined, true);
