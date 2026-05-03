import { EVENTS } from "../content";
import { cardDef, cardName, createCard } from "./cards";
import { losePlayerHp } from "./combat";
import { addLog, goMap, mustPlayer } from "./core";
import { heal, openRemoveCard, openUpgrade } from "./maintenance";
import { gainRandomRelic, randomCardChoices } from "./rewards";
import { pick } from "./rng";
import type { GameState } from "../types";

function recordEventResult(state: GameState, choiceTitle: string, summary: string) {
  state.lastEventResult = summary;
  state.runSummary.events.push({
    floor: state.floor,
    title: state.event?.title ?? "异常事件",
    choiceTitle,
    result: summary,
  });
  addLog(state, `事件结果：${summary}。`);
}

export function startEvent(state: GameState) {
  state.event = pick(state, EVENTS);
  state.screen = "event";
  addLog(state, `${state.event.title}浮现在控制台上。`);
}

export function resolveEvent(state: GameState, choiceId: string) {
  const player = mustPlayer(state);
  if (choiceId === "wellHeal") {
    heal(state, 12);
    recordEventResult(state, "快速关闭", "获得：防线 +12");
    goMap(state);
  }
  if (choiceId === "wellRelic") {
    losePlayerHp(state, 7, "深挖告警");
    if (state.screen !== "gameover") {
      gainRandomRelic(state);
      recordEventResult(state, "深挖上下文", "失去：防线 -7；获得：随机安全工具");
      goMap(state);
    }
  }
  if (choiceId === "foxCard") {
    const cards = randomCardChoices(state, 2);
    for (const card of cards) player.deck.push(createCard(state, card.id));
    const names = cards.map((card) => cardName(card)).join("、");
    addLog(state, `情报样本转化为 ${names}。`);
    recordEventResult(state, "接收样本", `获得：2 张样本转化牌：${names}`);
    goMap(state);
  }
  if (choiceId === "foxRemove") {
    recordEventResult(state, "清理旧规则", "进入删牌清单；花费：40 预算");
    openRemoveCard(state, 40, "map");
  }
  if (choiceId === "templeUpgrade") {
    player.gold += 20;
    recordEventResult(state, "升级剧本", "进入升级清单；选择 1 张剧本强化；获得：20 预算");
    openUpgrade(state, "map");
  }
  if (choiceId === "templeGold") {
    player.gold += 80;
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, "获得 80 预算，噪声告警进入牌组。");
    recordEventResult(state, "申请预算", "获得：80 预算；牌组污染 +1");
    goMap(state);
  }
  if (choiceId === "scholarCopy") {
    const candidates = player.deck.filter((card) => !["basic", "status"].includes(cardDef(card).rarity));
    const source = candidates.length ? pick(state, candidates) : createCard(state, "qingxin");
    player.deck.push(createCard(state, source.id, source.upgraded));
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, `隔离环境复现出 ${cardName(source)}，也留下噪声告警。`);
    recordEventResult(state, "隔离复现", `获得：复制 ${cardName(source)}；牌组污染 +1`);
    goMap(state);
  }
  if (choiceId === "scholarLeave") {
    player.gold += 25;
    addLog(state, "请求被暂缓，风险没有扩大，审查预算被保留下来。");
    recordEventResult(state, "暂不放行", "保持现状：不扩大供应链风险；获得：25 预算");
    goMap(state);
  }
}
