import { expect, it } from 'vitest';
import fc from 'fast-check';
import {
  axial,
  equalCoordinates,
  rational,
  subtractRational,
  type Axial,
} from '../../src/index.js';
import { BoardSnapshot } from '../../src/application.js';
import { REFERENCE_FIXTURES } from './fixtures.js';
import { makeBoard, completed, ORIGIN, blockerIds } from './support.js';
it('preserves complete evidence under exact translations, rotations and reflections (seed 2201)', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: REFERENCE_FIXTURES.length - 1 }),
      fc.integer({ min: 0, max: 5 }),
      fc.boolean(),
      fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }),
      fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }),
      (index, rotations, reflect, qShift, rShift) => {
        const fixture = REFERENCE_FIXTURES[index];
        if (!fixture) throw new Error('Fixture');
        const transform = (a: Axial): Axial => {
          let q = a.q,
            r = a.r;
          if (reflect) [q, r] = [r, q];
          for (let n = 0; n < rotations; n++) [q, r] = [-r, q + r];
          return axial(q + qShift, r + rShift);
        };
        const board = makeBoard(fixture),
          moved = new BoardSnapshot(
            board.cells.map((c) => ({
              coordinate: transform(c.coordinate),
              elements: c.elements,
            })),
          );
        const original = completed(board, fixture.target, fixture.range),
          result = completed(
            moved,
            transform(fixture.target),
            fixture.range,
            transform(ORIGIN),
          );
        expect(result.los.status).toBe(original.los.status);
        expect(result.range).toEqual(original.range);
        expect(blockerIds(result)).toEqual(blockerIds(original));
        expect(result.los.evidence).toHaveLength(original.los.evidence.length);
        for (const e of original.los.evidence) {
          if (e.location.kind !== 'cell')
            throw new Error('Cell evidence required');
          const location = e.location,
            coordinate = transform(location.coordinate);
          const transformed = result.los.evidence.find(
            (f) =>
              f.location.kind === 'cell' &&
              equalCoordinates(f.location.coordinate, coordinate) &&
              f.location.elementId === location.elementId,
          );
          expect(transformed).toBeDefined();
          expect(transformed?.effect).toBe(e.effect);
          expect(transformed?.reason).toEqual(e.reason);
          expect(transformed?.contact.entry).toEqual(e.contact.entry);
          expect(transformed?.contact.exit).toEqual(e.contact.exit);
          expect(transformed?.contact.kind).toBe(e.contact.kind);
          if (
            transformed &&
            'side' in transformed.contact &&
            'side' in e.contact
          )
            expect(transformed.contact.side).toBe(
              reflect && e.contact.side !== 0
                ? -e.contact.side
                : e.contact.side,
            );
        }
      },
    ),
    { seed: 2201, numRuns: 200 },
  );
});
it('reverses physical LOS and exact evidence without assuming symmetric weapon ranges (seed 2202)', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: REFERENCE_FIXTURES.length - 1 }),
      (index) => {
        const fixture = REFERENCE_FIXTURES[index];
        if (!fixture) throw new Error('Fixture');
        const board = makeBoard(fixture),
          forward = completed(board, fixture.target, fixture.range),
          reverse = completed(board, ORIGIN, fixture.range, fixture.target);
        expect(reverse.los.status).toBe(forward.los.status);
        expect(blockerIds(reverse)).toEqual(blockerIds(forward));
        for (const e of forward.los.evidence) {
          if (e.location.kind !== 'cell') throw new Error('Cell evidence');
          const location = e.location;
          const other = reverse.los.evidence.find(
            (f) =>
              f.location.kind === 'cell' &&
              equalCoordinates(f.location.coordinate, location.coordinate) &&
              f.location.elementId === location.elementId,
          );
          expect(other?.effect).toBe(e.effect);
          expect(other?.contact.kind).toBe(e.contact.kind);
          expect(other?.contact.entry).toEqual(
            subtractRational(rational(1n), e.contact.exit),
          );
          expect(other?.contact.exit).toEqual(
            subtractRational(rational(1n), e.contact.entry),
          );
          if (other && 'side' in other.contact && 'side' in e.contact)
            expect(other.contact.side).toBe(
              e.contact.side === 0 ? 0 : -e.contact.side,
            );
        }
      },
    ),
    { seed: 2202, numRuns: 150 },
  );
});
