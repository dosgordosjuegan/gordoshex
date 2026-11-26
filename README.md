# GordosHex

Freely accessible browser tools for hexagonal tabletop games, developed by **Dos Gordos Juegan**.

Repository: [dosgordosjuegan/gordoshex](https://github.com/dosgordosjuegan/gordoshex).

The first tool will calculate line of sight and lattice range. Memoir '44 is the first planned game-specific ruleset; its rules will be researched in a later milestone. The interface will support English and Spanish, desktop and mobile browsers, and deployment to GitHub Pages. This is a focused calculator, not a general tabletop simulator.

## Current status: reviewed M0 specification

This repository defines reviewed requirements and exact mathematical contracts. P1–P9 are approved with resource-limit and visibility-result clarifications; P10 is approved in principle with its complete schema deferred to M2. There is no application to run yet.

| Document | Contents |
| --- | --- |
| [Specification](docs/specification.md) | Scope, architecture, board model, ruleset policies, decision register and milestone gates |
| [Geometry](docs/geometry.md) | Exact affine coordinates, rational clipping, complete enumeration, shared edges and simultaneous events |
| [Testing](docs/testing.md) | Independently checkable coordinate fixtures, mathematical properties and ruleset-specific tests |

The documents distinguish agreed requirements, approved decisions, approval in principle, and open/deferred details. The specification's decision register owns approval status.

## Planned implementation

TypeScript, SVG, HTML, CSS, Vite and Vitest, with minimal dependencies. Mathematical geometry will run independently of the browser and game rules. The application will require no backend, database, authentication or proprietary runtime dependencies.

Boards will be arbitrary finite subsets of an infinite axial hexagonal lattice, including holes and disconnected regions. Exact geometry will include contacts with absent cells; rulesets will interpret those contacts. Ordered cell elements and canonical shared-edge features support game rules without introducing three-dimensional geometry.

## Milestones

| Milestone | Reviewable outcome |
| --- | --- |
| M0 | Formal specification and mathematical contracts |
| M1 | Exact geometry library and tests |
| M2 | Board model, visibility evaluation and replaceable rulesets |
| M3 | Interactive graphical application in English and Spanish |
| M4 | Publication on GitHub Pages and user/developer documentation |

M1 is ready to begin under the [reviewed decision register](docs/specification.md#decision-register-and-m1-gate). Its baseline is a supported Node.js LTS release, npm with a committed lockfile, strict TypeScript targeting ES2020 or later, Vitest, fast-check, ESLint, Prettier and GitHub Actions, with zero geometry runtime dependencies. Exact compatible versions are selected during M1; Vite initialization and frontend-framework selection are deferred.

M1 retains the conservative reference enumerator with a configurable candidate limit and bounded-cost exact preflight count. A persistent independent exact oracle, resource-boundary tests and reproducible performance baselines are required; default limits follow measurements. Memoir '44 research is deferred to M2. M3 rendering must subtract a suitable exact local display origin before floating-point conversion.

## License

[MIT](LICENSE). Game names identify intended ruleset compatibility; M0 supplies no game-specific rule implementation or game assets.
