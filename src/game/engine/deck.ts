import { addLog, mustCombat } from "./core";
import { shuffle } from "./rng";
import type { GameState } from "../types";

export function drawCards(state: GameState, count: number) {
  const combat = mustCombat(state);
  for (let i = 0; i < count; i += 1) {
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break;
      combat.drawPile = shuffle(state, combat.discardPile);
      combat.discardPile = [];
      addLog(state, "弃牌堆洗回抽牌堆。");
    }
    const card = combat.drawPile.pop();
    if (card) combat.hand.push(card);
  }
}

export function recycleDiscardIntoDraw(state: GameState) {
  const combat = mustCombat(state);
  if (combat.discardPile.length === 0) {
    addLog(state, "弃牌堆空空如也。");
    return;
  }
  combat.drawPile = shuffle(state, [...combat.drawPile, ...combat.discardPile]);
  combat.discardPile = [];
  addLog(state, "日志重放，弃牌堆洗回抽牌堆。");
}
