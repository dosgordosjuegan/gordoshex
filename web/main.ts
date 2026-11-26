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
  setRuleset,
  selectionKey,
  type AppState,
  type Mode,
} from './state.js';
import { evaluateBoard, type Batch } from './evaluation.js';
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
import { t } from './format.js';
import { vertices, frontier } from './display.js';
import { Recalculation, mathematicalInputsChanged } from './recalculation.js';
const root = document.getElementById('app');
if (!root) throw new Error('Missing app');
shell(root);
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
  evaluations = 0;
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
    element('hover').textContent = key ? `${t('hover.label')}: ${key}` : '';
  },
);
function attempt(action: () => void): void {
  try {
    element('feedback').hidden = true;
    action();
  } catch (error) {
    const node = element('feedback');
    node.hidden = false;
    node.textContent = `${t('feedback.error')}: ${t(error instanceof Error ? error.message : 'evaluation.internal-error')}`;
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
  const focused = document.activeElement,
    focusedCell =
      focused instanceof Element
        ? focused.closest('[data-cell]')?.getAttribute('data-cell')
        : null;
  const drawing = renderBoard(svg, state, batch, selectedEdge);
  if (fit) interaction.fit(drawing.frame);
  if (focusedCell)
    Array.from(svg.querySelectorAll<SVGGElement>('[data-cell]'))
      .find((n) => n.getAttribute('data-cell') === focusedCell)
      ?.focus();
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
    ? t('query.busy')
    : batch?.status === 'complete'
      ? `${t('query.complete')} · ${t('timing.label')}: ${batch.milliseconds.toFixed(1)} · ${t('details.candidates')}: ${batch.candidates}`
      : batch?.status === 'unavailable'
        ? t(batch.reason)
        : t('query.pending');
  const result =
    state.target && batch?.status === 'complete'
      ? batch.results.get(coordinateKey(state.target))
      : undefined;
  renderInspection(element('target-inspection'), state, result);
  const mutate = (operation: (current: AppState) => AppState): void =>
    attempt(() => change(operation(state)));
  renderContents(state, mutate);
  renderEdge(state, selectedEdge, mutate);
}
const recalculation = new Recalculation(
  evaluateBoard,
  () => {
    busy = true;
    evaluations++;
    render();
  },
  (result) => {
    batch = result;
    busy = false;
    render();
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
  ];
  const chosen = modes.find((m) => m === mode);
  if (chosen) change({ ...state, mode: chosen });
});
select('ruleset').addEventListener('change', () =>
  attempt(() => change(setRuleset(state, select('ruleset').value))),
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
element('evaluate').addEventListener('click', evaluate);
element('fit').addEventListener('click', () => render(true));
element('zoom-in').addEventListener('click', () => interaction.zoom(1.2));
element('zoom-out').addEventListener('click', () => interaction.zoom(1 / 1.2));
requestEvaluation(undefined, true);
