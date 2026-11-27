import { axial, edgeId, type Axial, type EdgeId } from '../src/index.js';
import type { RenderedBoard } from './render.js';
export const DRAG_THRESHOLD_PX = 5;
export interface BoardInteraction {
  fit(frame: RenderedBoard['frame']): void;
  zoom(factor: number): void;
}
type Activation =
  | { readonly kind: 'cell'; readonly cell: Axial }
  | { readonly kind: 'edge'; readonly edge: EdgeId };
function identity(target: EventTarget | null): Activation | null {
  if (!(target instanceof Element)) return null;
  const edge = target.closest('[data-edge]');
  if (edge)
    return {
      kind: 'edge',
      edge: edgeId(
        axial(
          BigInt(edge.getAttribute('data-q') ?? ''),
          BigInt(edge.getAttribute('data-r') ?? ''),
        ),
        axial(
          BigInt(edge.getAttribute('data-nq') ?? ''),
          BigInt(edge.getAttribute('data-nr') ?? ''),
        ),
      ),
    };
  const cell = target.closest('[data-cell]');
  return cell
    ? {
        kind: 'cell',
        cell: axial(
          BigInt(cell.getAttribute('data-q') ?? ''),
          BigInt(cell.getAttribute('data-r') ?? ''),
        ),
      }
    : null;
}
/** Only a completed stationary primary gesture activates; screen positions never enter predicates. */
export function bindBoard(
  svg: SVGSVGElement,
  activate: (cell: Axial) => void,
  activateEdge: (edge: EdgeId) => void,
  hover: (key: string) => void,
): BoardInteraction {
  let view = { x: 0, y: 0, width: 30, height: 20 },
    space = false,
    spaceGesture = false;
  let gesture: {
    id: number;
    x: number;
    y: number;
    view: typeof view;
    scale: number;
    dragged: boolean;
    panOnly: boolean;
    activation: Activation | null;
  } | null = null;
  // Ignore browser compatibility clicks after handled pointers; retain AT/programmatic clicks.
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
  const resolve = (activation: Activation | null): void => {
    if (activation?.kind === 'edge') activateEdge(activation.edge);
    else if (activation) activate(activation.cell);
  };
  function cancel(): void {
    const old = gesture;
    gesture = null;
    svg.classList.remove('panning');
    if (old && svg.hasPointerCapture(old.id)) svg.releasePointerCapture(old.id);
  }
  function move(event: PointerEvent): void {
    if (!gesture || gesture.id !== event.pointerId) return;
    // Capture may be released before got/lostpointercapture is dispatched.
    if (!svg.hasPointerCapture(event.pointerId)) {
      cancel();
      return;
    }
    const dx = event.clientX - gesture.x,
      dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) gesture.dragged = true;
    if (!gesture.dragged) return;
    view = {
      ...gesture.view,
      x: gesture.view.x - dx * gesture.scale,
      y: gesture.view.y - dy * gesture.scale,
    };
    svg.classList.add('panning');
    apply();
  }
  svg.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.button !== 1) return;
    if (gesture) {
      cancel();
      return;
    } // A second pointer cancels activation; no accidental multi-touch edit.
    if (!event.isPrimary) return;
    const rect = svg.getBoundingClientRect();
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view: { ...view },
      scale: Math.max(view.width / rect.width, view.height / rect.height),
      dragged: false,
      panOnly: event.button === 1 || space,
      activation: identity(event.target),
    };
    if (space) spaceGesture = true;
    event.preventDefault();
    if (
      event.target instanceof SVGElement &&
      event.target.closest('[data-cell],[data-edge]')
    )
      event.target
        .closest<SVGElement>('[data-cell],[data-edge]')
        ?.focus({ preventScroll: true });
    else svg.focus({ preventScroll: true });
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', (event) => {
    move(event);
    if (!gesture && event.target instanceof Element)
      hover(
        event.target.closest('[data-cell]')?.getAttribute('data-cell') ?? '',
      );
  });
  svg.addEventListener('pointerup', (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    move(event);
    const finished = gesture;
    if (!finished) return;
    cancel();
    event.preventDefault();
    if (!finished.dragged && !finished.panOnly) resolve(finished.activation);
  });
  svg.addEventListener('pointercancel', (event) => {
    if (gesture?.id === event.pointerId) cancel();
  });
  svg.addEventListener('lostpointercapture', (event) => {
    if (gesture?.id === event.pointerId) cancel();
  });
  svg.addEventListener('click', (event) => {
    if (event.detail === 0) resolve(identity(event.target));
    else event.preventDefault();
  });
  svg.addEventListener('auxclick', (event) => {
    if (event.button === 1) event.preventDefault();
  });
  svg.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    { passive: false },
  );
  const editable = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    !!target.closest('input,textarea,select,[contenteditable="true"]');
  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || editable(event.target)) return;
    if (!event.repeat) {
      space = true;
      spaceGesture = false;
    }
    if (gesture) {
      gesture.panOnly = true;
      spaceGesture = true;
    }
    if (
      (event.target instanceof Node && svg.contains(event.target)) ||
      event.target === document.body
    )
      event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space' || !space) return;
    space = false;
    if (spaceGesture) {
      event.preventDefault();
      return;
    }
    if (event.target instanceof Node && svg.contains(event.target)) {
      event.preventDefault();
      resolve(identity(event.target));
    }
  });
  window.addEventListener('blur', () => {
    space = false;
    spaceGesture = false;
    cancel();
  });
  svg.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      resolve(identity(event.target));
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
