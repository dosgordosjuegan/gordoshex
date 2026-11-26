import { array, InputError, object } from './validation.js';
export type JsonValue =
  null | boolean | number | string | JsonObject | readonly JsonValue[];
export interface JsonObject {
  readonly [key: string]: JsonValue;
}
/** Copies before freezing. Maps, accessors, cycles, sparse arrays and lossy JSON values are rejected. */
export function jsonValue(
  value: unknown,
  ancestors = new Set<object>(),
): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return value;
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (!Number.isInteger(value) || Number.isSafeInteger(value))
  )
    return value;
  if (typeof value !== 'object' || value === null)
    throw new InputError('unsupported-json-value');
  if (ancestors.has(value)) throw new InputError('cyclic-json-value');
  ancestors.add(value);
  try {
    if (Array.isArray(value))
      return Object.freeze(
        array(value).map((item) => jsonValue(item, ancestors)),
      );
    const record = object(value);
    return Object.freeze(
      Object.fromEntries(
        Object.entries(record).map(([key, item]) => [
          key,
          jsonValue(item, ancestors),
        ]),
      ),
    );
  } finally {
    ancestors.delete(value);
  }
}
export function jsonObject(value: unknown): JsonObject {
  object(value);
  const result = jsonValue(value);
  if (typeof result !== 'object' || result === null || Array.isArray(result))
    throw new InputError('expected-json-object');
  // Construct via entries to preserve the JsonObject type without a structural cast.
  return Object.freeze(Object.fromEntries(Object.entries(result)));
}
