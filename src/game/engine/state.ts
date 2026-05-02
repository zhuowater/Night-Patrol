import type { GameState } from "../types";

export function createGameState(): GameState {
  return {
    screen: "title",
    difficulty: "normal",
    player: null,
    floor: 0,
    mapNodes: [],
    availableNodeIds: [],
    currentNodeId: null,
    visitedNodeIds: [],
    combat: null,
    cinematic: null,
    reward: null,
    event: null,
    shop: null,
    pendingRemove: null,
    pendingUpgrade: null,
    log: [],
    seed: Date.now() % 2147483647,
    nextCardUid: 1,
    lastFx: "none",
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState;
}
