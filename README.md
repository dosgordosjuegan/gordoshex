# GordosHex

Freely accessible browser tools for hexagonal tabletop games, developed by **Dos Gordos Juegan**.

Repository: [dosgordosjuegan/gordoshex](https://github.com/dosgordosjuegan/gordoshex).

The first tool will calculate line of sight and lattice range. Memoir '44 is the first planned game-specific ruleset; its rules will be researched in a later milestone. The interface will support English and Spanish, desktop and mobile browsers, and deployment to GitHub Pages. This is a focused calculator, not a general tabletop simulator.

## Current status: M2A board and generic visibility rulesets

The accepted M1 exact geometry engine is joined by immutable board snapshots, pure board editing, axial/offset generators, three generic contact policies, independent range/LOS evaluation and a versioned scenario codec. All modules have zero runtime dependencies. Game-specific rules, rendering and the browser application remain future work. P1–P9 retain their approved semantics; M2A completes the underlying P10 version-1 scenario schema.

| Document                               | Contents                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Specification](docs/specification.md) | Scope, architecture, board model, ruleset policies, decision register and milestone gates               |
| [Geometry](docs/geometry.md)           | Exact affine coordinates, rational clipping, complete enumeration, shared edges and simultaneous events |
| [Testing](docs/testing.md)             | Independently checkable coordinate fixtures, mathematical properties and ruleset-specific tests         |

The documents distinguish agreed requirements, approved decisions, approval in principle, and open/deferred details. The specification's decision register owns approval status.

## Planned implementation

TypeScript, SVG, HTML, CSS, Vite and Vitest, with minimal dependencies. Mathematical geometry will run independently of the browser and game rules. The application will require no backend, database, authentication or proprietary runtime dependencies.

Boards will be arbitrary finite subsets of an infinite axial hexagonal lattice, including holes and disconnected regions. Exact geometry will include contacts with absent cells; rulesets will interpret those contacts. Ordered cell elements and canonical shared-edge features support game rules without introducing three-dimensional geometry.

## Milestones

| Milestone | Reviewable outcome                                           |
| --------- | ------------------------------------------------------------ |
| M0        | Formal specification and mathematical contracts              |
| M1        | Exact geometry library and tests                             |
| M2        | Board model, visibility evaluation and replaceable rulesets  |
| M3        | Interactive graphical application in English and Spanish     |
| M4        | Publication on GitHub Pages and user/developer documentation |

Use Node.js 22.13.1 and npm 10.9.2:

```sh
nvm use
npm ci
npm run check
npm run benchmark
```

The geometry entry point is `src/index.ts`; `npm run build` produces native ESM and declarations in `dist/`.

```ts
import { axial, traceSightline } from './dist/index.js';

const result = traceSightline(axial(0n, 0n), axial(2n, -1n), 1000n);
if (result.status === 'complete') {
  // Four cell contacts, five finite edge contacts, four simultaneous events.
  console.log(result.cells, result.edges, result.events);
}
```

The default per-query candidate limit is `1000n`, selected after measurements; callers can override it. Rejection returns exact count/limit diagnostics without a partial result. Geometry includes every intersected lattice cell independently of board membership.

See [M2A board, ruleset, visibility and scenario APIs](docs/board-and-visibility.md), the [M2A completion report](docs/m2a-report.md), [geometry implementation and public API](docs/implementation.md), [performance evidence](docs/performance.md), and the [M1 completion report](docs/m1-report.md). The persistent test oracle uses independent polygon-side intersections and an independent axial search region. No optimized traversal is introduced.

The M2A entry point is `src/application.ts` (built `dist/application.js`). Scenario codecs take an explicit static ruleset collection; there is no dynamic plugin loader or import/export UI.

Memoir '44 research remains deferred to M2. M3 rendering must subtract an exact local display origin before floating-point conversion.

## License

[MIT](LICENSE). Game names identify intended ruleset compatibility; M0 supplies no game-specific rule implementation or game assets.
