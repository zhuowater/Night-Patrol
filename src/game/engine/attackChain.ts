import { createCard } from "./cards";
import type { CombatState, GameState, PlayerState } from "../types";

function mustPlayer(state: GameState): PlayerState {
  if (!state.player) throw new Error("Player is not initialized");
  return state.player;
}

function mustCombat(state: GameState): CombatState {
  if (!state.combat) throw new Error("Combat is not active");
  return state.combat;
}

function addLog(state: GameState, message: string) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 9);
}

function losePlayerHp(state: GameState, amount: number, source = "失去生命") {
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

export function credentialDrawPenalty(state: GameState) {
  const combat = mustCombat(state);
  if (!combat.enemy.attackChain.includes("凭据")) return 0;
  if (applyAttackChainCounterplay(state, "credential")) return 0;
  const noiseCount = [...combat.drawPile, ...combat.discardPile, ...combat.hand].filter((card) => card.id === "yinCold").length;
  if (noiseCount < 2) return 0;
  addLog(state, "凭据喷洒污染抽牌：噪声告警挤占 triage 窗口，少抽 1 张牌。");
  return 1;
}

export function applyAttackChainCounterplay(state: GameState, trigger: "c2" | "credential" | "ransomware") {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  const player = mustPlayer(state);

  if (trigger === "c2" && enemy.seal > 0) {
    enemy.seal = Math.max(0, enemy.seal - 1);
    combat.lastInterruption = "C2 追踪拦截：消耗 1 层 IOC，阻断本轮信标噪声。";
    addLog(state, combat.lastInterruption);
    state.lastFx = "fire";
    return true;
  }

  if (trigger === "credential" && enemy.weak > 1) {
    const before = combat.discardPile.length + combat.drawPile.length + combat.hand.length;
    combat.discardPile = combat.discardPile.filter((card) => card.id !== "yinCold");
    combat.drawPile = combat.drawPile.filter((card) => card.id !== "yinCold");
    combat.hand = combat.hand.filter((card) => card.id !== "yinCold");
    const after = combat.discardPile.length + combat.drawPile.length + combat.hand.length;
    if (before === after) return false;
    combat.lastInterruption = "凭据隔离清洗：持续降权窗口移除噪声告警，避免抽牌污染。";
    addLog(state, combat.lastInterruption);
    state.lastFx = "block";
    return true;
  }

  if (trigger === "ransomware" && player.incense >= 2) {
    player.incense -= 2;
    combat.lastInterruption = "勒索恢复演练：消耗 2 点算力回滚快照，取消本轮倒计时伤害。";
    addLog(state, combat.lastInterruption);
    state.lastFx = "block";
    return true;
  }

  return false;
}

export function applyAttackChainPressure(state: GameState) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  const chain = enemy.attackChain;
  if (chain.includes("C2") && combat.turn % 2 === 0) {
    if (!applyAttackChainCounterplay(state, "c2")) {
      combat.discardPile.push(createCard(state, "yinCold"));
      addLog(state, "C2 信标回连：攻击者周期性下发任务，噪声告警 +1。");
      state.lastFx = "danger";
    }
  }
  if (chain.includes("横向移动") && enemy.intent?.type === "attack" && !enemy.weak) {
    enemy.strength += 1;
    addLog(state, "横向移动扩大落点：未降权的多点探测让后续强度 +1。");
    state.lastFx = "danger";
  }
  if (chain.includes("勒索") && combat.turn % 3 === 0 && !applyAttackChainCounterplay(state, "ransomware")) {
    losePlayerHp(state, 4, "勒索倒计时");
  }
}
