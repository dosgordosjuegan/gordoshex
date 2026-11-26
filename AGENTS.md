# GordosHex development workflow

These instructions apply to the entire repository and all subsequent development tasks.
Explicit user instructions take precedence.

## Git and GitHub

- Verify the repository, current branch and working-tree status before starting work.
- Synchronize `main` with `origin/main` before beginning a new milestone. Fetch first;
  use fast-forward synchronization and preserve unrelated user changes.
- Create appropriately named development branches. Never implement changes directly
  on `main`.
- Run all relevant tests and quality checks before committing.
- Create meaningful, cohesive commits.
- Push development branches to `origin`.
- Open pull requests using the GitHub CLI (`gh`).
- Include implementation summaries, verification evidence, deviations from the
  specifications and remaining risks in PR descriptions.
- Update existing pull requests when addressing review feedback.
- Never merge a pull request without explicit user approval.
- After an approved merge, synchronize local `main` and clean up the merged
  development branch.
- Never force-push, rewrite shared history or discard unrelated user changes
  without explicit authorization.

## Engineering discipline

- Treat `README.md`, `docs/specification.md`, `docs/geometry.md` and
  `docs/testing.md` as the authoritative approved specifications.
- Report substantive mathematical or architectural ambiguities rather than
  silently resolving them.
- Do not expand milestone scope without approval.
- Never weaken tests merely to make an implementation pass.
- Distinguish verified results from assumptions.
- Keep the geometry engine independent of game rules and presentation.
- Prefer simple, maintainable implementations and minimal dependencies.

## Verification

- Use the pinned Node.js runtime in `.nvmrc` and npm version in `package.json`.
- Install reproducibly with `npm ci`.
- Run `npm run check` before committing. It includes strict type checking, the full
  test suite, ESLint, Prettier verification and the standalone geometry build.
- Run relevant additional checks when the change warrants them. For M1 geometry,
  retain exact fixed fixtures, deterministic property tests, the persistent
  independent oracle, exhaustive bounded comparisons and resource-boundary tests.
- For performance claims, retain reproducible benchmark configuration, raw samples,
  source identity, complete-work checksums and hardware/runtime details. Rerun
  affected benchmarks if the measured production source or configuration changes.
- Do not silently revise approved mathematical contracts or replace exact
  comparisons with floating-point tolerances.

## Completion

Unless explicitly instructed otherwise, a completed development task must result in:

1. A verified implementation.
2. Passing automated checks.
3. Committed changes.
4. A pushed development branch.
5. An open pull request ready for review.

Report the pull request URL and verification results, then stop and await review.
Do not merge until the user explicitly approves the merge.
