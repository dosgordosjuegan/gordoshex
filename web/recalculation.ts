import { equalCoordinates } from '../src/index.js';
import type { AppState } from './state.js';
import type { Batch } from './evaluation.js';
export const EVALUATION_DEBOUNCE_MS = 150;
export function mathematicalInputsChanged(
  previous: AppState,
  next: AppState,
): boolean {
  const sameOrigin =
    previous.origin === null
      ? next.origin === null
      : next.origin !== null && equalCoordinates(previous.origin, next.origin);
  const sameRange =
    previous.range.kind === next.range.kind &&
    (previous.range.kind === 'unlimited' ||
      (next.range.kind === 'radius' &&
        previous.range.radius === next.range.radius));
  return (
    previous.board !== next.board ||
    !sameOrigin ||
    !sameRange ||
    previous.rulesetId !== next.rulesetId
  );
}
/** One pending immutable snapshot; no result cache or background computation. */
export class Recalculation {
  #revision = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #frame: number | undefined;
  constructor(
    private readonly evaluate: (
      snapshot: AppState,
    ) => Batch | Promise<Batch | null>,
    private readonly running: () => void,
    private readonly complete: (batch: Batch) => void,
    private readonly failed: (error: unknown) => void,
  ) {}
  get revision(): number {
    return this.#revision;
  }
  isCurrent(revision: number): boolean {
    return this.#revision === revision;
  }
  cancel(): void {
    this.#revision++;
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
    this.#timer = undefined;
    this.#frame = undefined;
  }
  request(snapshot: AppState, delay = EVALUATION_DEBOUNCE_MS): void {
    this.cancel();
    const revision = this.#revision;
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      if (revision !== this.#revision) return;
      this.running();
      if (revision !== this.#revision) return;
      // Paint the pending/running state before the existing synchronous computation.
      this.#frame = requestAnimationFrame(() => {
        this.#frame = undefined;
        if (revision !== this.#revision) return;
        this.#timer = setTimeout(() => {
          this.#timer = undefined;
          if (revision !== this.#revision) return;
          try {
            const batch = this.evaluate(snapshot);
            if (batch instanceof Promise) {
              void batch.then(
                (result) => {
                  if (result && revision === this.#revision)
                    this.complete(result);
                },
                (error) => {
                  if (revision === this.#revision) this.failed(error);
                },
              );
            } else if (revision === this.#revision) this.complete(batch);
          } catch (error) {
            if (revision === this.#revision) this.failed(error);
          }
        }, 0);
      });
    }, delay);
  }
}
