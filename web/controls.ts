import { coordinateKey, type EdgeId } from '../src/index.js';
import {
  addGeneric,
  deleteElement,
  moveElement,
  editEdge,
  type AppState,
} from './state.js';
import { t, symbols } from './format.js';
import { BUILTIN_RULESETS } from '../src/application.js';
export function shell(root: HTMLElement): void {
  document.title = t('app.title');
  // All markup strings are application-owned language resources; user data uses textContent.
  root.innerHTML = `<header><div class="brand-mark" aria-hidden="true">⬡</div><div><h1>${t('app.heading')}</h1><p>${t('app.subtitle')}</p></div></header>
 <main><aside class="controls"><section><h2>${t('board.title')}</h2><p class="muted">${t('board.example')}</p>
 <form id="generate"><div class="pair"><label>${t('board.width')}<input id="width" value="13" inputmode="numeric" maxlength="128"></label><label>${t('board.height')}<input id="height" value="9" inputmode="numeric" maxlength="128"></label></div>
 <label>${t('board.layout')}<select id="layout">${['pointy-odd-row', 'flat-odd-column', 'axial'].map((id) => `<option value="${id}">${t(`layout.${id}`)}</option>`).join('')}</select></label><button>${t('board.generate')}</button></form><small>${t('limit.generation')}</small></section>
 <section><h2>${t('query.title')}</h2><label>${t('query.ruleset')}<select id="ruleset">${BUILTIN_RULESETS.map((r) => `<option value="${r.id}">${t(r.id)}</option>`).join('')}</select></label><label class="check"><input id="unlimited" type="checkbox" checked><span id="unlimited-label">${t('query.unlimited')}</span></label><label><span id="radius-label">${t('query.radius')}</span><input id="radius" value="6" inputmode="numeric" maxlength="128" disabled></label><button id="evaluate" class="primary">${t('query.evaluate')}</button></section>
 <section id="memoir-palette" hidden></section>
 <section><label>${t('mode.label')}<select id="mode">${['inspect', 'observer', 'add-cell', 'remove-cell', 'add-obstacle', 'remove-obstacle', 'edge', 'paint'].map((id) => `<option value="${id}">${t(`mode.${id}`)}</option>`).join('')}</select></label><p class="muted">${t('mode.help')}</p><form id="coordinate"><div class="pair"><label>${t('coordinate.q')}<input id="q" value="0" maxlength="128"></label><label>${t('coordinate.r')}<input id="r" value="0" maxlength="128"></label></div><button>${t('coordinate.go')}</button></form></section></aside>
 <section class="board-area"><div class="board-toolbar"><label>${t('display.orientation')}<select id="orientation" aria-label="${t('display.orientation')}"><option value="pointy">${t('display.pointy')}</option><option value="flat">${t('display.flat')}</option></select></label><button id="fit">${t('display.fit')}</button><button id="zoom-in" aria-label="${t('display.in')}">+</button><button id="zoom-out" aria-label="${t('display.out')}">−</button></div>
 <p id="profile-note" class="profile-note" hidden></p><div id="feedback" role="alert" hidden></div><p id="batch-status" role="status" aria-live="polite"></p><p id="profile-feedback" role="alert" hidden></p><div class="canvas"><svg id="board" xmlns="http://www.w3.org/2000/svg" role="group" tabindex="0" aria-label="${t('board.title')}"></svg></div>
 <div class="board-meta"><span id="board-count"></span><span id="selections"></span><span id="hover"></span></div><p class="muted help">${t('display.help')}</p>
 <section class="legend"><h2>${t('legend.title')}</h2><div>${['observer', 'visible', 'blocked', 'out-of-range', 'rule-invalid', 'failed', 'pending'].map((id) => `<span><b class="swatch ${id}">${symbols[id]}</b> <span data-legend="${id}">${t(`status.${id}`)}</span></span>`).join('')}<span><b class="swatch blocker">◇</b> ${t('legend.blocker')}</span><span>■ ${t('legend.obstacle')}</span></div><p id="memoir-legend" hidden></p><p class="muted">${t('legend.note')}</p></section></section>
 <aside class="inspection"><h2>${t('inspection.title')}</h2><div id="target-inspection"></div><section><h3>${t('inspection.contents')}</h3><div id="contents"></div></section><section id="edge-controls"><h3>${t('edge.title')}</h3><p class="muted">${t('edge.help')}</p><form id="edge-side"><label>${t('edge.side')}<select id="direction">${[0, 1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></label><button>${t('edge.select')}</button></form><div id="edge-features"></div></section></aside></main>`;
}
export function element(id: string): HTMLElement {
  const value = document.getElementById(id);
  if (!(value instanceof HTMLElement)) throw new Error(`Missing ${id}`);
  return value;
}
export function input(id: string): HTMLInputElement {
  const value = element(id);
  if (!(value instanceof HTMLInputElement))
    throw new Error(`Expected input ${id}`);
  return value;
}
export function select(id: string): HTMLSelectElement {
  const value = element(id);
  if (!(value instanceof HTMLSelectElement))
    throw new Error(`Expected select ${id}`);
  return value;
}
export function button(label: string, action: () => void): HTMLButtonElement {
  const node = document.createElement('button');
  node.textContent = label;
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

type Edit = (operation: (current: AppState) => AppState) => void;
export function renderContents(state: AppState, mutate: Edit): void {
  const node = element('contents');
  node.replaceChildren();
  const coordinate = state.inspected;
  if (!coordinate) {
    node.textContent = t('inspection.select');
    return;
  }
  const heading = document.createElement('p');
  heading.textContent = coordinateKey(coordinate);
  node.append(heading);
  const cell = state.board.cellAt(coordinate);
  if (!cell) {
    node.append(document.createTextNode(t('inspection.absent')));
    return;
  }
  if (!cell.elements.length)
    node.append(document.createTextNode(t('inspection.empty')));
  for (const [index, e] of cell.elements.entries()) {
    const row = document.createElement('div');
    row.className = 'stack-row';
    const label = document.createElement('p');
    label.textContent = `${index}: ${e.id} · ${t(`element.${e.kind}`)}`;
    row.append(label);
    const earlier = button(t('inspection.up'), () =>
        mutate((current) => moveElement(current, coordinate, e.id, -1)),
      ),
      later = button(t('inspection.down'), () =>
        mutate((current) => moveElement(current, coordinate, e.id, 1)),
      );
    earlier.disabled = index === 0;
    later.disabled = index === cell.elements.length - 1;
    row.append(
      earlier,
      later,
      button(t('inspection.remove'), () =>
        mutate((current) => deleteElement(current, coordinate, e.id)),
      ),
    );
    node.append(row);
  }
  node.append(
    button(t('inspection.add-obstacle'), () =>
      mutate((current) => addGeneric(current, coordinate, 'obstacle')),
    ),
    button(t('inspection.add-marker'), () =>
      mutate((current) => addGeneric(current, coordinate, 'marker')),
    ),
  );
}
export function renderEdge(
  state: AppState,
  selectedEdge: EdgeId | null,
  mutate: Edit,
): void {
  const node = element('edge-features');
  node.replaceChildren();
  if (!selectedEdge) return;
  const edge = selectedEdge,
    label = document.createElement('p');
  label.textContent = `${t('feature.selected')}: ${edge.key}`;
  node.append(label);
  const features = state.board.featuresAt(edge);
  if (!features.length) node.append(document.createTextNode(t('edge.none')));
  for (const f of features) {
    const row = document.createElement('p');
    row.textContent = f.id;
    row.append(
      button(t('inspection.remove'), () =>
        mutate((current) => editEdge(current, edge, f.id)),
      ),
    );
    node.append(row);
  }
  node.append(
    button(t('edge.add'), () => mutate((current) => editEdge(current, edge))),
  );
}
