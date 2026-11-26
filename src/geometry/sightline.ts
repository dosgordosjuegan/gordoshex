import {
  axial,
  embed,
  equalCoordinates,
  subtractPoint,
  type Axial,
  type Point,
} from './coordinates.js';
import {
  addRational,
  multiplyRational,
  rational,
  type Rational,
} from './rational.js';
export interface Sightline {
  readonly origin: Axial;
  readonly target: Axial;
  readonly a: Point;
  readonly b: Point;
  readonly d: Point;
  readonly degenerate: boolean;
}
export interface RationalPoint {
  readonly x: Rational;
  readonly y: Rational;
}
export function sightline(origin: Axial, target: Axial): Sightline {
  origin = axial(origin.q, origin.r);
  target = axial(target.q, target.r);
  const a = embed(origin),
    b = embed(target);
  return Object.freeze({
    origin,
    target,
    a,
    b,
    d: subtractPoint(b, a),
    degenerate: equalCoordinates(origin, target),
  });
}
export const pointAt = (line: Sightline, t: Rational): RationalPoint =>
  Object.freeze({
    x: addRational(rational(line.a.x), multiplyRational(rational(line.d.x), t)),
    y: addRational(rational(line.a.y), multiplyRational(rational(line.d.y), t)),
  });
