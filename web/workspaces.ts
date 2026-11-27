import { axial } from '../src/index.js';
import { rectangle, MEMOIR44_REFRESH2025 } from '../src/application.js';
import { initialState, setRuleset, type AppState } from './state.js';
import { memoirMode, paintMemoir } from './memoir-editing.js';
export function initialMemoirState(): AppState {
  let state: AppState = {
    ...initialState(),
    showCoordinates: false,
    board: rectangle(13n, 9n, axial(0n, 0n), 'pointy-odd-row'),
    rulesetId: MEMOIR44_REFRESH2025.id,
    nextId: 1,
  };
  state = paintMemoir(state, axial(0n, 0n), {
    kind: 'unit',
    type: 'infantry',
    side: 'allies',
  });
  return paintMemoir(state, axial(1n, 0n), { kind: 'terrain', type: 'forest' });
}
/** Two independent in-session snapshots; switching never converts entities. */
export class WorkingBoards {
  #generic: AppState;
  #memoir: AppState | null = null;
  constructor(initial: AppState) {
    this.#generic = initial;
  }
  switch(current: AppState, id: string): AppState {
    if (memoirMode(current)) this.#memoir = current;
    else this.#generic = current;
    const next = memoirMode({ rulesetId: id })
      ? (this.#memoir ?? initialMemoirState())
      : this.#generic;
    return setRuleset(next, id);
  }
}
