import { createCard } from "./cards";
import type { CombatState, EnemyState, GameState, PlayerState } from "../types";

export type AttackChainPreview = {
  riskForecast: string[];
  counterplayWindows: string[];
  bossPhase: null | {
    label: string;
    next: string;
    tone: "normal" | "pressure" | "final";
  };
  queryCacheStatus: string | null;
  ransomwareCountdown: null | {
    turnsRemaining: number;
    triggeringThisTurn: boolean;
    canCancel: boolean;
    computeNeeded: number;
  };
};

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

function countNoise(combat: CombatState) {
  return [...combat.hand, ...combat.drawPile, ...combat.discardPile].filter((card) => card.id === "yinCold").length;
}

function previewBossPhase(enemy: EnemyState): AttackChainPreview["bossPhase"] {
  if (!enemy.boss || !enemy.phases?.length) return null;
  const hpRatio = enemy.hp / enemy.maxHp;
  if (hpRatio <= 0.33) return { label: "三阶段 · 核心擦除", next: "终局压迫中", tone: "final" };
  if (hpRatio <= 0.66) return { label: "二阶段 · 横向扩散", next: "33% 以下进入最终擦除", tone: "pressure" };
  return { label: "一阶段 · 全盘加密", next: "66% 以下转入横向扩散", tone: "normal" };
}

export function previewAttackChain(state: GameState): AttackChainPreview {
  const combat = mustCombat(state);
  const player = mustPlayer(state);
  const enemy = combat.enemy;
  const chain = enemy.attackChain;
  const noiseCount = countNoise(combat);
  const riskForecast: string[] = [];
  const counterplayWindows: string[] = [];
  let ransomwareCountdown: AttackChainPreview["ransomwareCountdown"] = null;

  if (chain.includes("C2")) {
    if (combat.turn % 2 === 0) {
      riskForecast.push(`下次信标：${enemy.seal > 0 ? "本回合 IOC 拦截，噪声不增加" : "本回合结束触发，噪声 +1"}`);
      counterplayWindows.push(`C2：IOC ≥ 1 可拦截本轮信标${enemy.seal > 0 ? "（已满足）" : "（未满足）"}`);
    } else {
      riskForecast.push("下次信标：1 回合后注入噪声，可提前补 IOC 拦截");
      counterplayWindows.push(`C2：IOC ≥ 1 可拦截信标（${2 - (combat.turn % 2)} 回合后检查）`);
    }
  }

  if (chain.includes("凭据")) {
    if (noiseCount >= 2) riskForecast.push(`抽牌污染：${enemy.weak > 1 ? "敌方已降权，下次抽牌前清洗" : "已生效，下回合少抽 1 张"}`);
    else riskForecast.push(`抽牌污染：还差 ${2 - noiseCount} 张噪声触发${enemy.weak > 1 && noiseCount > 0 ? "，已降权会先清洗" : ""}`);
    if (noiseCount > 0) counterplayWindows.push(`凭据：敌方降权可在下次抽牌前清洗 ${noiseCount} 张噪声${enemy.weak > 1 ? "（已满足）" : "（建议降噪过滤）"}`);
    else counterplayWindows.push("凭据：敌方降权可清洗噪声（等待噪声出现）");
  }

  if (chain.includes("勒索")) {
    const triggeringThisTurn = combat.turn % 3 === 0;
    const turnsRemaining = triggeringThisTurn ? 0 : 3 - (combat.turn % 3);
    const canCancel = player.incense >= 2;
    ransomwareCountdown = { turnsRemaining, triggeringThisTurn, canCancel, computeNeeded: 2 };
    if (triggeringThisTurn) {
      riskForecast.push(`勒索倒计时：${canCancel ? "本回合算力恢复演练取消扣血" : "本回合结束扣 4 生命"}`);
      counterplayWindows.push(`勒索：算力 ≥ 2 可取消本轮倒计时${canCancel ? "（已满足）" : `（还差 ${2 - player.incense}）`}`);
    } else {
      riskForecast.push(`勒索倒计时：${turnsRemaining} 回合后触发，可存 2 算力取消`);
      counterplayWindows.push(`勒索：算力 ≥ 2 可取消倒计时（${turnsRemaining} 回合后检查）`);
    }
  }

  if (chain.includes("横向移动")) {
    const lateralTriggered = enemy.intent?.type === "attack";
    riskForecast.push(`横移失控：${enemy.weak > 0 ? "已降权，强度滚雪球暂停" : lateralTriggered ? "本轮攻击后强度 +1" : "本轮不触发，留意下一次攻击"}`);
    counterplayWindows.push(`横移：降权可冻结攻击后强度滚雪球${enemy.weak > 0 ? "（已满足）" : "（建议降噪过滤）"}`);
  }

  if (combat.turn % 2 === 0 && enemy.intent?.type !== "attack") counterplayWindows.push("非攻击回合：适合补 IOC / 算力，为下一次链路触发做反制。");

  return {
    riskForecast: riskForecast.length ? riskForecast : ["链路风险预告：暂无额外链路节奏，按当前意图处置。"],
    counterplayWindows: counterplayWindows.length ? counterplayWindows : ["当前攻击链没有额外反制窗口，按意图处置即可。"],
    bossPhase: previewBossPhase(enemy),
    queryCacheStatus: player.relics.some((relic) => relic.id === "blankPage") ? `查询缓存 ${combat.queryCacheProgress}/3` : null,
    ransomwareCountdown,
  };
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
