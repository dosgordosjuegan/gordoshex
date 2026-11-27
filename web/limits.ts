import { integerFromString } from '../src/index.js';
// UI admission budgets; library callers retain independent configuration.
export const MAX_CELLS = 512n;
export const MAX_DIMENSION = 64n;
export const MAX_BATCH_CANDIDATES = 100000n;
export const MAX_ELEMENTS_PER_CELL = 16;
export const MAX_EDGE_FEATURES = 8;
export function integerInput(value: string): bigint {
  if (value.length > 128) throw new Error('input.integer-limit');
  try {
    return integerFromString(value);
  } catch {
    throw new Error('input.integer');
  }
}
export function dimensions(
  width: string,
  height: string,
): readonly [bigint, bigint] {
  const w = integerInput(width),
    h = integerInput(height);
  if (w < 0n || h < 0n) throw new Error('input.dimensions');
  if (w > MAX_DIMENSION || h > MAX_DIMENSION || w * h > MAX_CELLS)
    throw new Error('limit.generation');
  return [w, h];
}
