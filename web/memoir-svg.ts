import {
  memoir44Cell,
  InputError,
  type BoardCell,
  type Memoir44Terrain,
  type Memoir44Installation,
  type Memoir44UnitType,
} from '../src/application.js';
import { svgElement as el } from './svg.js';
import { t } from './format.js';
import { memoirLayout } from './memoir-layout.js';
import type { Affiliation } from './memoir-editing.js';
const path = (d: string): SVGPathElement => el('path', { d });
export function terrainGlyph(type: Memoir44Terrain): SVGGElement {
  const g = el('g', { class: `terrain-glyph terrain-${type}` });
  switch (type) {
    case 'open':
      break;
    case 'forest':
      g.append(
        path(
          'M-.6 .25 L-.35 -.4 -.1 .25 Z M-.1 .3 L.2 -.5 .5 .3 Z M-.35 .25 V.5 M.2 .3 V.55',
        ),
      );
      break;
    case 'hedgerow':
      g.append(
        path(
          'M-.65 -.35 Q-.4 -.65 -.1 -.35 T.55 -.35 M-.65 .1 Q-.4 -.2 -.1 .1 T.55 .1 M-.65 .5 Q-.4 .2 -.1 .5 T.55 .5',
        ),
      );
      break;
    case 'town':
      g.append(
        path(
          'M-.65 .35 V-.15 L-.4 -.4 -.15 -.15 V.35 Z M.05 .4 V-.25 L.3 -.5 .55 -.25 V.4 Z',
        ),
      );
      break;
    case 'church':
      g.append(
        path(
          'M-.45 .45 V-.1 L-.1 -.35 .2 -.1 V.45 Z M.2 .45 V-.55 L.35 -.75 .5 -.55 V.45 Z M.35 -.75 V-.95 M.25 -.85 H.45',
        ),
      );
      break;
    case 'hill':
      g.append(
        path(
          'M-.65 .25 Q0 -.8 .65 .25 M-.5 .5 Q0 -.25 .5 .5 M-.2 .55 Q0 .25 .2 .55',
        ),
      );
      break;
    case 'river':
    case 'ocean':
      g.append(
        path(
          'M-.65 -.35 Q-.35 -.65 0 -.35 T.65 -.35 M-.65 .1 Q-.35 -.2 0 .1 T.65 .1 M-.65 .5 Q-.35 .2 0 .5 T.65 .5',
        ),
      );
      break;
    case 'beach':
      g.append(
        path(
          'M-.65 .2 Q-.2 -.2 .65 -.1 M-.5 -.4 h.05 M-.1 -.5 h.05 M.3 -.4 h.05 M.4 .5 h.05',
        ),
      );
      break;
    case 'bridge':
      g.append(
        path(
          'M-.6 -.5 Q-.3 -.7 0 -.5 T.6 -.5 M-.6 .5 Q-.3 .3 0 .5 T.6 .5 M-.6 -.25 H.6 M-.6 .25 H.6 M-.4 -.25 V.25 M0 -.25 V.25 M.4 -.25 V.25',
        ),
      );
      break;
  }
  return g;
}
export function installationGlyph(type: Memoir44Installation): SVGGElement {
  const g = el('g', { class: `installation-glyph installation-${type}` });
  switch (type) {
    case 'bunker':
      g.append(path('M-.6 .4 V-.15 L-.35 -.45 H.35 L.6 -.15 V.4 Z M-.3 0 H.3'));
      break;
    case 'hedgehog':
      g.append(path('M-.5 -.5 L.5 .5 M.5 -.5 L-.5 .5 M0 -.6 V.6'));
      break;
    case 'sandbags':
      g.append(
        el('rect', { x: '-.65', y: '0', width: '.6', height: '.3', rx: '.1' }),
        el('rect', { x: '.05', y: '0', width: '.6', height: '.3', rx: '.1' }),
        el('rect', { x: '-.3', y: '-.3', width: '.6', height: '.3', rx: '.1' }),
      );
      break;
    case 'wire':
      g.append(path('M-.65 .2 Q-.6 -.6 -.3 0 T.3 0 T.65 .2 M-.6 .45 L.6 -.35'));
      break;
    case 'sea-wall':
      g.append(
        path('M-.65 .4 V-.2 H-.4 V-.4 H-.1 V-.2 H.2 V-.4 H.5 V-.2 H.65 V.4'),
      );
      break;
  }
  return g;
}
export function unitGlyph(
  type: Memoir44UnitType,
  side: Affiliation,
): SVGGElement {
  const g = el('g', { class: `unit-glyph unit-${type} side-${side}` });
  g.append(
    el('rect', {
      x: '-.48',
      y: '-.26',
      width: '.96',
      height: '.52',
      rx: '.025',
    }),
  );
  if (type === 'infantry')
    g.append(path('M-.12 -.2 L.40 .2 M.40 -.2 L-.12 .2'));
  else if (type === 'armor')
    g.append(el('ellipse', { cx: '.14', cy: '0', rx: '.22', ry: '.16' }));
  else g.append(el('circle', { cx: '.14', cy: '0', r: '.10' }));
  g.append(path('M-.22 -.26 V.26'));
  const text = el('text', { x: '-.43', y: '.08', class: 'affiliation-symbol' });
  text.textContent = side === 'allies' ? 'A' : 'X';
  g.append(text);
  return g;
}
export function drawMemoirCell(
  group: SVGGElement,
  cell: BoardCell,
  x: number,
  y: number,
): string {
  let data;
  try {
    data = memoir44Cell(cell);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    group.classList.add('invalid-entity');
    return t('memoir.invalid-cell');
  }
  group.classList.add('memoir-cell', `terrain-${data.terrain}`);
  const glyph = el('g', {
    transform: `translate(${x} ${y})`,
    class: 'memoir-graphics',
    'aria-hidden': 'true',
  });
  const terrain = terrainGlyph(data.terrain);
  terrain.setAttribute('transform', 'scale(.85)');
  glyph.append(terrain);
  const layout = memoirLayout(!!data.unit, data.installations.length);
  if (data.unit && layout.unit) {
    const unit = unitGlyph(data.unit.type, data.unit.side);
    unit.setAttribute(
      'transform',
      `translate(${layout.unit.x} ${layout.unit.y}) scale(${layout.unit.scale})`,
    );
    glyph.append(unit);
  }
  for (const [index, installation] of data.installations.entries()) {
    const icon = installationGlyph(installation.type);
    const placement = layout.installations[index];
    if (!placement) throw new Error('Missing installation placement');
    icon.setAttribute(
      'transform',
      `translate(${placement.x} ${placement.y}) scale(${placement.scale})`,
    );
    glyph.append(icon);
  }
  group.append(glyph);
  return [
    t(`memoir.terrain.${data.terrain}`),
    ...(data.unit
      ? [
          `${t(`memoir.side.${data.unit.side}`)} ${t(`memoir.unit.${data.unit.type}`)}`,
        ]
      : []),
    ...data.installations.map((i) => t(`memoir.installation.${i.type}`)),
  ].join(' · ');
}
