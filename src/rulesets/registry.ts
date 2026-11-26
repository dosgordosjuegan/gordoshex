import type { Ruleset } from './contracts.js';
import { GENERIC_RULESETS } from './generic.js';
import { MEMOIR44_REFRESH2025 } from './memoir44/refresh2025.js';
export const BUILTIN_RULESETS: readonly Ruleset[] = Object.freeze([
  ...GENERIC_RULESETS,
  MEMOIR44_REFRESH2025,
]);
