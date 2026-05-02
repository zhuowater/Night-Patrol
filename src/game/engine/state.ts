import type { GameState, GuidanceCueId } from "../types";

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
    lastEventResult: null,
    shop: null,
    pendingRemove: null,
    pendingUpgrade: null,
    log: [],
    seed: Date.now() % 2147483647,
    nextCardUid: 1,
    guidance: { seen: {} },
    lastFx: "none",
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState;
}

export function hasSeenGuidance(state: GameState, id: GuidanceCueId) {
  return Boolean(state.guidance?.seen?.[id]);
}

export function markGuidanceSeen(state: GameState, id: GuidanceCueId) {
  if (!state.guidance) state.guidance = { seen: {} };
  state.guidance.seen[id] = true;
}
