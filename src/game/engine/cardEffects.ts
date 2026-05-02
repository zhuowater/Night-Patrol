import { cardDef, cardName, createCard, value } from "./cards";
import {
  applySeal,
  applyVulnerable,
  applyWeak,
  dealEnemyDamage,
  gainBlock,
  losePlayerHp,
} from "./combat";
import { drawCards, recycleDiscardIntoDraw } from "./deck";
import { addLog, hasRelic, mustCombat, mustPlayer } from "./core";
import { winCombat } from "./rewards";
import type { CardDef, CardInstance, GameState } from "../types";

export type PlayCardCommand = {
  uid: string;
  targetId?: string;
};

export function attackFxForCard(card: CardInstance) {
  if (card.id === "thunder" || card.id === "thunderLaw") return "lightning";
  if (card.id === "zhusha" || card.id === "burn") return "fire";
  return "impact";
}

function normalizePlayCardCommand(command: PlayCardCommand | string): PlayCardCommand {
  return typeof command === "string" ? { uid: command } : command;
}

export function canPlayCard(state: GameState, command: PlayCardCommand | string) {
  const { uid } = normalizePlayCardCommand(command);
  const combat = state.combat;
  const player = state.player;
  if (!combat || !player) return false;
  const card = combat.hand.find((item) => item.uid === uid);
  if (!card) return false;
  const def = cardDef(card);
  return !def.unplayable && typeof def.cost === "number" && player.energy >= def.cost;
}

export function playCard(state: GameState, command: PlayCardCommand | string) {
  const { uid } = normalizePlayCardCommand(command);
  const combat = mustCombat(state);
  const player = mustPlayer(state);
  const index = combat.hand.findIndex((card) => card.uid === uid);
  if (index < 0) return;
  const card = combat.hand[index];
  const def = cardDef(card);
  if (def.unplayable || typeof def.cost !== "number" || player.energy < def.cost) return;

  player.energy -= def.cost;
  combat.hand.splice(index, 1);
  state.lastFx = "card";
  const context = {
    firstAttackBonus: def.type === "attack" && !combat.attackPlayed && hasRelic(state, "taomuTassel"),
  };
  resolveCard(state, card, context);
  if (state.screen === "gameover") return;
  if (def.type === "attack" && ["hit", "impact", "fire", "lightning"].includes(state.lastFx)) {
    state.lastFx = attackFxForCard(card);
  }

  if (def.type === "attack") combat.attackPlayed = true;
  if (def.type === "skill" && hasRelic(state, "brokenCenser")) gainBlock(state, 1, "WAF 补丁");
  recordAttackChainInterruption(state, card, def.type);

  combat.cardsPlayedThisTurn += 1;
  if (hasRelic(state, "blankPage")) {
    combat.queryCacheProgress = (combat.queryCacheProgress + 1) % 3;
    if (combat.queryCacheProgress === 0) {
      drawCards(state, 1);
      addLog(state, "查询缓存命中，抽 1 张牌。");
    } else {
      addLog(state, `查询缓存进度 ${combat.queryCacheProgress}/3。`);
    }
  }

  if (def.type === "power" || def.exhaust || card.temp) {
    combat.exhaustPile.push(card);
  } else {
    combat.discardPile.push(card);
  }

  if (combat.enemy.hp <= 0) winCombat(state);
}

export function recordAttackChainInterruption(state: GameState, card: CardInstance, type: CardDef["type"]) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  const chain = enemy.attackChain;
  let feedback: string | null = null;

  if (type === "attack") feedback = `${cardName(card)}主动打断：压低 ${chain} 的执行窗口。`;
  if (!feedback && enemy.seal > 0 && (type === "skill" || type === "power")) feedback = `${cardName(card)}主动打断：IOC 复核让 ${chain} 暂停扩散。`;
  if (!feedback && type === "skill" && mustPlayer(state).block > 0) feedback = `${cardName(card)}主动打断：防护窗口挡住 ${chain} 的下一跳。`;
  if (!feedback) return;

  combat.lastInterruption = feedback;
  addLog(state, feedback);
}

export function resolveCard(state: GameState, card: CardInstance, context: { firstAttackBonus?: boolean }) {
  const player = mustPlayer(state);
  const enemy = mustCombat(state).enemy;

  switch (card.id) {
    case "strike":
      dealEnemyDamage(state, value(card, 6, 9), 1, context);
      break;
    case "defend":
      gainBlock(state, value(card, 5, 8), cardName(card));
      break;
    case "zhusha":
      dealEnemyDamage(state, value(card, 4, 6), 1, context);
      applySeal(state, value(card, 1, 2));
      break;
    case "taomu":
      dealEnemyDamage(state, value(card, 4, 5), 2, context);
      break;
    case "cloudstep":
      gainBlock(state, value(card, 3, 5), cardName(card));
      drawCards(state, 1);
      break;
    case "qingxin":
      drawCards(state, value(card, 2, 3));
      addLog(state, `${cardName(card)}抽牌后归档，避免重复检索循环。`);
      break;
    case "golden":
      gainBlock(state, value(card, 8, 11), cardName(card));
      player.incense += 1;
      addLog(state, "临时算力 +1。");
      break;
    case "incense":
      player.incense += value(card, 2, 3);
      addLog(state, `临时算力 +${value(card, 2, 3)}。`);
      break;
    case "windScroll":
      drawCards(state, 1 + (enemy.seal > 0 ? value(card, 1, 2) : 0));
      addLog(state, `${cardName(card)}拉起关联视图。`);
      break;
    case "thunder":
      dealEnemyDamage(state, value(card, 10, 14), 1, context);
      if (enemy.seal > 0) dealEnemyDamage(state, value(card, 6, 8));
      break;
    case "bell":
      gainBlock(state, value(card, 3, 5), cardName(card));
      applyWeak(state, value(card, 2, 3));
      break;
    case "fog":
      gainBlock(state, value(card, 6, 9), cardName(card));
      drawCards(state, 1);
      break;
    case "command":
      gainBlock(state, value(card, 4, 6), cardName(card));
      applySeal(state, value(card, 4, 5));
      break;
    case "burn": {
      const layers = enemy.seal;
      enemy.seal = 0;
      if (layers > 0) {
        dealEnemyDamage(state, layers * value(card, 5, 7));
        addLog(state, `溯源消耗 ${layers} 层 IOC。`);
      } else {
        addLog(state, "溯源链为空，没有 IOC 可消耗。");
      }
      break;
    }
    case "paper":
      gainBlock(state, value(card, 7, 10), cardName(card));
      mustCombat(state).hand.push(createCard(state, "paperBlade", card.upgraded, true));
      addLog(state, "蜜罐触发，回刺动作加入手牌。");
      break;
    case "breakEvil":
      dealEnemyDamage(state, value(card, 14, 18), 1, context);
      if (enemy.seal > 0) {
        player.energy += 1;
        addLog(state, "规则命中 IOC，响应算力 +1。");
      }
      break;
    case "mirror":
      applySeal(state, value(card, 2, 3));
      applyVulnerable(state, 2);
      break;
    case "refine":
      player.energy += 1;
      losePlayerHp(state, value(card, 2, 1), cardName(card));
      break;
    case "scripture":
      drawCards(state, value(card, 3, 4));
      mustCombat(state).discardPile.push(createCard(state, "yinCold"));
      addLog(state, "深度扫描完成，噪声告警也进入弃牌堆。");
      break;
    case "ashReturn":
      recycleDiscardIntoDraw(state);
      drawCards(state, value(card, 1, 2));
      gainBlock(state, value(card, 4, 6), cardName(card));
      break;
    case "nightEye":
      player.powers.nightEye = 1;
      addLog(state, "持续监控开启，每回合多抽 1 张牌。");
      if (card.upgraded) drawCards(state, 1);
      break;
    case "citygod":
      player.powers.citygod = value(card, 3, 5);
      addLog(state, "自动化响应上线，本场战斗每回合加固防线。");
      break;
    case "thunderLaw": {
      const spent = player.incense;
      player.incense = 0;
      dealEnemyDamage(state, value(card, 12, 16) + spent * value(card, 5, 6), 1, context);
      addLog(state, `全域清剿消耗 ${spent} 点临时算力。`);
      break;
    }
    case "paperBlade":
      dealEnemyDamage(state, value(card, 3, 5), 1, context);
      break;
  }
}
