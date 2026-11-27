export interface GlyphPlacement {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}
/** Visual placements only. Bounds include glyph strokes and fit both display orientations. */
export function memoirLayout(
  hasUnit: boolean,
  count: number,
): { unit: GlyphPlacement | null; installations: readonly GlyphPlacement[] } {
  if (!Number.isInteger(count) || count < 0 || count > 5)
    throw new RangeError('Invalid installation count');
  const at = (x: number, y: number, scale: number): GlyphPlacement => ({
    x,
    y,
    scale,
  });
  if (hasUnit) {
    if (count <= 1)
      return {
        unit: at(0, -0.06, 1.05),
        installations: count ? [at(0, 0.53, 0.38)] : [],
      };
    if (count === 2)
      return {
        unit: at(0, -0.16, 0.98),
        installations: [at(-0.29, 0.4, 0.38), at(0.29, 0.4, 0.38)],
      };
    if (count === 3)
      return {
        unit: at(0, -0.17, 0.92),
        installations: [
          at(-0.43, 0.34, 0.29),
          at(0, 0.34, 0.29),
          at(0.43, 0.34, 0.29),
        ],
      };
    return {
      unit: at(0, -0.1, 0.75),
      installations: [
        at(-0.63, 0, 0.31),
        at(0.63, 0, 0.31),
        ...(count === 4
          ? [at(-0.25, 0.45, 0.33), at(0.25, 0.45, 0.33)]
          : [at(-0.42, 0.42, 0.28), at(0, 0.42, 0.28), at(0.42, 0.42, 0.28)]),
      ],
    };
  }
  if (count === 0) return { unit: null, installations: [] };
  if (count === 1) return { unit: null, installations: [at(0, 0.1, 0.75)] };
  if (count === 2)
    return {
      unit: null,
      installations: [at(-0.34, 0.1, 0.44), at(0.34, 0.1, 0.44)],
    };
  if (count === 3)
    return {
      unit: null,
      installations: [
        at(-0.32, -0.1, 0.42),
        at(0.32, -0.1, 0.42),
        at(0, 0.5, 0.42),
      ],
    };
  if (count === 4)
    return {
      unit: null,
      installations: [
        at(-0.28, -0.1, 0.36),
        at(0.28, -0.1, 0.36),
        at(-0.28, 0.42, 0.36),
        at(0.28, 0.42, 0.36),
      ],
    };
  return {
    unit: null,
    installations: [
      at(-0.48, -0.05, 0.32),
      at(0, -0.05, 0.32),
      at(0.48, -0.05, 0.32),
      at(-0.25, 0.47, 0.32),
      at(0.25, 0.47, 0.32),
    ],
  };
}
export const MEMOIR_STATUS = { x: 0.42, y: -0.58, r: 0.12 };
export const MEMOIR_EXEMPTION = { x: -0.42, y: -0.58, r: 0.12 };
export const MEMOIR_COORDINATES = { x: 0, y: -0.65, maxWidth: 0.55 };
