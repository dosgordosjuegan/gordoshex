import {
  axial,
  coordinateKey,
  edgeGeometry,
  localEdge,
  DIRECTIONS,
  rationalKey,
  type Axial,
  type EdgeId,
} from '../src/index.js';
import type { VisibilityResult } from '../src/application.js';
import type { AppState } from './state.js';
import { selectionKey } from './state.js';
import { blockerKeys, presentation, type Batch } from './evaluation.js';
import { center, displayPoint, vertices, frontier, frame } from './display.js';
import { t, symbols, semantic } from './format.js';
import { svgElement } from './svg.js';
export { svgElement } from './svg.js';
import { memoirMode } from './memoir-editing.js';
import { drawMemoirCell } from './memoir-svg.js';
import {
  memoirFacts,
  artilleryAnnotation,
  entityLabel,
} from './memoir-presentation.js';
function labelText(
  x: number,
  y: number,
  value: string,
  cls: string,
): SVGTextElement {
  const node = svgElement('text', {
    x: String(x),
    y: String(y),
    class: cls,
    'text-anchor': 'middle',
  });
  node.textContent = value;
  return node;
}
export interface RenderedBoard {
  readonly frame: ReturnType<typeof frame>;
  readonly origin: Axial;
}
export function renderBoard(
  svg: SVGSVGElement,
  state: AppState,
  batch: Batch | null,
  selectedEdge: EdgeId | null,
): RenderedBoard {
  const memoir = memoirMode(state);
  const origin = state.board.cells[0]?.coordinate ?? axial(0n, 0n),
    missing = frontier(state.board),
    results = batch?.status === 'complete' ? batch.results : undefined;
  const targetResult = state.target
      ? results?.get(coordinateKey(state.target))
      : undefined,
    blockers = blockerKeys(targetResult);
  const root = svgElement('g', { 'data-scene': '' }),
    points = [];
  const all = [
    ...state.board.cells.map((c) => ({
      coordinate: c.coordinate,
      present: true,
    })),
    ...missing.map((coordinate) => ({ coordinate, present: false })),
  ];
  for (const item of all) {
    const { coordinate, present } = item,
      key = coordinateKey(coordinate),
      c = center(coordinate, origin, state.orientation),
      polygon = vertices(coordinate, origin, state.orientation);
    points.push(...polygon);
    const result = results?.get(key),
      status =
        key === selectionKey(state.origin) ? 'observer' : presentation(result),
      elements = state.board.cellAt(coordinate)?.elements ?? [];
    const group = svgElement('g', {
      'data-cell': key,
      'data-q': String(coordinate.q),
      'data-r': String(coordinate.r),
      role: 'button',
      tabindex: '0',
      class: `cell ${present ? status : 'absent'}${blockers.has(key) ? ' blocker' : ''}${key === selectionKey(state.target) ? ' target' : ''}${key === selectionKey(state.inspected) ? ' inspected' : ''}`,
      'aria-label': `${key} · ${present ? t(`status.${status}`) : t('inspection.absent')} · ${elements.length} ${t('inspection.contents')}`,
    });
    group.append(
      svgElement('polygon', {
        points: polygon.map((p) => `${p.x},${p.y}`).join(' '),
      }),
    );
    if (memoir && present) {
      const cell = state.board.cellAt(coordinate);
      if (cell) {
        const description = drawMemoirCell(group, cell, c.x, c.y);
        group.setAttribute(
          'aria-label',
          `${group.getAttribute('aria-label')} · ${description}`,
        );
      }
    }
    group.append(
      labelText(c.x, c.y + (memoir && present ? 0.8 : 0.1), key, 'coordinate'),
    );
    if (present) {
      if (memoir) {
        group.append(
          svgElement('circle', {
            cx: String(c.x + 0.56),
            cy: String(c.y - 0.48),
            r: '.24',
            class: 'status-disc',
          }),
        );
      }
      group.append(
        labelText(
          c.x + (memoir ? 0.56 : 0),
          c.y - (memoir ? 0.39 : 0.4),
          symbols[status] ?? '!',
          'cell-symbol',
        ),
      );
      if (memoir && artilleryAnnotation(result)) {
        group.classList.add('los-exempt');
        group.setAttribute(
          'aria-label',
          `${group.getAttribute('aria-label')} · ${t('memoir.artillery-note')}`,
        );
        group.append(
          labelText(
            c.x - 0.57,
            c.y - 0.42,
            t('memoir.exemption-badge'),
            'exemption-symbol',
          ),
        );
      }
      const count = elements.filter((e) => e.kind === 'obstacle').length;
      if (count && !memoir)
        group.append(
          labelText(
            c.x,
            c.y + 0.57,
            `■${count > 1 ? count : ''}`,
            'obstacle-symbol',
          ),
        );
    } else group.append(labelText(c.x, c.y - 0.4, '+', 'cell-symbol'));
    root.append(group);
  }
  const edges = new Map<string, EdgeId>();
  for (const cell of memoir ? [] : state.board.cells)
    for (const direction of DIRECTIONS) {
      const edge = localEdge(cell.coordinate, direction);
      edges.set(edge.key, edge);
    }
  for (const edge of edges.values()) {
    const geometry = edgeGeometry(edge),
      u = displayPoint(geometry.u, origin, state.orientation),
      v = displayPoint(geometry.v, origin, state.orientation),
      features = state.board.featuresAt(edge);
    if (
      features.length ||
      selectedEdge?.key === edge.key ||
      state.mode === 'edge'
    ) {
      const line = svgElement('line', {
        x1: String(u.x),
        y1: String(u.y),
        x2: String(v.x),
        y2: String(v.y),
        class: `edge${features.length ? ' has-feature' : ''}${selectedEdge?.key === edge.key ? ' selected-edge' : ''}`,
        'data-edge': edge.key,
        'data-q': String(edge.first.q),
        'data-r': String(edge.first.r),
        'data-nq': String(edge.second.q),
        'data-nr': String(edge.second.r),
        'aria-label': `${t('edge.title')}: ${edge.key}`,
        tabindex: state.mode === 'edge' ? '0' : '-1',
        role: 'button',
      });
      root.append(line);
    }
  }
  if (state.origin && state.target) {
    const a = center(state.origin, origin, state.orientation),
      b = center(state.target, origin, state.orientation);
    root.append(
      svgElement('line', {
        x1: String(a.x),
        y1: String(a.y),
        x2: String(b.x),
        y2: String(b.y),
        class: memoir ? 'sightline memoir-sightline' : 'sightline',
      }),
    );
  }
  svg.replaceChildren(root);
  return { frame: frame(points), origin };
}
function text(tag: string, value: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = value;
  return element;
}
export function renderInspection(
  panel: HTMLElement,
  state: AppState,
  result: VisibilityResult | undefined,
): void {
  panel.replaceChildren();
  if (!state.target) {
    panel.append(text('p', t('inspection.stale')));
    return;
  }
  panel.append(
    text('h3', `${t('query.target')}: ${coordinateKey(state.target)}`),
  );
  if (!result) {
    panel.append(text('p', t('inspection.stale')));
    return;
  }
  if (result.status !== 'evaluated') {
    panel.append(text('p', t(`status.${presentation(result)}`)));
    if (
      result.status === 'evaluation-failure' &&
      result.cause === 'resource-limit'
    )
      panel.append(
        text(
          'p',
          `${t('failure.resource')}: ${result.candidateCount} / ${result.maxCandidates}`,
        ),
      );
    else if ('explanations' in result)
      for (const m of result.explanations) panel.append(text('p', semantic(m)));
    return;
  }
  panel.append(
    text('p', `${t('inspection.distance')}: ${result.context.distance}`),
    text(
      'p',
      `${t('inspection.range')}: ${t(`status.${result.range.status}`)}`,
    ),
    text('p', `${t('inspection.los')}: ${t(`status.${result.los.status}`)}`),
  );
  const memoir = memoirMode(state);
  if (memoir) appendMemoirSummary(panel, result);
  else
    for (const m of [...result.range.explanations, ...result.los.explanations])
      panel.append(text('p', semantic(m)));
  const evidencePanel = memoir ? document.createElement('details') : panel;
  if (memoir) {
    evidencePanel.id = 'exact-evidence';
    evidencePanel.append(text('summary', t('memoir.exact')));
    panel.append(evidencePanel);
  }
  evidencePanel.append(text('h3', t('inspection.evidence')));
  if (!result.los.evidence.length)
    evidencePanel.append(text('p', t('inspection.no-evidence')));
  for (const evidence of result.los.evidence) {
    const location = evidence.location,
      where =
        location.kind === 'cell'
          ? `${coordinateKey(location.coordinate)}${location.absent ? ` · ${t('contact.absent')}` : ''}${location.elementId ? ` · ${location.elementId}` : ''}`
          : `${location.edge.key} · ${location.featureId ?? ''}`;
    const row = text(
      'p',
      `${where} · ${t(`contact.${evidence.effect}`)} · ${t(`contact.${evidence.contact.kind}`)} [${rationalKey(evidence.contact.entry)}, ${rationalKey(evidence.contact.exit)}]${'side' in evidence.contact ? ` · ${t('contact.side')} ${evidence.contact.side}` : ''} · ${semantic(evidence.reason)}`,
    );
    row.className = `evidence ${evidence.effect}`;
    evidencePanel.append(row);
  }
  const contacts = document.createElement('details');
  contacts.append(text('summary', t('inspection.geometry')));
  for (const c of result.context.geometry.cells)
    contacts.append(
      text(
        'p',
        `${coordinateKey(c.cell)} · ${t(`contact.${c.kind}`)} · [${rationalKey(c.entry)}, ${rationalKey(c.exit)}] · ${t('contact.side')} ${c.side}`,
      ),
    );
  panel.append(contacts);
  const events = document.createElement('details');
  events.append(text('summary', t('inspection.events')));
  for (const event of result.evidenceEvents)
    if (event.evidence.length)
      events.append(
        text(
          'p',
          `${rationalKey(event.t)}: ${event.evidence.map((e) => (e.location.kind === 'cell' ? `${coordinateKey(e.location.coordinate)} ${e.location.elementId ?? ''}` : (e.location.featureId ?? e.location.edge.key))).join('; ')}`,
        ),
      );
  panel.append(events);
}

function appendMemoirSummary(
  panel: HTMLElement,
  result: Extract<VisibilityResult, { status: 'evaluated' }>,
): void {
  const facts = memoirFacts(result);
  if (facts) {
    for (const [label, value] of [
      ['memoir.unit-label', t(`memoir.unit.${facts.unitType}`)],
      ['memoir.intrinsic', facts.intrinsic],
      [
        'memoir.range-cap',
        facts.cap === 'unlimited' ? t('memoir.no-cap') : facts.cap,
      ],
      ['memoir.effective', facts.effective],
      [
        'memoir.los-required',
        t(facts.losRequired ? 'memoir.required' : 'memoir.exempt'),
      ],
    ])
      panel.append(text('p', `${t(label ?? '')}: ${value}`));
  }
  if (artilleryAnnotation(result)) {
    const note = text('p', t('memoir.artillery-note'));
    note.className = 'artillery-note';
    panel.append(note);
  }
  panel.append(text('h3', t('memoir.summary')));
  for (const message of result.los.explanations)
    panel.append(text('p', semantic(message)));
  const reasons = new Set<string>();
  for (const evidence of result.los.evidence) {
    if (!reasons.has(evidence.reason.code)) {
      panel.append(text('p', semantic(evidence.reason)));
      reasons.add(evidence.reason.code);
    }
    if (evidence.effect === 'blocking' || evidence.effect === 'invalidating') {
      const location = evidence.location;
      if (location.kind === 'cell') {
        const entity = result.context.board
          .cellAt(location.coordinate)
          ?.elements.find((e) => e.id === location.elementId);
        const row = text(
          'p',
          `${coordinateKey(location.coordinate)} · ${entity ? entityLabel(entity) : t('inspection.absent')}${location.elementId ? ` · ${location.elementId}` : ''}`,
        );
        row.className = `evidence ${evidence.effect}`;
        panel.append(row);
      }
    }
  }
  const raw = document.createElement('details');
  raw.append(
    text('summary', t('memoir.raw')),
    text(
      'pre',
      JSON.stringify(
        [...result.range.explanations, ...result.los.explanations],
        null,
        2,
      ),
    ),
  );
  panel.append(raw);
}
