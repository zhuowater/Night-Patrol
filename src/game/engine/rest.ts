import { cardDef } from "./cards";
import { addLog, goMap, mustPlayer } from "./core";
import type { GameState } from "../types";

export function heal(state: GameState, amount: number) {
  const player = mustPlayer(state);
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  addLog(state, `回复 ${player.hp - before} 点生命。`);
  state.lastFx = "reward";
}

export function startRest(state: GameState) {
  state.screen = "rest";
  addLog(state, "维护窗口打开，防线可以重新整备。");
}

export function restHeal(state: GameState) {
  heal(state, Math.ceil(mustPlayer(state).maxHp * 0.3));
  goMap(state);
}

export function openUpgrade(state: GameState, returnScreen: "map" | "shop") {
  state.pendingUpgrade = { returnScreen };
  state.screen = "upgrade";
}

export function upgradeCard(state: GameState, uid: string) {
  const card = mustPlayer(state).deck.find((item) => item.uid === uid);
  if (!card || card.upgraded || cardDef(card).rarity === "status") return;
  card.upgraded = true;
  addLog(state, `${cardDef(card).name}已升级。`);
  state.lastFx = "reward";
  goMap(state);
}
