import { RELICS } from "../content";
import { cardDef, cardName, createCard } from "./cards";
import { addLog, goMap, mustPlayer } from "./core";
import { addRelic, randomCardChoices } from "./rewards";
import { pick } from "./rng";
import type { CardInstance, GameState, ShopState } from "../types";

export function heal(state: GameState, amount: number) {
  const player = mustPlayer(state);
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  addLog(state, `回复 ${player.hp - before} 点生命。`);
  state.lastFx = "reward";
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

export function startShop(state: GameState) {
  state.shop = {
    cards: randomCardChoices(state, 3).map((card) => ({ card, sold: false, cost: shopCardCost(card) })),
    relic: { relic: randomShopRelic(state), sold: false, cost: 150 },
    removeCost: 75,
  };
  state.screen = "shop";
  addLog(state, "情报市场打开货架，规则、工具和样本等待预算分配。");
}

export function randomShopRelic(state: GameState) {
  const owned = new Set(mustPlayer(state).relics.map((relic) => relic.id));
  const options = RELICS.filter((relic) => !owned.has(relic.id));
  return options.length ? pick(state, options) : null;
}

export function shopCardCost(card: CardInstance) {
  const rarity = cardDef(card).rarity;
  if (rarity === "rare") return 95;
  if (rarity === "uncommon") return 68;
  return 48;
}

export function buyShopCard(state: GameState, index: number) {
  const item = state.shop?.cards[index];
  const player = mustPlayer(state);
  if (!item || item.sold || player.gold < item.cost) return;
  player.gold -= item.cost;
  player.deck.push(createCard(state, item.card.id));
  item.sold = true;
  addLog(state, `采购 ${cardName(item.card)}。`);
  state.lastFx = "reward";
}

export function buyShopRelic(state: GameState) {
  const item = state.shop?.relic;
  const player = mustPlayer(state);
  if (!item?.relic || item.sold || player.gold < item.cost) return;
  player.gold -= item.cost;
  addRelic(state, item.relic.id);
  item.sold = true;
  state.lastFx = "reward";
}

export function openRemoveCard(state: GameState, cost: number, returnScreen: "map" | "shop") {
  if (mustPlayer(state).gold < cost) {
    addLog(state, "预算不足。");
    return;
  }
  state.pendingRemove = { cost, returnScreen };
  state.screen = "remove";
}

export function removeCard(state: GameState, uid: string) {
  const pending = state.pendingRemove;
  const player = mustPlayer(state);
  const index = player.deck.findIndex((card) => card.uid === uid);
  if (!pending || index < 0 || player.gold < (pending.cost || 0)) return;
  const [removed] = player.deck.splice(index, 1);
  player.gold -= pending.cost || 0;
  addLog(state, `清理了 ${cardName(removed)}。`);
  state.lastFx = "reward";
  if (pending.returnScreen === "shop") {
    state.screen = "shop";
    state.pendingRemove = null;
    return;
  }
  goMap(state);
}

export function shopState(state: GameState): ShopState | null {
  return state.shop;
}
