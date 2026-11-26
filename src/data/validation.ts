export class InputError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'InputError';
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new InputError('expected-object');
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null)
    throw new InputError('expected-plain-object');
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      typeof key !== 'string' ||
      !descriptor?.enumerable ||
      !('value' in descriptor)
    )
      throw new InputError('unsupported-object-member');
  }
  return Object.fromEntries(Object.entries(value));
}
export function fields(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  const record = object(value);
  if (
    required.some((key) => !Object.hasOwn(record, key)) ||
    Object.keys(record).some(
      (key) => !required.includes(key) && !optional.includes(key),
    )
  )
    throw new InputError('unexpected-or-missing-field');
  return record;
}
export function text(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new InputError('expected-nonempty-string');
  return value;
}
export function array(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    throw new InputError('expected-array');
  for (let index = 0; index < value.length; index++)
    if (!Object.hasOwn(value, index)) throw new InputError('sparse-array');
  if (Reflect.ownKeys(value).length !== value.length + 1)
    throw new InputError('unsupported-array-member');
  for (const key of Reflect.ownKeys(value))
    if (!('value' in (Object.getOwnPropertyDescriptor(value, key) ?? {})))
      throw new InputError('unsupported-array-member');
  return value;
}
