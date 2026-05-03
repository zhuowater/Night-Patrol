import * as fs from "node:fs";
import { chooseNode, createGameState, dealEnemyDamage, endTurn, resolveEvent, startRun, takeRewardCard, upgradeCard, winCombat } from "../src/game/engine";
import { EVENTS, NODE_DEFS } from "../src/game/content";

const failures: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

const state = createGameState();
const summary = state.runSummary;
assert(Boolean(summary), "GameState.runSummary is missing");
assert(Array.isArray(summary?.route), "runSummary.route must be an array");
assert(Array.isArray(summary?.combats), "runSummary.combats must be an array");
assert(Array.isArray(summary?.events), "runSummary.events must be an array");
assert(Array.isArray(summary?.rewardsTaken), "runSummary.rewardsTaken must be an array");
assert(Array.isArray(summary?.relicsGained), "runSummary.relicsGained must be an array");

const routeRun = createGameState();
routeRun.seed = 1499616542;
startRun(routeRun, "normal");
const firstNodeId = routeRun.availableNodeIds[0];
const firstNode = routeRun.mapNodes.find((node) => node.id === firstNodeId)!;
chooseNode(routeRun, firstNodeId);
assert(routeRun.runSummary.route.length === 1, "choosing a node should append one route summary item");
assert(routeRun.runSummary.route[0]?.nodeName === NODE_DEFS[firstNode.type].name, "route summary should store node display name");

const combatRun = createGameState();
combatRun.seed = 1499616543;
startRun(combatRun, "normal");
chooseNode(combatRun, combatRun.availableNodeIds[0]);
assert(combatRun.combat?.summary?.startHp === combatRun.player?.maxHp, "combat summary should store start HP");
if (combatRun.combat) {
  dealEnemyDamage(combatRun, combatRun.combat.enemy.hp);
  winCombat(combatRun);
}
assert(combatRun.runSummary.combats.length >= 1, "winning combat should append combat summary");
const firstCombat = combatRun.runSummary.combats[0];
assert(Boolean(firstCombat?.enemyName), "combat summary should store enemyName");
assert((firstCombat?.turns ?? 0) > 0, "combat summary should store turns");
assert((firstCombat?.startHp ?? 0) > 0, "combat summary should store startHp");
assert((firstCombat?.maxDamageDealt ?? 0) > 0, "combat summary should store maxDamageDealt");

const deathRun = createGameState();
deathRun.seed = 1499616544;
startRun(deathRun, "normal");
chooseNode(deathRun, deathRun.availableNodeIds[0]);
if (deathRun.combat) deathRun.player!.hp = 1;
endTurn(deathRun);
if (deathRun.screen === "gameover") {
  assert(deathRun.runSummary.combats.length >= 1, "gameover should append combat summary");
  assert(Boolean(deathRun.runSummary.causeHint), "gameover should infer causeHint");
}

const eventRun = createGameState();
eventRun.seed = 1499616545;
startRun(eventRun, "normal");
eventRun.floor = 2;
eventRun.event = EVENTS.find((event) => event.id === "scholar")!;
eventRun.screen = "event";
resolveEvent(eventRun, "scholarLeave");
assert(eventRun.runSummary.events.length === 1, "resolveEvent should append event summary");
assert(eventRun.runSummary.events[0]?.choiceTitle === "暂不放行", "event summary should store choice title");
assert(eventRun.player!.gold === 90, "scholarLeave should grant cautious review budget");
assert(eventRun.runSummary.events[0]?.result.includes("25 预算"), "scholarLeave summary should mention budget compensation");

const upgradeRun = createGameState();
upgradeRun.seed = 1499616547;
startRun(upgradeRun, "normal");
upgradeRun.event = EVENTS.find((event) => event.id === "temple")!;
upgradeRun.screen = "event";
resolveEvent(upgradeRun, "templeUpgrade");
assert(upgradeRun.player!.gold === 85, "templeUpgrade should grant a small playbook maintenance budget");
const basicToUpgrade = upgradeRun.player!.deck.find((item) => item.id === "strike")!;
upgradeCard(upgradeRun, basicToUpgrade.uid);
const upgradedCard = upgradeRun.player!.deck.find((item) => item.uid === basicToUpgrade.uid)!;
assert(upgradedCard.upgraded, "templeUpgrade should still allow upgrading a selected card");
assert(upgradeRun.runSummary.events[0]?.result.includes("20 预算"), "templeUpgrade summary should mention budget compensation");

const foxRun = createGameState();
foxRun.seed = 1499616548;
startRun(foxRun, "normal");
foxRun.event = EVENTS.find((event) => event.id === "fox")!;
foxRun.screen = "event";
const foxDeckBefore = foxRun.player!.deck.length;
resolveEvent(foxRun, "foxCard");
assert(foxRun.player!.deck.length === foxDeckBefore + 2, "foxCard should convert two samples into two cards");
assert(foxRun.runSummary.events[0]?.result.includes("2 张"), "foxCard summary should mention two sample cards");

const rewardRun = createGameState();
rewardRun.seed = 1499616546;
startRun(rewardRun, "normal");
chooseNode(rewardRun, rewardRun.availableNodeIds[0]);
if (rewardRun.combat) {
  dealEnemyDamage(rewardRun, rewardRun.combat.enemy.hp);
  winCombat(rewardRun);
}
const card = rewardRun.reward?.cards[0];
if (card) takeRewardCard(rewardRun, card.uid);
assert(rewardRun.runSummary.rewardsTaken.length === 1, "takeRewardCard should append card reward summary");
assert(Boolean(rewardRun.runSummary.rewardsTaken[0]?.cardName), "card reward summary should store cardName");

const shell = fs.readFileSync("src/ui/shell.tsx", "utf8");
const panel = fs.existsSync("src/ui/RunSummaryPanel.tsx") ? fs.readFileSync("src/ui/RunSummaryPanel.tsx", "utf8") : "";
const app = fs.readFileSync("src/App.tsx", "utf8");
assert(Boolean(panel), "RunSummaryPanel must exist");
assert(shell.includes("RunSummaryPanel"), "EndScreen should reference RunSummaryPanel");
assert(app.includes("game={game}") && app.includes('variant="gameover"'), "gameover EndScreen should receive game and variant");
assert(`${shell}\n${panel}`.includes("本局 SOC 复盘"), "run summary UI should include 本局 SOC 复盘");
assert(`${shell}\n${panel}`.includes("下一局"), "run summary UI should include 下一局 advice");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("run summary checks passed");
