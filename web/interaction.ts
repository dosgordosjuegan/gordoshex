import { axial, edgeId, type Axial, type EdgeId } from '../src/index.js';
import type { RenderedBoard } from './render.js';
export interface BoardInteraction {
  fit(frame: RenderedBoard['frame']): void;
  zoom(factor: number): void;
}
/** Events resolve stored exact lattice IDs; SVG positions are used only to pan/zoom. */
export function bindBoard(
  svg: SVGSVGElement,
  activate: (cell: Axial) => void,
  activateEdge: (edge: EdgeId) => void,
  hover: (key: string) => void,
): BoardInteraction {
  let view = { x: 0, y: 0, width: 30, height: 20 },
    drag: { x: number; y: number; view: typeof view } | null = null,
    moved = false;
  const apply = (): void =>
    svg.setAttribute(
      'viewBox',
      `${view.x} ${view.y} ${view.width} ${view.height}`,
    );
  const zoom = (factor: number): void => {
    const width = view.width / factor,
      height = view.height / factor;
    if (width < 2 || width > 1000000) return;
    view = {
      x: view.x + (view.width - width) / 2,
      y: view.y + (view.height - height) / 2,
      width,
      height,
    };
    apply();
  };
  const resolve = (target: EventTarget | null): void => {
    if (!(target instanceof Element)) return;
    const edge = target.closest('[data-edge]');
    if (edge) {
      activateEdge(
        edgeId(
          axial(
            BigInt(edge.getAttribute('data-q') ?? ''),
            BigInt(edge.getAttribute('data-r') ?? ''),
          ),
          axial(
            BigInt(edge.getAttribute('data-nq') ?? ''),
            BigInt(edge.getAttribute('data-nr') ?? ''),
          ),
        ),
      );
      return;
    }
    const cell = target.closest('[data-cell]');
    if (cell)
      activate(
        axial(
          BigInt(cell.getAttribute('data-q') ?? ''),
          BigInt(cell.getAttribute('data-r') ?? ''),
        ),
      );
  };
  svg.addEventListener('click', (event) => {
    if (!moved) resolve(event.target);
    moved = false;
  });
  svg.addEventListener('pointerdown', (event) => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest('[data-cell],[data-edge]')
    )
      return;
    drag = { x: event.clientX, y: event.clientY, view: { ...view } };
    moved = false;
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', (event) => {
    if (drag) {
      const rect = svg.getBoundingClientRect(),
        scale = Math.max(view.width / rect.width, view.height / rect.height);
      view = {
        ...view,
        x: drag.view.x - (event.clientX - drag.x) * scale,
        y: drag.view.y - (event.clientY - drag.y) * scale,
      };
      moved =
        Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 3;
      apply();
    }
    if (event.target instanceof Element)
      hover(
        event.target.closest('[data-cell]')?.getAttribute('data-cell') ?? '',
      );
  });
  svg.addEventListener('pointerup', () => {
    drag = null;
  });
  svg.addEventListener('pointercancel', () => {
    drag = null;
  });
  svg.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    { passive: false },
  );
  svg.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      resolve(event.target);
      return;
    }
    if (event.key === '+' || event.key === '=') zoom(1.2);
    else if (event.key === '-') zoom(1 / 1.2);
    else if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    ) {
      event.preventDefault();
      view = {
        ...view,
        x:
          view.x +
          ((event.key === 'ArrowLeft'
            ? -1
            : event.key === 'ArrowRight'
              ? 1
              : 0) *
            view.width) /
            10,
        y:
          view.y +
          ((event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0) *
            view.height) /
            10,
      };
      apply();
    }
  });
  svg.addEventListener('focusin', (event) => {
    if (event.target instanceof Element)
      hover(
        event.target.closest('[data-cell]')?.getAttribute('data-cell') ?? '',
      );
  });
  return {
    fit: (frame) => {
      view = { ...frame };
      apply();
    },
    zoom,
  };
}
