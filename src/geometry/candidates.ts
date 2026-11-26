import { axial, type Axial } from './coordinates.js';
import { ceilDiv, floorDiv, max, min, requireBigint } from './integer.js';
import type { Sightline } from './sightline.js';
export interface CandidateBounds {
  readonly rLow: bigint;
  readonly rHigh: bigint;
  readonly xLow: bigint;
  readonly xHigh: bigint;
}
export interface IntegerInterval {
  readonly low: bigint;
  readonly high: bigint;
}
export function candidateBounds(line: Sightline): CandidateBounds {
  return Object.freeze({
    rLow: ceilDiv(min(line.a.y, line.b.y) - 2n, 3n),
    rHigh: floorDiv(max(line.a.y, line.b.y) + 2n, 3n),
    xLow: min(line.a.x, line.b.x) - 1n,
    xHigh: max(line.a.x, line.b.x) + 1n,
  });
}
export function candidateRow(
  bounds: CandidateBounds,
  r: bigint,
): IntegerInterval {
  return Object.freeze({
    low: ceilDiv(bounds.xLow - r, 2n),
    high: floorDiv(bounds.xHigh - r, 2n),
  });
}
/** Fixed operation count; never visits a row or candidate. */
export function candidateCount(line: Sightline): bigint {
  const b = candidateBounds(line),
    n = b.rHigh - b.rLow + 1n,
    w = b.xHigh - b.xLow + 1n,
    h = floorDiv(w, 2n),
    e = w - 2n * h,
    p = b.xLow - 2n * floorDiv(b.xLow, 2n);
  const extra = floorDiv(b.rHigh - p, 2n) - floorDiv(b.rLow - 1n - p, 2n);
  return n * h + e * extra;
}
export interface ResourceLimitFailure {
  readonly status: 'resource-limit';
  readonly candidateCount: bigint;
  readonly maxCandidates: bigint;
}
export interface AdmittedCandidates {
  readonly status: 'admitted';
  readonly candidateCount: bigint;
  readonly maxCandidates: bigint;
  readonly bounds: CandidateBounds;
}
export function preflight(
  line: Sightline,
  maxCandidates: bigint,
): AdmittedCandidates | ResourceLimitFailure {
  requireBigint(maxCandidates);
  if (maxCandidates < 0n)
    throw new RangeError('maxCandidates must be nonnegative');
  const count = candidateCount(line);
  if (count > maxCandidates)
    return Object.freeze({
      status: 'resource-limit',
      candidateCount: count,
      maxCandidates,
    });
  return Object.freeze({
    status: 'admitted',
    candidateCount: count,
    maxCandidates,
    bounds: candidateBounds(line),
  });
}
/** Low-level reference iterator; query APIs always run preflight before entering it. */
export function* candidateCoordinates(
  bounds: CandidateBounds,
): Generator<Axial> {
  for (let r = bounds.rLow; r <= bounds.rHigh; r++) {
    const row = candidateRow(bounds, r);
    for (let q = row.low; q <= row.high; q++) yield axial(q, r);
  }
}
