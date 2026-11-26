import { it, expect } from 'vitest';
import {
  axial,
  rational,
  rationalKey,
  traceSightline,
} from '../../src/index.js';
import {
  MEMOIR44_REFRESH2025,
  GENERIC_RULESETS,
  BUILTIN_RULESETS,
} from '../../src/application.js';
import { REFERENCE_FIXTURES, DEFERRED_FIXTURES } from './fixtures.js';
import { makeBoard, completed, blockerIds } from './support.js';
for (const f of REFERENCE_FIXTURES)
  it(`${f.id} [${f.basis}] approved refreshed-2025 fixture`, () => {
    const result = completed(makeBoard(f), f.target, f.range);
    expect(result.los.status).toBe(f.los);
    expect(result.range.status).toBe(f.inRange ? 'in-range' : 'out-of-range');
    expect(result.visibility).toEqual(
      f.los === 'invalid-under-ruleset'
        ? { status: 'not-applicable' }
        : { status: 'applicable', visible: f.los === 'clear' && f.inRange },
    );
    expect(result).not.toHaveProperty('attackEligible');
  });
it('registers exactly one new ruleset without changing the generic collection', () => {
  expect(MEMOIR44_REFRESH2025.id).toBe('memoir44.refresh2025');
  expect(MEMOIR44_REFRESH2025.version).toBe('1');
  expect(GENERIC_RULESETS).toHaveLength(3);
  expect(BUILTIN_RULESETS).toEqual([...GENERIC_RULESETS, MEMOIR44_REFRESH2025]);
  expect(Object.isFrozen(BUILTIN_RULESETS)).toBe(true);
  expect(DEFERRED_FIXTURES.map((f) => f.id)).toContain('M31');
});
it('M07 retains both shared-edge blockers and simultaneous interval evidence', () => {
  const f = REFERENCE_FIXTURES.find((f) => f.id === 'M07');
  if (!f) throw new Error('Fixture');
  const result = completed(makeBoard(f), f.target);
  expect(blockerIds(result)).toEqual(['terrain:1,-1', 'terrain:1,0']);
  for (const fact of result.los.evidence.filter((e) => e.effect === 'blocking'))
    expect(fact.contact).toMatchObject({
      kind: 'edge-overlap',
      entry: rational(1n, 3n),
      exit: rational(2n, 3n),
    });
  expect(
    result.evidenceEvents
      .find((e) => rationalKey(e.t) === '1/3')
      ?.evidence.filter((e) => e.effect === 'blocking'),
  ).toHaveLength(2);
});
it('M09 and M11 preserve globally paired blockers with disjoint exact intervals', () => {
  for (const [id, expected] of [
    ['M09', ['1/6..1/3', '2/3..5/6']],
    ['M11', ['1/3..1/3', '2/3..2/3']],
  ] as const) {
    const f = REFERENCE_FIXTURES.find((f) => f.id === id);
    if (!f) throw new Error('Fixture');
    const result = completed(makeBoard(f), f.target),
      facts = result.los.evidence.filter((e) => e.effect === 'blocking');
    expect(facts).toHaveLength(2);
    expect(
      facts
        .map(
          (e) =>
            `${rationalKey(e.contact.entry)}..${rationalKey(e.contact.exit)}`,
        )
        .sort(),
    ).toEqual([...expected].sort());
    expect(
      new Set(
        facts.map((e) => ('side' in e.contact ? e.contact.side : undefined)),
      ),
    ).toEqual(new Set([-1, 1]));
    expect(
      result.los.explanations.some(
        (m) => m.code === 'memoir44.opposite-boundary-obstructions',
      ),
    ).toBe(true);
  }
});
it('mixed edge-overlap and isolated-vertex contacts are absent across 169 bounded displacements', () => {
  // General proof is retained in the approved specification; this is bounded implementation evidence only.
  for (let q = -6n; q <= 6n; q++)
    for (let r = -6n; r <= 6n; r++) {
      const result = traceSightline(axial(0n, 0n), axial(q, r), 10000n);
      if (result.status !== 'complete') throw new Error('Budget');
      const classes = new Set(result.cells.map((c) => c.kind));
      expect(
        classes.has('edge-overlap') && classes.has('isolated-vertex'),
        `${q},${r}`,
      ).toBe(false);
    }
});
