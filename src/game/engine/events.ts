import { EVENTS } from "../content";
import { cardDef, cardName, createCard } from "./cards";
import { losePlayerHp } from "./combat";
import { addLog, goMap, mustPlayer } from "./core";
import { heal, openRemoveCard, openUpgrade } from "./maintenance";
import { gainRandomRelic, randomCardChoices } from "./rewards";
import { pick } from "./rng";
import type { GameState } from "../types";

export function startEvent(state: GameState) {
  state.event = pick(state, EVENTS);
  state.screen = "event";
  addLog(state, `${state.event.title}浮现在控制台上。`);
}

export function resolveEvent(state: GameState, choiceId: string) {
  const player = mustPlayer(state);
  if (choiceId === "wellHeal") {
    heal(state, 12);
    goMap(state);
  }
  if (choiceId === "wellRelic") {
    losePlayerHp(state, 7, "深挖告警");
    if (state.screen !== "gameover") {
      gainRandomRelic(state);
      goMap(state);
    }
  }
  if (choiceId === "foxCard") {
    const card = randomCardChoices(state, 1)[0];
    player.deck.push(createCard(state, card.id));
    addLog(state, `情报样本转化为 ${cardName(card)}。`);
    goMap(state);
  }
  if (choiceId === "foxRemove") openRemoveCard(state, 40, "map");
  if (choiceId === "templeUpgrade") openUpgrade(state, "map");
  if (choiceId === "templeGold") {
    player.gold += 80;
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, "获得 80 预算，噪声告警进入牌组。");
    goMap(state);
  }
  if (choiceId === "scholarCopy") {
    const candidates = player.deck.filter((card) => !["basic", "status"].includes(cardDef(card).rarity));
    const source = candidates.length ? pick(state, candidates) : createCard(state, "qingxin");
    player.deck.push(createCard(state, source.id, source.upgraded));
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, `隔离环境复现出 ${cardName(source)}，也留下噪声告警。`);
    goMap(state);
  }
  if (choiceId === "scholarLeave") {
    addLog(state, "请求被暂缓，风险没有扩大。");
    goMap(state);
  }
}
