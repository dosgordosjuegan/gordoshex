import { coordinateKey } from '../src/index.js';
import {
  MEMOIR44_TERRAINS,
  MEMOIR44_INSTALLATIONS,
  MEMOIR44_UNIT_TYPES,
  memoir44Cell,
  InputError,
} from '../src/application.js';
import type { AppState } from './state.js';
import { activateCell, deleteElement } from './state.js';
import { memoirMode, paintMemoir, type MemoirBrush } from './memoir-editing.js';
import { terrainGlyph, unitGlyph, installationGlyph } from './memoir-svg.js';
import { svgElement } from './svg.js';
import { button, element, select, input } from './controls.js';
import { entityLabel } from './memoir-presentation.js';
import { t, symbols } from './format.js';
type Edit = (operation: (current: AppState) => AppState) => void;
function paintButton(
  state: AppState,
  brush: MemoirBrush,
  label: string,
  glyph: SVGGElement | null,
  mutate: Edit,
): HTMLButtonElement {
  const node = button(label, () =>
    mutate((current) => ({ ...current, mode: 'paint', brush })),
  );
  node.className = 'palette-button';
  node.dataset.focusKey = JSON.stringify(brush);
  node.setAttribute('aria-label', label);
  node.setAttribute(
    'aria-pressed',
    String(
      state.mode === 'paint' &&
        JSON.stringify(state.brush) === JSON.stringify(brush),
    ),
  );
  if (glyph) {
    const svg = svgElement('svg', {
      viewBox: '-1 -1 2 2',
      class: 'palette-svg',
      'aria-hidden': 'true',
    });
    svg.append(glyph);
    node.prepend(svg);
  }
  return node;
}
export function syncProfileControls(state: AppState): void {
  const memoir = memoirMode(state);
  document
    .querySelector('a[href="#memoir-palette"]')
    ?.toggleAttribute('hidden', !memoir);
  select('ruleset').value = state.rulesetId;
  select('mode').value = state.mode;
  select('orientation').value = state.orientation;
  input('coordinates').checked = state.showCoordinates;
  element('unlimited-label').textContent = t(
    memoir ? 'memoir.no-cap' : 'query.unlimited',
  );
  element('radius-label').textContent = t(
    memoir ? 'memoir.range-cap' : 'query.radius',
  );
  element('profile-note').hidden = !memoir;
  element('profile-note').textContent = t('memoir.profile-note');
  element('edge-controls').hidden = memoir;
  for (const option of select('mode').options) {
    option.hidden = memoir
      ? ['edge', 'add-obstacle', 'remove-obstacle'].includes(option.value)
      : option.value === 'paint';
    option.disabled = option.hidden;
  }
  const legend = element('memoir-legend');
  legend.hidden = !memoir;
  legend.textContent = t('memoir.legend');
  for (const name of ['visible', 'blocked', 'out-of-range']) {
    const label = document.querySelector(`[data-legend="${name}"]`);
    if (label) {
      const swatch = label.previousElementSibling;
      if (swatch) {
        swatch.classList.toggle('memoir-legend-swatch', memoir);
        swatch.textContent =
          memoir && name === 'visible' ? '✓' : (symbols[name] ?? '!');
        swatch.classList.toggle(
          'requirements-met',
          memoir && name === 'visible',
        );
      }
      label.textContent = t(
        memoir ? `memoir.legend.${name}` : `status.${name}`,
      );
    }
  }
}
export function syncRangeControls(state: AppState): void {
  input('unlimited').checked = state.range.kind === 'unlimited';
  input('radius').disabled = state.range.kind === 'unlimited';
  input('radius').value =
    state.range.kind === 'radius' ? String(state.range.radius) : '6';
  input('radius').setCustomValidity('');
  element('evaluate').removeAttribute('disabled');
}
export function renderMemoirPalette(state: AppState, mutate: Edit): void {
  const panel = element('memoir-palette');
  panel.hidden = !memoirMode(state);
  panel.replaceChildren();
  if (panel.hidden) return;
  const title = document.createElement('h2');
  title.textContent = t('memoir.palette');
  panel.append(title);
  const tabs = document.createElement('div');
  tabs.className = 'palette-tabs';
  for (const tab of ['terrain', 'unit', 'installation'] as const) {
    const node = button(t(`memoir.tab.${tab}`), () =>
      mutate((current) => ({ ...current, paletteTab: tab })),
    );
    node.setAttribute('aria-pressed', String(state.paletteTab === tab));
    tabs.append(node);
  }
  panel.append(tabs);
  if (state.paletteTab === 'unit') {
    const label = document.createElement('label');
    label.textContent = t('memoir.affiliation');
    const field = document.createElement('select');
    field.id = 'memoir-side';
    for (const side of ['allies', 'axis'] as const) {
      const option = document.createElement('option');
      option.value = side;
      option.textContent = t(`memoir.side.${side}`);
      field.append(option);
    }
    field.value = state.affiliation;
    field.addEventListener('change', () => {
      const side = field.value;
      if (side === 'allies' || side === 'axis')
        mutate((current) => ({
          ...current,
          affiliation: side,
          brush:
            current.brush.kind === 'unit'
              ? { ...current.brush, side }
              : current.brush,
        }));
    });
    label.append(field);
    panel.append(label);
  }
  const grid = document.createElement('div');
  grid.className = 'palette-grid';
  if (state.paletteTab === 'terrain') {
    for (const type of MEMOIR44_TERRAINS)
      grid.append(
        paintButton(
          state,
          { kind: 'terrain', type },
          `${t('memoir.paint')} ${t(`memoir.terrain.${type}`)}`,
          terrainGlyph(type),
          mutate,
        ),
      );
    grid.append(
      paintButton(
        state,
        { kind: 'remove-terrain' },
        t('memoir.clear-terrain'),
        null,
        mutate,
      ),
    );
  } else if (state.paletteTab === 'unit') {
    for (const type of MEMOIR44_UNIT_TYPES)
      grid.append(
        paintButton(
          state,
          { kind: 'unit', type, side: state.affiliation },
          `${t('memoir.place')} ${t(`memoir.unit.${type}`)}`,
          unitGlyph(type, state.affiliation),
          mutate,
        ),
      );
    grid.append(
      paintButton(
        state,
        { kind: 'remove-unit' },
        t('memoir.remove-unit'),
        null,
        mutate,
      ),
    );
  } else {
    for (const type of MEMOIR44_INSTALLATIONS) {
      grid.append(
        paintButton(
          state,
          { kind: 'installation', type },
          `${t('memoir.place')} ${t(`memoir.installation.${type}`)}`,
          installationGlyph(type),
          mutate,
        ),
        paintButton(
          state,
          { kind: 'remove-installation', type },
          `${t('memoir.erase')} ${t(`memoir.installation.${type}`)}`,
          null,
          mutate,
        ),
      );
    }
  }
  panel.append(grid);
  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.textContent = t('memoir.paint-hint');
  panel.append(hint);
}
export function renderMemoirContents(state: AppState, mutate: Edit): void {
  const panel = element('contents');
  panel.replaceChildren();
  const coordinate = state.inspected;
  if (!coordinate) {
    panel.textContent = t('inspection.select');
    return;
  }
  const heading = document.createElement('p');
  heading.textContent = coordinateKey(coordinate);
  panel.append(heading);
  const cell = state.board.cellAt(coordinate);
  if (!cell) {
    panel.append(document.createTextNode(t('inspection.absent')));
    return;
  }
  let data;
  try {
    data = memoir44Cell(cell);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    panel.append(document.createTextNode(t('memoir.invalid-cell')));
  }
  if (data && !data.terrainEntity)
    panel.append(document.createTextNode(t('memoir.implicit-open')));
  for (const entity of cell.elements) {
    const row = document.createElement('div');
    row.className = 'stack-row';
    row.textContent = `${entityLabel(entity)} · ${entity.id}`;
    row.append(
      button(`${t('inspection.remove')} ${entityLabel(entity)}`, () =>
        mutate((current) => deleteElement(current, coordinate, entity.id)),
      ),
    );
    panel.append(row);
  }
  const observer = button(t('memoir.use-observer'), () =>
    mutate((current) =>
      activateCell({ ...current, mode: 'observer' }, coordinate),
    ),
  );
  observer.disabled = !data?.unit;
  panel.append(observer);
  if (!data?.unit) {
    const hint = document.createElement('p');
    hint.textContent = t('memoir.observer-hint');
    panel.append(hint);
  }
  panel.append(
    button(t('memoir.clear-terrain'), () =>
      mutate((current) =>
        paintMemoir(current, coordinate, { kind: 'remove-terrain' }),
      ),
    ),
    button(t('memoir.remove-unit'), () =>
      mutate((current) =>
        paintMemoir(current, coordinate, { kind: 'remove-unit' }),
      ),
    ),
  );
}
