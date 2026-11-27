# GordosHex

Freely accessible browser tools for hexagonal tabletop games, developed by **Dos Gordos Juegan**.

Repository: [dosgordosjuegan/gordoshex](https://github.com/dosgordosjuegan/gordoshex).

The first tool will calculate line of sight and lattice range. The first game-specific adapter supports an explicit subset of Memoir '44 refreshed 2025; see the [approved rules specification](docs/rulesets/memoir44.md) and [adapter API](docs/rulesets/memoir44-refresh2025.md). The interface will support English and Spanish, desktop and mobile browsers, and deployment to GitHub Pages. This is a focused calculator, not a general tabletop simulator.

## Current status: M3B Memoir '44 editor for review

The accepted M1 exact geometry engine is joined by immutable board snapshots, pure board editing, axial/offset generators, three generic contact policies, independent range/LOS evaluation and a versioned scenario codec. All modules have zero runtime dependencies. The refreshed-2025 adapter adds categorical elevation, global sided boundary obstructions, exact blocker evidence and intrinsic unit range. The first browser application provides SVG board editing and exact generic visibility inspection; the supported Memoir '44 2025 subset now has its own graphical editing workspace. P1–P9 retain their approved semantics; M2A completes the underlying P10 version-1 scenario schema.

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

Use Node.js 22.13.1 and npm 10.9.2. Launch the calculator locally:

```sh
nvm use
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. The initial
13 × 9 staggered board is a generic example, not an official game battlefield.
Choose an editing/inspection mode. Board, observer, policy and range edits
automatically recalculate after a 150 ms debounce; **Evaluate all targets** remains
available to refresh immediately. Drag from any cell, edge or background to pan
(left/middle button, Space + drag, or touch); stationary clicks activate the mode. The target panel retains independent range,
LOS, exact intervals and every blocker. Both orientations, zoom/pan, cell stacks
and ignored shared-edge markers are supported. English is available in M3A.

```sh
npm run check             # Types, all unit/property/oracle tests, lint, format, libraries
npm run build:app         # Production browser build in browser-dist/
npm run preview -- --port 4173
npx playwright install chromium
npm run test:browser      # Actual Chromium tests against the production build
npm run benchmark:app     # Reproducible whole-board evaluation and SVG measurements
```

See [application architecture, controls and limits](docs/interactive-app.md),
[measured browser performance](docs/m3a-performance.md), and the
[M3A completion report](docs/m3a-report.md). Generated boards/batches are limited
to 512 cells, with a separate aggregate candidate budget and explicit failures.
The existing `npm run benchmark` still measures standalone geometry.

Choose **Memoir '44 2025 · supported subset** to edit terrain, installations and
standard Allied/Axis units. Generic and Memoir modes retain separate working
boards in memory. Memoir's **No additional range cap** retains intrinsic unit
range. Memoir green checks mean range and LOS requirements are satisfied; blocked
artillery in range has a separate **A** exemption annotation. Inspection preserves
blocked physical LOS and the engine visibility boolean. No target is certified as
a legal attack. **Coordinate labels** can be toggled without recalculating.
This is inspection, not attack legality or exhaustive game compatibility. See
[Memoir editor usage](docs/memoir-editor.md), [M3B performance](docs/m3b-performance.md)
and [M3B completion evidence](docs/m3b-report.md).

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

The [Memoir '44 adapter](docs/rulesets/memoir44-refresh2025.md) uses `memoir44.refresh2025`, version `"1"`, empty configuration. Approved vertex/absence conventions are identified separately from official rules. Artillery keeps physical LOS and its attack exemption separate. This supports named base-core terrain and standard infantry/armor/artillery, not complete base-game compatibility or attack legality. See [verification and limitations](docs/m2b2-report.md). M3 rendering must subtract an exact local display origin before floating-point conversion.

## License

[MIT](LICENSE). Game names identify intended ruleset compatibility; No proprietary game assets are included.
