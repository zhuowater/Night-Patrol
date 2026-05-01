import type { GameState } from "../types";

export function random(state: GameState) {
  state.seed = (state.seed * 48271) % 2147483647;
  return state.seed / 2147483647;
}

export function int(state: GameState, min: number, max: number) {
  return Math.floor(random(state) * (max - min + 1)) + min;
}

export function pick<T>(state: GameState, items: T[]): T {
  return items[Math.floor(random(state) * items.length)];
}

export function shuffle<T>(state: GameState, items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
