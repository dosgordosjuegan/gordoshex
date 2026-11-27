# Memoir '44 refreshed 2025 adapter API

`MEMOIR44_REFRESH2025` implements the approved subset of the refreshed 2025 edition.
Its reference is `{ id: 'memoir44.refresh2025', version: '1', configuration: {} }`.
`BUILTIN_RULESETS` contains it alongside the unchanged three `GENERIC_RULESETS`.
The visibility evaluator defaults to this built-in collection. Scenario codecs
still require an explicit collection, normally `BUILTIN_RULESETS`.

The [research and decision register](memoir44.md) records official URLs, printed
page references, deductions, approved conventions and deferred content. This is
physical LOS/range inspection, not exhaustive base-game compatibility or an attack
legality checker. No legacy rules, expansions, scenario overrides or game assets
are included.

The [M3B graphical editor](../memoir-editor.md) exposes this same supported subset
without changing adapter semantics. Generic and Memoir modes keep separate session
boards; see its documentation for painting and artillery presentation.

## Entity schema

Every board element retains `{ id, kind, properties }`. IDs are globally unique
and stable. Exact supported properties, with no additional fields:

| Kind                | Properties                | Supported values                                                                            |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `memoir44.terrain`  | `{ type }`                | `open`, `forest`, `hedgerow`, `town`, `church`, `hill`, `river`, `ocean`, `beach`, `bridge` |
| `memoir44.obstacle` | `{ type }`                | `bunker`, `hedgehog`, `sandbags`, `wire`, `sea-wall`                                        |
| `memoir44.unit`     | `{ type, side, variant }` | type: `infantry`, `armor`, `artillery`; side: `allies`, `axis`; variant: `standard`         |

A cell has at most one base terrain (omission means open), at most one unit and
at most one of each installation type. Unique installations can coexist; all
inherit the base cell's categorical height, 1 for hill and 0 otherwise. Stacks
preserve order, but no element overwrites another or gains last-element priority.
Hill+bunker is supported; hill+forest as two base terrains is rejected. A bridge
is a transparent base-cell representation; river+bridge is not a two-base overlay.
This LOS composition does not validate legal deployment, movement or scenario setup.
All shared-edge features, unknown entity kinds/types/fields and unsupported
unit variants are rejected across the complete board, including off-ray cells.

The public helpers/constants are `memoir44Cell`, `validateMemoir44Board`,
`MEMOIR44_TERRAINS`, `MEMOIR44_INSTALLATIONS`, `MEMOIR44_UNIT_TYPES` and
`MEMOIR44_MAX_RANGE`; their types are exported through `src/application.ts`.
`memoir44Cell` returns immutable semantic roles and throws on invalid data.
No Memoir data is imported by the standalone geometry entry point.

## Usage

```ts
import { axial } from '../../dist/index.js';
import {
  BoardSnapshot,
  BUILTIN_RULESETS,
  evaluateVisibility,
  serializeScenario,
} from '../../dist/application.js';

const board = new BoardSnapshot([
  {
    coordinate: axial(0n, 0n),
    elements: [
      {
        id: 'observer',
        kind: 'memoir44.unit',
        properties: { type: 'infantry', side: 'allies', variant: 'standard' },
      },
    ],
  },
  {
    coordinate: axial(1n, 0n),
    elements: [
      {
        id: 'woods',
        kind: 'memoir44.terrain',
        properties: { type: 'forest' },
      },
    ],
  },
  { coordinate: axial(2n, 0n), elements: [] },
]);
const ruleset = {
  id: 'memoir44.refresh2025',
  version: '1',
  configuration: {},
};
const result = evaluateVisibility({
  board,
  origin: axial(0n, 0n),
  target: axial(2n, 0n),
  range: { kind: 'unlimited' },
  ruleset,
  maxCandidates: 1000n,
});
// Evaluated, in range, physically blocked by woods over exact [1/4, 3/4].
const scenarioJson = serializeScenario({ board, ruleset }, BUILTIN_RULESETS);
// Version-1 schema, canonical decimal coordinates; IDs, order and membership retained.
console.log(result, scenarioJson);
```

## Decisions and evidence

Official rules and their deductions are specified in R01–R09 of the research:
endpoint exemptions, intervening friendly/enemy units, opaque terrain/bunkers,
global opposite-side boundary obstructions, categorical elevation, unit maxima
and the artillery exemption. Installations other than bunkers are transparent.
Transparent water does not imply permission to move or attack there.

Eligibility is filtered before contact classification. For ordinary obstructions,
height must be at least the minimum endpoint height. Bare hill terrain separately
permits LOS between two elevated endpoints; a unit or bunker on that hill does
not inherit the exemption. Strict interior contacts block alone. Eligible
boundary contacts block only with an eligible obstruction on the opposite side,
anywhere along the segment. Parameter overlap and simultaneity are unnecessary.

Approved GordosHex conventions:

- Isolated vertices enter the same global sided policy as edge overlaps. This is
  not a publisher ruling. A realizable mixed edge/singleton sightline does not
  exist in the center-to-center domain; see the mathematical proof in the research.
- Origin and target must exist. Absent intermediate positive-length contacts
  invalidate LOS; absent singleton contacts are ignored with coordinate evidence.
  These are arbitrary-board conventions, not official rules for holes or half-hexes.
- A supported observer is mandatory; an empty target is allowed. Self inspection
  is clear and in range, subject to ordinary input/resource checks; it is not an attack.
- Infantry/armor maximum is 3; artillery maximum is 6. A finite user radius is
  an additional inclusive cap. Unlimited removes only that extra cap.
- Physical LOS is always evaluated, including artillery. Its official ordinary
  attack exemption is exposed separately as `memoir44.artillery-los-not-required`.

`range` and `los` remain independent. `visibility.visible` retains its existing
meaning: in range and physically clear. Blocked artillery therefore has
`visible: false`; this does not say it cannot attack. There is no attack verdict.

Membership invalidity takes precedence in `los.status`. Physical blockers are
still retained, and `memoir44.physical-los` arguments distinguish `blocked` and
`invalidatingMembership`. `visibility` is then `not-applicable`. Geometry resource
failures remain `evaluation-failure` with exact count/limit and no LOS/range/verdict.
Malformed board/query data returns `invalid-query-input`; unknown ruleset identity,
version or nonempty configuration returns `unsupported-ruleset-or-configuration`.
Unexpected adapter errors remain evaluation failures.

Each blocker has its stable element ID, exact coordinate, contact classification,
entry/exit, determinant side and boundary incidences. All matching stacked
obstructions are retained. `memoir44.opposite-boundary-obstructions` references
all positive/negative element IDs; events retain their actual geometric parameters.
Single-sided eligible contacts remain ignored evidence, not missing causes.
Reasons also distinguish endpoint exemptions, lower obstructions, bare hills,
transparent elements and absent cells. Explanation codes are semantic, with
structured arguments and no localized presentation strings.

## Limits

Lakes, additional terrain/hill variants, special units, legacy plateau semantics,
scenario overrides and all expansion rules are unsupported. No movement, legal
placement, combat modifiers, dice, command cards, turn state or attack eligibility
is assessed. Generic rectangles are not claimed to match the official battlefield.
Whole-board validation runs synchronously per query; caching, workers and batch
optimizations are deferred. Scenario/generator resource budgets remain separate
future work. The [completion report](../m2b2-report.md) records verification.
