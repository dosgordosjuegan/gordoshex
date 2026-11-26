import { expect, it, vi, afterEach } from 'vitest';
import { axial } from '../../src/index.js';
import { initialState, setRange } from '../../web/state.js';
import {
  Recalculation,
  mathematicalInputsChanged,
} from '../../web/recalculation.js';
import type { Batch } from '../../web/evaluation.js';
const response: Batch = { status: 'unavailable', reason: 'batch.observer' };
function clock(): void {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) =>
    clearTimeout(id),
  );
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('debounces consecutive edits into one evaluation of the newest immutable snapshot', () => {
  clock();
  const evaluate = vi.fn(() => response),
    running = vi.fn(),
    complete = vi.fn(),
    failed = vi.fn();
  const controller = new Recalculation(evaluate, running, complete, failed);
  const first = initialState(),
    second = setRange(first, { kind: 'radius', radius: 3n });
  controller.request(first);
  vi.advanceTimersByTime(100);
  controller.request(second);
  vi.advanceTimersByTime(149);
  expect(evaluate).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(evaluate).toHaveBeenCalledExactlyOnceWith(second);
  expect(complete).toHaveBeenCalledExactlyOnceWith(response);
  expect(failed).not.toHaveBeenCalled();
});
it('cancels debounce, pending animation frames and deferred evaluation without publishing', () => {
  clock();
  const evaluate = vi.fn(() => response),
    complete = vi.fn();
  const controller = new Recalculation(
    evaluate,
    () => {},
    complete,
    () => {},
  );
  for (const time of [0, 150, 166]) {
    controller.request(initialState());
    vi.advanceTimersByTime(time);
    controller.cancel();
    vi.runAllTimers();
  }
  expect(evaluate).not.toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
});
it('does not publish a superseded result or error even during reentrant evaluation', () => {
  clock();
  const complete = vi.fn(),
    failed = vi.fn(),
    snapshot = initialState(),
    next = setRange(snapshot, { kind: 'radius', radius: 1n });
  const evaluate = vi.fn(() => response);
  const controller = new Recalculation(evaluate, () => {}, complete, failed);
  evaluate.mockImplementationOnce(() => {
    controller.request(next);
    return response;
  });
  controller.request(snapshot);
  vi.advanceTimersByTime(167);
  expect(complete).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(complete).toHaveBeenCalledTimes(1);
  evaluate.mockImplementationOnce(() => {
    controller.request(next);
    throw new Error('superseded');
  });
  controller.request(snapshot);
  vi.advanceTimersByTime(167);
  expect(failed).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(failed).not.toHaveBeenCalled();
  evaluate.mockImplementationOnce(() => {
    throw new Error('current');
  });
  controller.request(snapshot);
  vi.runAllTimers();
  expect(failed).toHaveBeenCalledOnce();
});
it('compares mathematical values and ignores target, inspection, orientation and mode changes', () => {
  const state = initialState();
  expect(
    mathematicalInputsChanged(state, {
      ...state,
      target: axial(4n, 1n),
      inspected: null,
      orientation: 'flat',
      mode: 'add-cell',
    }),
  ).toBe(false);
  expect(
    mathematicalInputsChanged(state, { ...state, origin: axial(0n, 0n) }),
  ).toBe(false);
  expect(
    mathematicalInputsChanged(state, setRange(state, { kind: 'unlimited' })),
  ).toBe(false);
  expect(
    mathematicalInputsChanged(state, { ...state, origin: axial(1n, 0n) }),
  ).toBe(true);
  expect(mathematicalInputsChanged(state, { ...state, origin: null })).toBe(
    true,
  );
  expect(
    mathematicalInputsChanged(
      state,
      setRange(state, { kind: 'radius', radius: 2n }),
    ),
  ).toBe(true);
  expect(
    mathematicalInputsChanged(state, {
      ...state,
      rulesetId: 'generic.any-contact',
    }),
  ).toBe(true);
  const finite = setRange(state, { kind: 'radius', radius: 2n });
  expect(
    mathematicalInputsChanged(
      finite,
      setRange(finite, { kind: 'radius', radius: 2n }),
    ),
  ).toBe(false);
});
