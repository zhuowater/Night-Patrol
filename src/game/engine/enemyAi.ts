import { ENEMIES } from "../content";
import { applyAttackChainPressure } from "./attackChain";
import { createCard } from "./cards";
import { DIFFICULTY_SPECS } from "./difficulty";
import { addLog, mustCombat, mustPlayer } from "./core";
import { winCombat } from "./rewards";
import { pick } from "./rng";
import type { GameState } from "../types";

export function enemyFor(state: GameState, type: "combat" | "elite" | "boss") {
  if (type === "boss") return "tigerlord";
  if (type === "elite") return pick(state, ["warlock", "foxshade"]);
  if (state.floor <= 1) return pick(state, ["lantern", "waterghost"]);
  if (state.floor <= 3) return pick(state, ["lantern", "waterghost", "templecorpse"]);
  return pick(state, ["lantern", "waterghost", "templecorpse", "macaque"]);
}

export function chooseEnemyIntent(state: GameState) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  const phase = enemy.phases
    ?.filter((candidate) => enemy.hp <= enemy.maxHp * candidate.hpBelow)
    .sort((a, b) => a.hpBelow - b.hpBelow)[0];
  const moves = phase?.moves ?? enemy.moves;
  enemy.intent = pick(state, moves);
  if (phase && combat.turn > 0) addLog(state, `Boss 阶段切换：${phase.label}。`);
}

export function enemyAttack(state: GameState, base: number, hits = 1) {
  const player = mustPlayer(state);
  const combat = mustCombat(state);
  const spec = DIFFICULTY_SPECS[state.difficulty];
  let total = 0;
  for (let i = 0; i < hits; i += 1) {
    let amount = Math.max(1, Math.round(base * spec.enemyDamage)) + combat.enemy.strength;
    if (combat.enemy.weak > 0) amount = Math.floor(amount * 0.75);
    const blocked = Math.min(player.block, amount);
    player.block -= blocked;
    const dealt = amount - blocked;
    player.hp = Math.max(0, player.hp - dealt);
    total += dealt;
  }
  addLog(state, `${combat.enemy.name}造成 ${total} 点伤害。`);
  state.lastFx = "impact";
  combat.hitTarget = "player";
  combat.pulse += 1;
  if (player.hp <= 0) state.screen = "gameover";
}

export function enemyTurn(state: GameState, triggerSeal: (state: GameState) => void, startPlayerTurn: (state: GameState) => void) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  triggerSeal(state);
  if (enemy.hp <= 0) {
    winCombat(state);
    return;
  }

  const intent = enemy.intent;
  if (!intent) return;
  if (intent.type === "attack") enemyAttack(state, intent.amount, intent.hits || 1);
  if (intent.type === "block") {
    enemy.block += intent.amount;
    addLog(state, `${enemy.name}获得 ${intent.amount} 点防护。`);
    state.lastFx = "charge";
  }
  if (intent.type === "buff") {
    enemy.strength += intent.amount;
    addLog(state, `${enemy.name}攻击强度 +${intent.amount}。`);
    state.lastFx = "danger";
  }
  if (intent.type === "debuff") {
    mustPlayer(state).weak += intent.amount;
    addLog(state, `${enemy.name}令你降权 ${intent.amount} 回合。`);
    state.lastFx = "danger";
  }
  if (intent.type === "curse") {
    for (let i = 0; i < intent.amount; i += 1) combat.discardPile.push(createCard(state, "yinCold"));
    addLog(state, `${enemy.name}将 ${intent.amount} 张噪声告警注入弃牌堆。`);
    state.lastFx = "danger";
  }
  if (intent.type === "blockAttack") {
    enemy.block += intent.block || 0;
    addLog(state, `${enemy.name}获得 ${intent.block || 0} 点防护。`);
    enemyAttack(state, intent.amount, intent.hits || 1);
  }

  if (state.screen === "gameover") return;
  applyAttackChainPressure(state);
  if (state.screen !== "combat") return;

  enemy.weak = Math.max(0, enemy.weak - 1);
  enemy.vulnerable = Math.max(0, enemy.vulnerable - 1);
  const player = mustPlayer(state);
  player.weak = Math.max(0, player.weak - 1);
  player.vulnerable = Math.max(0, player.vulnerable - 1);

  if (player.hp <= 0) {
    state.screen = "gameover";
    return;
  }
  chooseEnemyIntent(state);
  startPlayerTurn(state);
}

export function enemyTemplateFor(state: GameState, type: "combat" | "elite" | "boss") {
  return ENEMIES[enemyFor(state, type)];
}
