import { credentialDrawPenalty } from "./attackChain";
import { cardDef, cloneCard } from "./cards";
import { addLog, hasRelic, mustCombat, mustPlayer } from "./core";
import { drawCards } from "./deck";
import { DIFFICULTY_SPECS } from "./difficulty";
import { chooseEnemyIntent, enemyAttack, enemyTemplateFor, enemyTurn } from "./enemyAi";
import { shuffle } from "./rng";
import type { GameState, EnemyState } from "../types";

export function startCombat(state: GameState, type: "combat" | "elite" | "boss") {
  const template = enemyTemplateFor(state, type);
  const spec = DIFFICULTY_SPECS[state.difficulty];
  const floorScale = Math.max(0, state.floor - 1);
  const baseHp = template.hp + (type === "combat" ? floorScale * 4 : floorScale * 6);
  const hp = Math.max(1, Math.round(baseHp * spec.enemyHp));
  const enemy: EnemyState = {
    ...template,
    hp,
    maxHp: hp,
    block: 0,
    strength: 0,
    seal: 0,
    weak: 0,
    vulnerable: 0,
    intent: null,
  };

  const player = mustPlayer(state);
  state.combat = {
    type,
    enemy,
    drawPile: shuffle(state, player.deck.map((card) => cloneCard(state, card))),
    discardPile: [],
    exhaustPile: [],
    hand: [],
    turn: 0,
    cardsPlayedThisTurn: 0,
    attackPlayed: false,
    pulse: 0,
    hitTarget: null,
    lastInterruption: null,
    queryCacheProgress: 0,
  };
  player.block = 0;
  player.incense = 0;
  player.weak = 0;
  player.vulnerable = 0;
  player.powers = {};
  state.screen = "combat";
  if (hasRelic(state, "bronzeMirror")) applySeal(state, 2, false);
  chooseEnemyIntent(state);
  startPlayerTurn(state);
  addLog(state, `${enemy.name}出现在攻击路径中央。`);
  state.lastFx = type === "boss" ? "danger" : "none";
}

function startPlayerTurn(state: GameState) {
  const combat = mustCombat(state);
  const player = mustPlayer(state);
  combat.turn += 1;
  combat.cardsPlayedThisTurn = 0;
  combat.attackPlayed = false;
  player.block = 0;
  player.energy = player.maxEnergy;

  if (combat.turn === 1) {
    if (hasRelic(state, "paperHorse")) {
      player.energy += 1;
      addLog(state, "弹性算力池启动，第一回合能量 +1。");
    }
    if (hasRelic(state, "citySeal")) {
      player.incense += 2;
      addLog(state, "自动化剧本启动，获得 2 点算力。");
    }
    if (hasRelic(state, "oldUmbrella")) gainBlock(state, 6, "零信任策略");
  }

  if (player.powers.citygod) {
    gainBlock(state, player.powers.citygod, "自动化响应");
    player.incense += 1;
    addLog(state, "自动化响应维持防线，算力 +1。");
  }

  const drawCount = Math.max(
    1,
    5 +
      (player.powers.nightEye || 0) +
      (combat.turn === 1 && hasRelic(state, "nightSand") ? 1 : 0) -
      credentialDrawPenalty(state),
  );
  drawCards(state, drawCount);
}

export function gainBlock(state: GameState, amount: number, source = "防护") {
  mustPlayer(state).block += amount;
  addLog(state, `${source}获得 ${amount} 点防护。`);
  state.lastFx = "charge";
}

export function applySeal(state: GameState, amount: number, withLog = true) {
  const enemy = mustCombat(state).enemy;
  enemy.seal += amount;
  if (withLog) addLog(state, `${enemy.name}被标记 ${amount} 层 IOC。`);
}

export function applyWeak(state: GameState, amount: number) {
  const enemy = mustCombat(state).enemy;
  enemy.weak += amount;
  addLog(state, `${enemy.name}降权 ${amount} 回合。`);
}

export function applyVulnerable(state: GameState, amount: number) {
  const enemy = mustCombat(state).enemy;
  enemy.vulnerable += amount;
  addLog(state, `${enemy.name}暴露面 ${amount} 回合。`);
}

export function dealEnemyDamage(state: GameState, baseAmount: number, hits = 1, context: { firstAttackBonus?: boolean } = {}) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  let total = 0;
  for (let i = 0; i < hits; i += 1) {
    let amount = baseAmount;
    if (context.firstAttackBonus && i === 0) amount += 4;
    if (mustPlayer(state).weak > 0) amount = Math.floor(amount * 0.75);
    if (enemy.vulnerable > 0) amount = Math.floor(amount * 1.5);
    const blocked = Math.min(enemy.block, amount);
    enemy.block -= blocked;
    const dealt = amount - blocked;
    enemy.hp = Math.max(0, enemy.hp - dealt);
    total += dealt;
  }
  addLog(state, `造成 ${total} 点伤害。`);
  state.lastFx = "hit";
  combat.hitTarget = "enemy";
  combat.pulse += 1;
}

export function losePlayerHp(state: GameState, amount: number, source = "失去生命") {
  const player = mustPlayer(state);
  player.hp = Math.max(0, player.hp - amount);
  addLog(state, `${source}：失去 ${amount} 点生命。`);
  if (state.combat) {
    state.combat.hitTarget = "player";
    state.combat.pulse += 1;
  }
  state.lastFx = "impact";
  if (player.hp <= 0) {
    state.screen = "gameover";
    state.lastFx = "danger";
  }
}

export function endTurn(state: GameState) {
  const combat = mustCombat(state);
  const coldCount = combat.hand.filter((card) => card.id === "yinCold").length;
  if (coldCount > 0) losePlayerHp(state, coldCount * 2, "噪声拖慢响应");
  if (state.screen === "gameover") return;

  while (combat.hand.length) {
    const card = combat.hand.pop();
    if (!card) break;
    if (card.temp || cardDef(card).exhaust) combat.exhaustPile.push(card);
    else combat.discardPile.push(card);
  }
  enemyTurn(state, triggerSeal, startPlayerTurn);
}

export function triggerSeal(state: GameState) {
  const enemy = mustCombat(state).enemy;
  if (enemy.seal <= 0) return;
  const perLayer = 3 + (hasRelic(state, "thunderWood") ? 1 : 0);
  const damage = enemy.seal * perLayer;
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(state, `IOC 持续命中，造成 ${damage} 点伤害。`);
  enemy.seal = Math.max(0, enemy.seal - 1);
  state.lastFx = "fire";
  const combat = mustCombat(state);
  combat.hitTarget = "enemy";
  combat.pulse += 1;
}
