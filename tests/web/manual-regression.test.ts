import { expect, it } from 'vitest';
import { axial, rational } from '../../src/index.js';
import {
  rectangle,
  addElement,
  evaluateVisibility,
  GENERIC_RULESETS,
} from '../../src/application.js';
let board = rectangle(13n, 9n, axial(0n, 0n), 'axial');
for (const [id, coordinate] of [
  ['near', axial(7n, 3n)],
  ['far', axial(5n, 5n)],
] as const)
  board = addElement(board, coordinate, {
    id,
    kind: 'obstacle',
    properties: {},
  });
const cases = [
  {
    target: axial(5n, 6n),
    near: [rational(1n, 6n), rational(1n, 3n)],
    far: [rational(2n, 3n), rational(5n, 6n)],
  },
  {
    target: axial(4n, 8n),
    near: [rational(1n, 9n), rational(2n, 9n)],
    far: [rational(4n, 9n), rational(5n, 9n)],
  },
] as const;
// Independent annotation: the ray has X=16, Y=6+12t or 6+18t.
// Obstacle vertical edges occupy Y=[8,10] (right) and [14,16] (left).
for (const fixture of cases)
  for (const ruleset of GENERIC_RULESETS)
    it(`manual regression (7,2) → (${fixture.target.q},${fixture.target.r}) under ${ruleset.id}`, () => {
      const result = evaluateVisibility(
        {
          board,
          origin: axial(7n, 2n),
          target: fixture.target,
          range: { kind: 'unlimited' },
          ruleset: { id: ruleset.id, version: '1', configuration: {} },
        },
        GENERIC_RULESETS,
      );
      expect(result.status).toBe('evaluated');
      if (result.status !== 'evaluated') throw new Error('Evaluation');
      expect(result.range.status).toBe('in-range');
      expect(result.los.status).toBe(
        ruleset.id === 'generic.interior-only' ? 'clear' : 'blocked',
      );
      const near = result.los.evidence.find(
          (e) => e.location.kind === 'cell' && e.location.elementId === 'near',
        ),
        far = result.los.evidence.find(
          (e) => e.location.kind === 'cell' && e.location.elementId === 'far',
        );
      expect(near?.contact).toMatchObject({
        kind: 'edge-overlap',
        side: -1,
        entry: fixture.near[0],
        exit: fixture.near[1],
      });
      expect(far?.contact).toMatchObject({
        kind: 'edge-overlap',
        side: 1,
        entry: fixture.far[0],
        exit: fixture.far[1],
      });
      expect(
        result.los.evidence.filter((e) => e.effect === 'blocking'),
      ).toHaveLength(ruleset.id === 'generic.interior-only' ? 0 : 2);
    });
