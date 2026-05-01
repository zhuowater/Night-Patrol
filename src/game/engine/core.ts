import { createCard } from "./cards";
import { startCombat } from "./combat";
import { DIFFICULTY_SPECS } from "./difficulty";
import { startEvent } from "./events";
import { startShop } from "./maintenance";
import { addRelic } from "./rewards";
import { generateRouteMap, nodeTrailLine } from "./map";
import type {
  CombatState,
  Difficulty,
  EnemyMove,
  GameState,
  MapNode,
  NodeType,
  PlayerState,
} from "../types";

export function createGameState(): GameState {
  return {
    screen: "title",
    difficulty: "normal",
    player: null,
    floor: 0,
    mapNodes: [],
    availableNodeIds: [],
    currentNodeId: null,
    visitedNodeIds: [],
    combat: null,
    cinematic: null,
    reward: null,
    event: null,
    shop: null,
    pendingRemove: null,
    pendingUpgrade: null,
    log: [],
    seed: Date.now() % 2147483647,
    nextCardUid: 1,
    lastFx: "none",
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState;
}

export function hpPercent(entity: { hp: number; maxHp: number }) {
  return `${Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100))}%`;
}

export function intentText(intent: EnemyMove | null) {
  if (!intent) return "活动未判定";
  if (intent.type === "attack") return `${intent.label}：攻击 ${intent.amount}${intent.hits ? ` x ${intent.hits}` : ""}`;
  if (intent.type === "block") return `${intent.label}：防护 ${intent.amount}`;
  if (intent.type === "buff") return `${intent.label}：强度 +${intent.amount}`;
  if (intent.type === "debuff") return `${intent.label}：令你降权 ${intent.amount}`;
  if (intent.type === "curse") return `${intent.label}：注入 ${intent.amount} 张噪声告警`;
  if (intent.type === "blockAttack") return `${intent.label}：防护 ${intent.block} 并攻击 ${intent.amount}`;
  return intent.label;
}

export function hasRelic(state: GameState, id: string) {
  return Boolean(state.player?.relics.some((relic) => relic.id === id));
}

export function addLog(state: GameState, message: string) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 9);
}

export function startRun(state: GameState, difficulty: Difficulty = "normal") {
  const spec = DIFFICULTY_SPECS[difficulty];
  const deck = [
    "strike",
    "strike",
    "strike",
    "defend",
    "defend",
    "defend",
    "zhusha",
    "windScroll",
    "cloudstep",
    "qingxin",
  ].map((id) => createCard(state, id));

  if (difficulty === "story") {
    deck.find((card) => card.id === "zhusha")!.upgraded = true;
    deck.find((card) => card.id === "windScroll")!.upgraded = true;
  }

  state.player = {
    name: "夜班 SOC 响应员",
    hp: spec.playerHp,
    maxHp: spec.playerHp,
    block: 0,
    energy: spec.maxEnergy,
    maxEnergy: spec.maxEnergy,
    incense: 0,
    gold: spec.gold,
    weak: 0,
    vulnerable: 0,
    powers: {},
    deck,
    relics: [],
  };
  state.difficulty = difficulty;
  spec.startingRelics.forEach((id) => addRelic(state, id));
  state.floor = 0;
  state.mapNodes = generateRouteMap(state);
  state.availableNodeIds = state.mapNodes.filter((node) => node.row === 0).map((node) => node.id);
  state.currentNodeId = null;
  state.visitedNodeIds = [];
  state.combat = null;
  state.cinematic = null;
  state.reward = null;
  state.event = null;
  state.shop = null;
  state.pendingRemove = null;
  state.pendingUpgrade = null;
  state.log = [];
  addLog(state, `难度：${spec.logName}。`);
  addLog(state, "凌晨 02:17，边界探针捕获异常握手。");
  addLog(state, "日志湖里出现横向移动的第一条细线。");
  addLog(state, "夜班控制台亮起，核心资产进入保护窗口。");
  state.screen = "map";
  state.lastFx = "reward";
}

export function chooseNode(state: GameState, nodeId: string) {
  if (!state.availableNodeIds.includes(nodeId)) return;
  const node = state.mapNodes.find((item) => item.id === nodeId);
  if (!node) return;
  state.currentNodeId = node.id;
  state.visitedNodeIds.push(node.id);
  state.availableNodeIds = node.nextIds;
  state.floor = node.row + 1;
  const type = node.type;
  addLog(state, nodeTrailLine(node));
  if (type === "combat" || type === "elite" || type === "boss") startCombat(state, type);
  if (type === "event") startEvent(state);
  if (type === "rest") {
    state.screen = "rest";
    addLog(state, "维护窗口打开，防线可以重新整备。");
  }
  if (type === "shop") startShop(state);
}

export function mustPlayer(state: GameState): PlayerState {
  if (!state.player) throw new Error("Player is not initialized");
  return state.player;
}

export function mustCombat(state: GameState): CombatState {
  if (!state.combat) throw new Error("Combat is not active");
  return state.combat;
}

export function goMap(state: GameState) {
  state.cinematic = null;
  state.reward = null;
  state.event = null;
  state.shop = null;
  state.pendingRemove = null;
  state.pendingUpgrade = null;
  state.screen = "map";
}
