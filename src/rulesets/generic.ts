import { equalCoordinates } from '../geometry/coordinates.js';
import type { ContactClass } from '../geometry/clipping.js';
import {
  cellEvidence,
  edgeEvidence,
  inclusiveRange,
  message,
  type Evidence,
  type Ruleset,
} from './contracts.js';
function generic(id: string, classes: readonly ContactClass[]): Ruleset {
  const ruleset: Ruleset = {
    id,
    version: '1',
    validateConfiguration: (configuration) =>
      Object.keys(configuration).length === 0
        ? Object.freeze({ status: 'accepted' })
        : Object.freeze({
            status: 'unsupported',
            explanations: Object.freeze([
              message('generic.unsupported-configuration'),
            ]),
          }),
    validateBoard: (board) =>
      Object.freeze(
        board.cells.flatMap((cell) =>
          cell.elements
            .filter(
              (e) =>
                e.kind === 'obstacle' && Object.keys(e.properties).length !== 0,
            )
            .map((e) =>
              message('generic.invalid-obstacle-payload', { elementId: e.id }),
            ),
        ),
      ),
    evaluateRange: inclusiveRange,
    evaluateLineOfSight: (context) => {
      const evidence: Evidence[] = [];
      for (const cell of context.cells) {
        if (cell.membership === 'absent') {
          evidence.push(
            cellEvidence(
              cell.contact,
              true,
              'transparent',
              'generic.absent-transparent',
            ),
          );
          continue;
        }
        const endpoint =
          equalCoordinates(cell.contact.cell, context.origin) ||
          equalCoordinates(cell.contact.cell, context.target);
        for (const element of cell.elements) {
          if (element.kind !== 'obstacle') continue;
          const blocks = !endpoint && classes.includes(cell.contact.kind);
          evidence.push(
            cellEvidence(
              cell.contact,
              false,
              blocks ? 'blocking' : 'ignored',
              endpoint
                ? 'generic.endpoint-ignored'
                : blocks
                  ? 'generic.obstacle-blocks'
                  : 'generic.contact-ignored',
              element.id,
            ),
          );
        }
      }
      for (const edge of context.edges)
        for (const feature of edge.features)
          evidence.push(
            edgeEvidence(
              edge.contact,
              'ignored',
              'generic.edge-feature-ignored',
              feature.id,
            ),
          );
      return Object.freeze({
        status: evidence.some((e) => e.effect === 'blocking')
          ? 'blocked'
          : 'clear',
        evidence: Object.freeze(evidence),
        explanations: Object.freeze([
          message('generic.contact-policy', { rulesetId: id }),
        ]),
      });
    },
  };
  return Object.freeze(ruleset);
}
export const INTERIOR_ONLY = generic('generic.interior-only', ['interior']);
export const INTERIOR_AND_EDGE = generic('generic.interior-and-edge', [
  'interior',
  'edge-overlap',
]);
export const ANY_CONTACT = generic('generic.any-contact', [
  'interior',
  'edge-overlap',
  'isolated-vertex',
]);
export const GENERIC_RULESETS: readonly Ruleset[] = Object.freeze([
  INTERIOR_ONLY,
  INTERIOR_AND_EDGE,
  ANY_CONTACT,
]);
