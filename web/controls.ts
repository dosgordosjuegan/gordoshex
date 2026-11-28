import { coordinateKey, type EdgeId } from '../src/index.js';
import {
  addGeneric,
  deleteElement,
  moveElement,
  editEdge,
  type AppState,
} from './state.js';
import { t, symbols } from './format.js';
import { mark, bindTranslations } from './i18n.js';
import { BUILTIN_RULESETS } from '../src/application.js';
export function shell(root: HTMLElement): void {
  document.title = t('app.title');
  // All markup strings are application-owned language resources; user data uses textContent.
  root.innerHTML = `<a class="skip-link" href="#board">${mark('navigation.board')}</a><header><div class="brand-mark" aria-hidden="true">⬡</div><div><h1>${mark('app.heading')}</h1><p>${mark('app.subtitle')}</p></div><label class="language-control">${mark('language.label')}<select id="language"><option value="en" lang="en">${mark('language.en')}</option><option value="es" lang="es">${mark('language.es')}</option></select></label></header><nav class="mobile-navigation" aria-label="${mark('navigation.label')}"><a href="#board">${mark('board.title')}</a><a href="#memoir-palette">${mark('navigation.palette')}</a><a href="#inspection-panel">${mark('navigation.inspection')}</a><a href="#controls-panel">${mark('navigation.tools')}</a></nav>
 <main><section class="board-area"><div class="board-toolbar"><label>${mark('display.orientation')}<select id="orientation" aria-label="${mark('display.orientation')}"><option value="pointy">${mark('display.pointy')}</option><option value="flat">${mark('display.flat')}</option></select></label><label class="check coordinate-toggle"><input id="coordinates" type="checkbox" checked>${mark('display.coordinates')}</label><button id="fit">${mark('display.fit')}</button><button id="zoom-in" aria-label="${mark('display.in')}">+</button><button id="zoom-out" aria-label="${mark('display.out')}">−</button></div>
 <p id="profile-note" class="profile-note" hidden></p><div id="feedback" role="alert" hidden></div><p id="batch-status"></p><progress id="evaluation-progress" hidden aria-label="${mark('query.busy')}"></progress><p id="announcements" class="sr-only" role="status" aria-live="polite"></p><p id="profile-feedback" role="alert" hidden></p><div class="canvas"><svg id="board" xmlns="http://www.w3.org/2000/svg" role="group" tabindex="0" aria-label="${mark('board.title')}" aria-describedby="board-help"></svg></div>
 <div class="board-meta"><span id="board-count"></span><span id="selections"></span><span id="hover"></span></div><p class="muted help" id="board-help">${mark('display.help')}</p>
 <section class="legend"><h2>${mark('legend.title')}</h2><div>${['observer', 'visible', 'blocked', 'out-of-range', 'rule-invalid', 'failed', 'pending'].map((id) => `<span><b class="swatch ${id}">${symbols[id]}</b> <span data-legend="${id}">${mark(`status.${id}`)}</span></span>`).join('')}<span><b class="swatch blocker">◇</b> ${mark('legend.blocker')}</span><span>■ ${mark('legend.obstacle')}</span></div><p id="memoir-legend" hidden></p><p class="muted">${mark('legend.note')}</p></section></section>
 <aside class="controls" id="controls-panel"><section><details id="board-settings" open><summary>${mark('board.title')}</summary><p class="muted">${mark('board.example')}</p>
 <form id="generate"><div class="pair"><label>${mark('board.width')}<input id="width" value="13" inputmode="numeric" maxlength="128"></label><label>${mark('board.height')}<input id="height" value="9" inputmode="numeric" maxlength="128"></label></div>
 <label>${mark('board.layout')}<select id="layout">${['pointy-odd-row', 'flat-odd-column', 'axial'].map((id) => `<option value="${id}">${mark(`layout.${id}`)}</option>`).join('')}</select></label><button>${mark('board.generate')}</button></form><small>${mark('limit.generation')}</small></details></section>
 <section><h2>${mark('query.title')}</h2><label>${mark('query.ruleset')}<select id="ruleset">${BUILTIN_RULESETS.map((r) => `<option value="${r.id}">${mark(r.id)}</option>`).join('')}</select></label><label class="check"><input id="unlimited" type="checkbox" checked><span id="unlimited-label">${mark('query.unlimited')}</span></label><label><span id="radius-label">${mark('query.radius')}</span><input id="radius" value="6" inputmode="numeric" maxlength="128" disabled></label><button id="evaluate" class="primary">${mark('query.evaluate')}</button></section>
 <section id="memoir-palette" hidden></section>
 <section><label>${mark('mode.label')}<select id="mode">${['inspect', 'observer', 'add-cell', 'remove-cell', 'add-obstacle', 'remove-obstacle', 'edge', 'paint'].map((id) => `<option value="${id}">${mark(`mode.${id}`)}</option>`).join('')}</select></label><p class="muted">${mark('mode.help')}</p><form id="coordinate"><div class="pair"><label>${mark('coordinate.q')}<input id="q" value="0" maxlength="128"></label><label>${mark('coordinate.r')}<input id="r" value="0" maxlength="128"></label></div><button>${mark('coordinate.go')}</button></form></section></aside>
 <aside class="inspection" id="inspection-panel"><h2>${mark('inspection.title')}</h2><div id="target-inspection"></div><section><h3>${mark('inspection.contents')}</h3><div id="contents"></div></section><section id="edge-controls"><h3>${mark('edge.title')}</h3><p class="muted">${mark('edge.help')}</p><form id="edge-side"><label>${mark('edge.side')}<select id="direction">${[0, 1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select></label><button>${mark('edge.select')}</button></form><div id="edge-features"></div></section></aside></main><footer><span>${mark('app.attribution')}</span> <a href="https://www.youtube.com/@DosGordosJuegan">Dos Gordos Juegan · YouTube</a> · <a href="https://github.com/dosgordosjuegan/gordoshex">GitHub</a><p>${mark('app.disclaimer')}</p></footer>`;
  bindTranslations(root);
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
export function button(
  label: string,
  action: () => void,
  focusKey = label,
): HTMLButtonElement {
  const node = document.createElement('button');
  node.textContent = label;
  node.dataset.focusKey = focusKey;
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
    earlier.dataset.focusKey = `element:${e.id}:earlier`;
    later.dataset.focusKey = `element:${e.id}:later`;
    earlier.disabled = index === 0;
    later.disabled = index === cell.elements.length - 1;
    row.append(
      earlier,
      later,
      button(
        t('inspection.remove'),
        () => mutate((current) => deleteElement(current, coordinate, e.id)),
        `element:${e.id}:remove`,
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
