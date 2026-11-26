import type { BoardSnapshot } from '../board/model.js';
import {
  message,
  type Ruleset,
  type RulesetReference,
  type SemanticMessage,
} from './contracts.js';
export type RulesetResolution =
  | { readonly status: 'supported'; readonly ruleset: Ruleset }
  | {
      readonly status:
        'invalid-query-input' | 'unsupported-ruleset-or-configuration';
      readonly explanations: readonly SemanticMessage[];
    };
/** Static caller-supplied collection only; no dynamic loading. Adapter exceptions propagate to the evaluator. */
export function resolveRuleset(
  reference: RulesetReference,
  board: BoardSnapshot,
  collection: readonly Ruleset[],
): RulesetResolution {
  const found = collection.filter(
    (r) => r.id === reference.id && r.version === reference.version,
  );
  if (found.length > 1) throw new Error('Duplicate ruleset registration');
  const ruleset = found[0];
  if (!ruleset)
    return Object.freeze({
      status: 'unsupported-ruleset-or-configuration',
      explanations: Object.freeze([
        message('ruleset.unavailable', {
          id: reference.id,
          version: reference.version,
        }),
      ]),
    });
  const config = ruleset.validateConfiguration(reference.configuration);
  if (config.status !== 'accepted')
    return Object.freeze({
      status:
        config.status === 'invalid'
          ? 'invalid-query-input'
          : 'unsupported-ruleset-or-configuration',
      explanations: Object.freeze(
        config.explanations.map((m) => message(m.code, m.arguments)),
      ),
    });
  const invalid = ruleset.validateBoard(board, reference.configuration);
  if (invalid.length)
    return Object.freeze({
      status: 'invalid-query-input',
      explanations: Object.freeze(
        invalid.map((m) => message(m.code, m.arguments)),
      ),
    });
  return Object.freeze({ status: 'supported', ruleset });
}
