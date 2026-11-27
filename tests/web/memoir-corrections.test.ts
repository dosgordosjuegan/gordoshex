import { expect, it } from 'vitest';
import { axial, coordinateKey } from '../../src/index.js';
import { type VisibilityResult } from '../../src/application.js';
import {
  activateCell,
  generate,
  initialState,
  setRange,
} from '../../web/state.js';
import { initialMemoirState } from '../../web/workspaces.js';
import { paintMemoir } from '../../web/memoir-editing.js';
import { evaluateBoard, presentation } from '../../web/evaluation.js';
import {
  memoirFacts,
  memoirPresentation,
  showArtilleryBadge,
} from '../../web/memoir-presentation.js';
import {
  memoirLayout,
  MEMOIR_STATUS,
  MEMOIR_EXEMPTION,
  type GlyphPlacement,
} from '../../web/memoir-layout.js';
import { mathematicalInputsChanged } from '../../web/recalculation.js';
const observer = axial(2n, 4n),
  middle = axial(1n, 4n),
  target = axial(0n, 4n);
function fixture() {
  let state = generate(initialMemoirState(), '13', '9', 'axial');
  state = paintMemoir(state, observer, {
    kind: 'unit',
    type: 'artillery',
    side: 'allies',
  });
  state = paintMemoir(state, middle, {
    kind: 'unit',
    type: 'armor',
    side: 'axis',
  });
  return activateCell({ ...state, mode: 'observer' }, observer);
}
function query(
  state = fixture(),
  at = target,
  limit = 1000n,
): VisibilityResult {
  const batch = evaluateBoard(state, limit);
  if (batch.status !== 'complete') throw new Error('Batch unavailable');
  const result = batch.results.get(coordinateKey(at));
  if (!result) throw new Error('Missing result');
  return result;
}
it('projects the manual artillery fixture as requirements satisfied without changing physical LOS or engine visibility', () => {
  const result = query();
  if (result.status !== 'evaluated') throw new Error('Evaluation');
  expect(result.context.distance).toBe(2n);
  expect(result.los.status).toBe('blocked');
  expect(result.range.status).toBe('in-range');
  expect(result.visibility).toEqual({ status: 'applicable', visible: false });
  expect(memoirFacts(result)?.losRequired).toBe(false);
  expect(memoirPresentation(result)).toBe('requirements-met');
  expect(showArtilleryBadge(result)).toBe(true);
  expect(result.los.evidence.some((e) => e.effect === 'blocking')).toBe(true);
  const infantry = query(
    paintMemoir(fixture(), observer, {
      kind: 'unit',
      type: 'infantry',
      side: 'allies',
    }),
  );
  expect(memoirPresentation(infantry)).toBe('blocked');
  expect(showArtilleryBadge(infantry)).toBe(false);
});
it('handles terrain, intrinsic range, additional caps and clear LOS independently', () => {
  let state = paintMemoir(fixture(), middle, { kind: 'remove-unit' });
  expect(memoirPresentation(query(state))).toBe('requirements-met');
  expect(showArtilleryBadge(query(state))).toBe(false);
  state = paintMemoir(state, middle, { kind: 'terrain', type: 'forest' });
  expect(showArtilleryBadge(query(state))).toBe(true);
  const capped = query(setRange(state, { kind: 'radius', radius: 1n }));
  expect(memoirPresentation(capped)).toBe('out-of-range');
  expect(showArtilleryBadge(capped)).toBe(false);
  const far = query(state, axial(9n, 4n));
  expect(memoirPresentation(far)).toBe('out-of-range');
  expect(showArtilleryBadge(far)).toBe(false);
});
it('preserves diagnostics ahead of exemption, including membership and resource failures', () => {
  const absent = activateCell({ ...fixture(), mode: 'remove-cell' }, middle);
  const cases = [
    [query(absent), 'rule-invalid'],
    [query(fixture(), target, 0n), 'failed'],
    [
      query(paintMemoir(fixture(), observer, { kind: 'remove-unit' })),
      'invalid-query',
    ],
    [query({ ...fixture(), rulesetId: 'unsupported' }), 'unsupported'],
  ] as const;
  for (const [result, style] of cases) {
    expect(memoirPresentation(result)).toBe(style);
    expect(showArtilleryBadge(result)).toBe(false);
  }
});
it('leaves all three generic policies unchanged and coordinate labels do not recalculate', () => {
  for (const rulesetId of [
    'generic.interior-only',
    'generic.interior-and-edge',
    'generic.any-contact',
  ]) {
    const batch = evaluateBoard({ ...initialState(), rulesetId });
    if (batch.status !== 'complete') throw new Error('Batch');
    for (const result of batch.results.values()) {
      expect(memoirPresentation(result)).toBe(presentation(result));
      expect(showArtilleryBadge(result)).toBe(false);
    }
  }
  const state = initialMemoirState();
  expect(
    mathematicalInputsChanged(state, {
      ...state,
      showCoordinates: !state.showCoordinates,
    }),
  ).toBe(false);
});
type Bounds = { left: number; right: number; top: number; bottom: number };
function bounds(p: GlyphPlacement, w: number, h: number): Bounds {
  return {
    left: p.x - w * p.scale,
    right: p.x + w * p.scale,
    top: p.y - h * p.scale,
    bottom: p.y + h * p.scale,
  };
}
function overlaps(a: Bounds, b: Bounds): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}
for (const hasUnit of [false, true])
  for (let count = 0; count <= 5; count++)
    it(`keeps ${count} installations ${hasUnit ? 'with' : 'without'} a unit inside both hex orientations and separate from status/labels`, () => {
      const layout = memoirLayout(hasUnit, count);
      const boxes = layout.installations.map((p) => bounds(p, 0.72, 0.67));
      if (layout.unit) boxes.push(bounds(layout.unit, 0.515, 0.295));
      const reserved: Bounds[] = [MEMOIR_STATUS, MEMOIR_EXEMPTION].map((p) => ({
        left: p.x - p.r - 0.01,
        right: p.x + p.r + 0.01,
        top: p.y - p.r - 0.01,
        bottom: p.y + p.r + 0.01,
      }));
      reserved.push({ left: -0.275, right: 0.275, top: -0.81, bottom: -0.62 });
      expect(layout.installations).toHaveLength(count);
      for (const [index, box] of boxes.entries()) {
        for (const x of [box.left, box.right])
          for (const y of [box.top, box.bottom]) {
            expect(Math.abs(x)).toBeLessThanOrEqual(Math.sqrt(3) / 2);
            expect(
              Math.abs(y) + Math.abs(x) / Math.sqrt(3),
            ).toBeLessThanOrEqual(1);
            expect(Math.abs(y)).toBeLessThanOrEqual(Math.sqrt(3) / 2);
            expect(
              Math.abs(x) + Math.abs(y) / Math.sqrt(3),
            ).toBeLessThanOrEqual(1);
          }
        for (const other of [...boxes.slice(index + 1), ...reserved])
          expect(overlaps(box, other)).toBe(false);
      }
    });
