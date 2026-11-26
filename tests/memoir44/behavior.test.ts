import { expect, it } from 'vitest';
import { axial } from '../../src/index.js';
import {
  MEMOIR44_TERRAINS,
  MEMOIR44_INSTALLATIONS,
  MEMOIR44_UNIT_TYPES,
} from '../../src/application.js';
import {
  makeBoard,
  completed,
  blockerIds,
  terrain as t,
  installation as i,
  occupyingUnit as u,
} from './support.js';
const target = axial(2n, 0n);
for (const type of MEMOIR44_TERRAINS)
  it(`2025 terrain ${type} has source-backed ground-level LOS behavior`, () => {
    const result = completed(
      makeBoard({ target, placements: [t(1n, 0n, type)] }),
      target,
    );
    expect(result.los.status).toBe(
      ['forest', 'hedgerow', 'town', 'church', 'hill'].includes(type)
        ? 'blocked'
        : 'clear',
    );
  });
for (const type of MEMOIR44_INSTALLATIONS)
  it(`2025 installation ${type} has source-backed LOS behavior`, () => {
    expect(
      completed(makeBoard({ target, placements: [i(1n, 0n, type)] }), target)
        .los.status,
    ).toBe(type === 'bunker' ? 'blocked' : 'clear');
  });
for (const type of MEMOIR44_UNIT_TYPES)
  for (const side of ['allies', 'axis'])
    it(`intervening ${side} ${type} blocks`, () => {
      expect(
        blockerIds(
          completed(
            makeBoard({ target, placements: [u(1n, 0n, type, side)] }),
            target,
          ),
        ),
      ).toEqual(['unit:1,0']);
    });
it('filters lower obstructions before pairing boundary sides', () => {
  const end = axial(2n, -1n),
    placements = [
      t(0n, 0n, 'hill'),
      t(2n, -1n, 'hill'),
      t(1n, 0n, 'forest'),
      t(1n, -1n, 'hill'),
      u(1n, -1n),
    ];
  const result = completed(makeBoard({ target: end, placements }), end);
  expect(result.los.status).toBe('clear');
  expect(blockerIds(result)).toEqual([]);
  expect(
    result.los.evidence.find(
      (e) =>
        e.location.kind === 'cell' && e.location.elementId === 'terrain:1,0',
    )?.reason.code,
  ).toBe('memoir44.lower-obstruction-exempt');
  const paired = completed(
    makeBoard({
      target: end,
      placements: [
        ...placements.filter((p) => p.entity.id !== 'terrain:1,0'),
        t(1n, 0n, 'hill'),
        i(1n, 0n, 'bunker'),
      ],
    }),
    end,
  );
  expect(blockerIds(paired)).toEqual(['installation:bunker:1,0', 'unit:1,-1']);
});
it('applies the elevation filter to singleton contacts before sided evaluation', () => {
  const end = axial(4n, 1n),
    result = completed(
      makeBoard({
        target: end,
        placements: [
          t(0n, 0n, 'hill'),
          t(4n, 1n, 'hill'),
          t(1n, 1n, 'forest'),
          t(3n, 0n, 'hill'),
          u(3n, 0n),
        ],
      }),
      end,
    );
  expect(result.los.status).toBe('clear');
  expect(blockerIds(result)).toEqual([]);
  expect(
    result.los.evidence.some(
      (e) => e.reason.code === 'memoir44.lower-obstruction-exempt',
    ),
  ).toBe(true);
});
it('retains every stacked blocker independently of stack priority', () => {
  const placements = [t(1n, 0n, 'forest'), i(1n, 0n, 'bunker'), u(1n, 0n)],
    expected = ['installation:bunker:1,0', 'terrain:1,0', 'unit:1,0'];
  for (const order of [
    placements,
    [...placements].reverse(),
    [placements[1]!, placements[0]!, placements[2]!],
  ]) {
    const result = completed(makeBoard({ target, placements: order }), target);
    expect(blockerIds(result)).toEqual(expected);
    expect(
      result.context.board.cellAt(axial(1n, 0n))?.elements.map((e) => e.id),
    ).toEqual(order.map((p) => p.entity.id));
  }
});
it('ignores all endpoint obstacles without losing endpoint elevation', () => {
  const result = completed(
    makeBoard({
      target,
      placements: [
        t(0n, 0n, 'hill'),
        i(0n, 0n, 'bunker'),
        t(2n, 0n, 'hill'),
        i(2n, 0n, 'bunker'),
        u(1n, 0n),
      ],
    }),
    target,
  );
  expect(result.los.status).toBe('clear');
  expect(
    result.los.evidence.filter(
      (e) => e.reason.code === 'memoir44.endpoint-exempt',
    ),
  ).toHaveLength(6);
  expect(
    result.los.evidence.some(
      (e) => e.reason.code === 'memoir44.lower-obstruction-exempt',
    ),
  ).toBe(true);
});
it('membership invalidity outranks blocking while retaining physical evidence and range', () => {
  const end = axial(3n, 0n),
    result = completed(
      makeBoard({
        target: end,
        absent: [axial(1n, 0n)],
        placements: [t(2n, 0n, 'forest')],
      }),
      end,
      { kind: 'radius', radius: 0n },
    );
  expect(result.los.status).toBe('invalid-under-ruleset');
  expect(result.visibility).toEqual({ status: 'not-applicable' });
  expect(result.range.status).toBe('out-of-range');
  expect(blockerIds(result)).toEqual(['terrain:2,0']);
  expect(
    result.los.evidence.find((e) => e.effect === 'invalidating')?.location,
  ).toEqual({ kind: 'cell', coordinate: axial(1n, 0n), absent: true });
  expect(
    result.los.explanations.find((m) => m.code === 'memoir44.physical-los')
      ?.arguments,
  ).toEqual({ blocked: true, invalidatingMembership: true });
});
it('ignores absent singleton cells with coordinate-only evidence', () => {
  const end = axial(4n, 1n),
    result = completed(
      makeBoard({ target: end, absent: [axial(1n, 1n)] }),
      end,
    );
  expect(result.los.status).toBe('clear');
  const fact = result.los.evidence.find(
    (e) => e.reason.code === 'memoir44.absent-vertex-ignored',
  );
  expect(fact?.location).toEqual({
    kind: 'cell',
    coordinate: axial(1n, 1n),
    absent: true,
  });
  expect(fact?.contact.kind).toBe('isolated-vertex');
});
it('preserves blocked physical LOS and separate artillery exemption', () => {
  const end = axial(4n, 0n),
    board = makeBoard({
      target: end,
      observer: 'artillery',
      placements: [t(2n, 0n, 'forest')],
    });
  const forward = completed(board, end),
    reverse = completed(board, axial(0n, 0n), { kind: 'unlimited' }, end);
  expect(forward.los.status).toBe('blocked');
  expect(forward.range.status).toBe('in-range');
  expect(forward.visibility).toEqual({ status: 'applicable', visible: false });
  expect(
    forward.los.explanations.some(
      (m) => m.code === 'memoir44.artillery-los-not-required',
    ),
  ).toBe(true);
  expect(reverse.los.status).toBe('blocked');
  expect(reverse.range.status).toBe('out-of-range');
});
for (const type of MEMOIR44_UNIT_TYPES)
  it(`${type} range uses inclusive intrinsic maximum plus additional cap`, () => {
    const max = type === 'artillery' ? 6n : 3n;
    for (const distance of [max, max + 1n]) {
      const end = axial(distance, 0n),
        board = makeBoard({ target: end, observer: type, targetUnit: null });
      expect(completed(board, end).range.status).toBe(
        distance === max ? 'in-range' : 'out-of-range',
      );
      expect(
        completed(board, end, { kind: 'radius', radius: 10n }).range.status,
      ).toBe(distance === max ? 'in-range' : 'out-of-range');
      expect(
        completed(board, end, { kind: 'radius', radius: 2n }).range.status,
      ).toBe('out-of-range');
    }
    const self = completed(
      makeBoard({ target: axial(0n, 0n), observer: type }),
      axial(0n, 0n),
      { kind: 'radius', radius: 0n },
    );
    expect(self.los.status).toBe('clear');
    expect(self.range.status).toBe('in-range');
  });
it('same-side singleton obstructions at different parameters remain clear', () => {
  const end = axial(8n, 2n),
    result = completed(
      makeBoard({
        target: end,
        placements: [t(1n, 1n, 'forest'), t(5n, 2n, 'forest')],
      }),
      end,
    );
  expect(result.los.status).toBe('clear');
  expect(blockerIds(result)).toEqual([]);
  const facts = result.los.evidence.filter(
    (e) => e.reason.code === 'memoir44.one-sided-boundary',
  );
  expect(facts).toHaveLength(2);
  expect(
    facts.every(
      (e) => e.contact.kind === 'isolated-vertex' && e.contact.side === 1,
    ),
  ).toBe(true);
});
