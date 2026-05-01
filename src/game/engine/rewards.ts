import { CARD_POOL, RELICS } from "../content";
import { cardName, createCard } from "./cards";
import { DIFFICULTY_SPECS } from "./difficulty";
import { addLog, goMap, hasRelic, mustCombat, mustPlayer } from "./core";
import { int, pick, random, shuffle } from "./rng";
import type { CardInstance, EnemyState, GameState, RelicDef } from "../types";

export function winCombat(state: GameState) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  if (combat.type === "boss") {
    state.cinematic = createCinematicState(enemy, combat.type, "victory");
    state.combat = null;
    state.screen = "cinematic";
    addLog(state, "勒索链路被阻断，核心域控恢复控制。");
    state.lastFx = "reward";
    return;
  }

  const spec = DIFFICULTY_SPECS[state.difficulty];
  const gold = Math.round((int(state, 18, 32) + (combat.type === "elite" ? 18 : 0)) * spec.rewardGold);
  mustPlayer(state).gold += gold;
  let relic: RelicDef | null = null;
  if (combat.type === "elite" || random(state) > 0.8) relic = gainRandomRelic(state);
  state.reward = {
    title: `${enemy.name}退散`,
    gold,
    relic,
    cards: randomCardChoices(state, 3),
  };
  state.cinematic = createCinematicState(enemy, combat.type, "reward", {
    gold,
    relicName: relic?.name,
  });
  state.combat = null;
  state.screen = "cinematic";
  addLog(state, `获得 ${gold} 预算。`);
  state.lastFx = "reward";
}

export function createCinematicState(
  enemy: EnemyState,
  combatType: "combat" | "elite" | "boss",
  nextScreen: "reward" | "victory",
  rewardSummary?: { gold: number; relicName?: string },
) {
  const slug = combatType === "boss" ? `boss-${enemy.id}` : enemy.id;
  const title = combatType === "boss" ? `${enemy.name}已阻断` : combatType === "elite" ? `${enemy.name}已遏制` : `${enemy.name}已处置`;
  const subtitle =
    combatType === "boss"
      ? "核心域控恢复心跳，勒索倒计时被清零。"
      : combatType === "elite"
        ? "高危链路被切断，新的安全工具进入工具箱。"
        : "异常流量沉降，响应路径重新露出一截。";
  return {
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyArtKey: enemy.artKey,
    combatType,
    title,
    subtitle,
    videoUrl: `/assets/generated/cinematics/victory-${slug}.mp4`,
    posterUrl: `/assets/generated/cinematics/victory-${slug}-poster.png`,
    nextScreen,
    rewardSummary,
  };
}

export function finishCinematic(state: GameState) {
  const cinematic = state.cinematic;
  if (!cinematic) {
    if (state.reward) state.screen = "reward";
    return;
  }
  state.cinematic = null;
  state.screen = cinematic.nextScreen;
  state.lastFx = cinematic.nextScreen === "victory" ? "reward" : "none";
}

export function randomCardChoices(state: GameState, count: number) {
  const cards: CardInstance[] = [];
  const cycleIds = ["cloudstep", "qingxin", "windScroll", "fog", "ashReturn", "scripture", "refine", "nightEye"];
  const payoffIds = ["thunder", "burn", "breakEvil", "mirror", "command", "paper", "incense", "citygod"];
  const pool = shuffle(state, CARD_POOL);
  for (const id of pool) {
    if (cards.length >= count) break;
    cards.push(createCard(state, id));
  }
  if (cards.length >= 3 && !cards.some((card) => cycleIds.includes(card.id))) {
    const replacement = pick(state, cycleIds);
    cards[0] = createCard(state, replacement);
  }
  if (cards.length >= 3 && !cards.some((card) => payoffIds.includes(card.id))) {
    const replacement = pick(state, payoffIds);
    cards[1] = createCard(state, replacement);
  }
  if (cards.length === 1 && state.floor <= 3 && random(state) < 0.55) {
    cards[0] = createCard(state, pick(state, cycleIds));
  }
  return cards;
}

export function gainRandomRelic(state: GameState) {
  const owned = new Set(mustPlayer(state).relics.map((relic) => relic.id));
  const options = RELICS.filter((relic) => !owned.has(relic.id));
  if (options.length === 0) return null;
  const relic = pick(state, options);
  addRelic(state, relic.id);
  return relic;
}

export function addRelic(state: GameState, id: string) {
  const player = mustPlayer(state);
  const relic = RELICS.find((item) => item.id === id);
  if (!relic || hasRelic(state, id)) return null;
  player.relics.push(relic);
  addLog(state, `获得工具：${relic.name}。`);
  if (relic.onGain === "gold60") {
    player.gold += 60;
    addLog(state, "紧急预算到账 60 点。");
  }
  return relic;
}

export function takeRewardCard(state: GameState, uid: string) {
  const card = state.reward?.cards.find((item) => item.uid === uid);
  if (!card) return;
  mustPlayer(state).deck.push(createCard(state, card.id, card.upgraded));
  addLog(state, `获得响应动作：${cardName(card)}。`);
  goMap(state);
}
