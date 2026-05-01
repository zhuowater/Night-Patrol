import {
  createGameState,
  startRun,
  chooseNode,
  playCard,
  endTurn,
  finishCinematic,
  takeRewardCard,
  goMap,
  resolveEvent,
  restHeal,
  openUpgrade,
  upgradeCard,
  buyShopCard,
  buyShopRelic,
  cardDef,
  cardName,
  cardText,
  intentText,
} from '../src/game/engine';
import { NODE_DEFS } from '../src/game/content';
import type { CardInstance, GameState, MapNode, NodeType } from '../src/game/types';

const state = createGameState();
state.seed = 1499616542; // deterministic playtest seed
startRun(state, 'normal');

const notes: string[] = [];
const combats: any[] = [];
const route: any[] = [];
const rewards: any[] = [];
const events: any[] = [];
const shops: any[] = [];
const rests: any[] = [];

function player() { if (!state.player) throw new Error('no player'); return state.player; }
function combat() { if (!state.combat) throw new Error('no combat'); return state.combat; }
function cdef(c: CardInstance) { return cardDef(c); }
function incomingDamage() {
  const c = state.combat; if (!c || !c.enemy.intent) return 0;
  const i = c.enemy.intent;
  const specFactor = 0.9; // normal difficulty from engine
  if (i.type === 'attack') return Math.max(1, Math.round(i.amount * specFactor) + c.enemy.strength) * (i.hits || 1);
  if (i.type === 'blockAttack') return Math.max(1, Math.round(i.amount * specFactor) + c.enemy.strength) * (i.hits || 1);
  return 0;
}
function scoreCard(card: CardInstance, phase: 'reward'|'shop'|'upgrade'='reward') {
  const id = card.id;
  const base: Record<string, number> = {
    citygod: 98, nightEye: 94, thunderLaw: 82,
    mirror: 88, command: 84, burn: 82, breakEvil: 76, thunder: 74,
    bell: 78, golden: 70, paper: 68, fog: 65,
    qingxin: 62, windScroll: 60, cloudstep: 58, ashReturn: 55, incense: 52,
    taomu: 46, scripture: 35, refine: 25,
    zhusha: 50, strike: 30, defend: 28,
  };
  let s = base[id] ?? 40;
  if (phase === 'upgrade') {
    const up: Record<string, number> = { zhusha: 100, citygod: 92, nightEye: 88, command: 86, mirror: 82, thunderLaw: 80, qingxin: 76, strike: 70, defend: 68, bell: 66, thunder: 64 };
    s = up[id] ?? s;
  }
  return s;
}
function chooseReward() {
  if (!state.reward) return;
  const choices = state.reward.cards.map(c => ({uid:c.uid, id:c.id, name: cardName(c), text: cardText(c), score: scoreCard(c)})).sort((a,b)=>b.score-a.score);
  rewards.push({floor: state.floor, title: state.reward.title, gold: state.reward.gold, relic: state.reward.relic?.name ?? null, choices, picked: choices[0]?.name});
  if (choices[0]) takeRewardCard(state, choices[0].uid); else goMap(state);
}
function chooseMapNode() {
  const avail = state.availableNodeIds.map(id => state.mapNodes.find(n=>n.id===id)!).filter(Boolean);
  function futureValue(n: MapNode, depth=2): number {
    const value: Record<NodeType, number> = { combat: 45, elite: 80, event: 50, rest: 45, shop: 54, boss: 999 };
    let v = value[n.type] ?? 0;
    if (player().hp < 45 && n.type === 'rest') v += 40;
    if (player().gold > 120 && n.type === 'shop') v += 20;
    if (depth <= 0) return v;
    const children = n.nextIds.map(id => state.mapNodes.find(x=>x.id===id)!).filter(Boolean);
    if (children.length) v += Math.max(...children.map(x => futureValue(x, depth-1))) * 0.45;
    return v;
  }
  const ranked = avail.map(n => ({n, score: futureValue(n)})).sort((a,b)=>b.score-a.score);
  const pick = ranked[0].n;
  route.push({floor: state.floor+1, nodeId: pick.id, nodeType: pick.type, nodeName: NODE_DEFS[pick.type].name, hp: `${player().hp}/${player().maxHp}`, gold: player().gold, options: ranked.map(r=>`${r.n.id}:${NODE_DEFS[r.n.type].name}:${r.score.toFixed(1)}`)});
  chooseNode(state, pick.id);
}
function playCombat() {
  const startHp = player().hp;
  const enemyStart = combat().enemy.name;
  const type = combat().type;
  const turnLogs: any[] = [];
  let guard = 0;
  while (state.screen === 'combat' && guard++ < 80) {
    const c = combat();
    const p = player();
    const e = c.enemy;
    const turn = c.turn;
    const before = {hp:p.hp, enemyHp:e.hp, block:p.block, energy:p.energy, intent:intentText(e.intent), seal:e.seal, weak:e.weak, hand:c.hand.map(cardName)};
    const actions: string[] = [];

    // First play free draw / setup / IOC enablers, then enough block, then damage/payoffs.
    let inner = 0;
    while (state.screen === 'combat' && inner++ < 30) {
      const c2 = combat(); const p2 = player(); const e2 = c2.enemy;
      const hand = [...c2.hand].filter(card => typeof cdef(card).cost === 'number' && (cdef(card).cost as number) <= p2.energy && !cdef(card).unplayable);
      if (!hand.length) break;
      const inc = incomingDamage();
      const lethal = hand.find(card => {
        const id = card.id;
        const text = cardText(card);
        // rough lethal candidates, just play attack/payoff if enemy low
        return ['strike','zhusha','taomu','thunder','burn','breakEvil','thunderLaw','paperBlade'].includes(id) && e2.hp <= 18;
      });
      let pick: CardInstance | undefined;
      if (lethal) pick = lethal;
      if (!pick) pick = hand.find(card => ['qingxin','windScroll','cloudstep','incense','refine'].includes(card.id) && (cdef(card).cost as number) === 0);
      if (!pick) pick = hand.find(card => ['nightEye','citygod'].includes(card.id));
      if (!pick && e2.seal === 0) pick = hand.find(card => ['mirror','command','zhusha'].includes(card.id));
      if (!pick && p2.block < inc) pick = hand.sort((a,b)=>scoreCard(b)-scoreCard(a)).find(card => ['defend','bell','golden','fog','paper','command','cloudstep','ashReturn'].includes(card.id));
      if (!pick) pick = hand.sort((a,b)=>scoreCard(b)-scoreCard(a)).find(card => ['burn','thunderLaw','breakEvil','thunder','taomu','strike','zhusha','paperBlade','mirror','command','bell','golden','fog'].includes(card.id));
      if (!pick) break;
      const name = cardName(pick);
      playCard(state, pick.uid);
      actions.push(name);
      if (state.screen !== 'combat') break;
      if (player().energy <= 0 && !combat().hand.some(card => typeof cdef(card).cost === 'number' && (cdef(card).cost as number) === 0 && !cdef(card).unplayable)) break;
    }
    if (state.screen !== 'combat') break;
    const afterPlay = {hp:p.hp, enemyHp:e.hp, block:p.block, energy:p.energy, seal:e.seal, weak:e.weak};
    endTurn(state);
    turnLogs.push({turn, before, actions, afterPlay, afterEnemy: state.combat ? {hp: player().hp, enemyHp: combat().enemy.hp, nextIntent: intentText(combat().enemy.intent), noise: [...combat().hand, ...combat().drawPile, ...combat().discardPile].filter(x=>x.id==='yinCold').length} : {screen: state.screen, hp: player().hp}});
  }
  combats.push({floor: state.floor, type, enemy: enemyStart, startHp, endHp: player().hp, result: state.screen, turns: turnLogs.length, turnLogs});
}
function handleCinematic() { if (state.screen === 'cinematic') finishCinematic(state); }
function handleEvent() {
  if (!state.event) return;
  const ev = state.event;
  let choice = ev.choices[0].id;
  if (ev.id === 'well') choice = player().hp <= 58 ? 'wellHeal' : 'wellRelic';
  if (ev.id === 'fox') choice = player().gold >= 80 && player().deck.length > 12 ? 'foxRemove' : 'foxCard';
  if (ev.id === 'temple') choice = 'templeUpgrade';
  if (ev.id === 'scholar') choice = player().deck.some(c=>!['basic','status'].includes(cdef(c).rarity)) ? 'scholarCopy' : 'scholarLeave';
  events.push({floor: state.floor, title: ev.title, body: ev.body, choices: ev.choices, picked: choice, hpBefore: player().hp, goldBefore: player().gold});
  resolveEvent(state, choice);
  if (state.screen === 'upgrade') handleUpgrade('event');
  if (state.screen === 'remove') handleRemove();
}
function handleUpgrade(source='rest') {
  const candidates = player().deck.filter(c=>!c.upgraded && cdef(c).rarity !== 'status').map(c=>({uid:c.uid, name:cardName(c), id:c.id, score:scoreCard(c,'upgrade')})).sort((a,b)=>b.score-a.score);
  const pick = candidates[0];
  rests.push({floor: state.floor, action: 'upgrade', source, picked: pick?.name, candidates: candidates.slice(0,5)});
  if (pick) upgradeCard(state, pick.uid); else goMap(state);
}
function handleRemove() {
  const priority: Record<string, number> = { yinCold:100, defend:80, strike:70, refine:50 };
  const candidates = player().deck.map(c=>({uid:c.uid, name:cardName(c), id:c.id, score:priority[c.id]??0})).sort((a,b)=>b.score-a.score);
  const pick = candidates[0];
  events.push({floor: state.floor, title:'remove', picked:pick?.name});
  // removeCard is intentionally not imported? avoid if not necessary
  goMap(state);
}
function handleRest() {
  if (player().hp <= 52) {
    rests.push({floor: state.floor, action:'heal', hpBefore: player().hp});
    restHeal(state);
  } else {
    openUpgrade(state, 'map');
    handleUpgrade('rest');
  }
}
function handleShop() {
  const s = state.shop!;
  const before = {gold: player().gold, deck: player().deck.length, relics: player().relics.map(r=>r.name)};
  const buys: string[] = [];
  // Buy relic if affordable and useful; otherwise buy best card if affordable.
  if (s.relic.relic && player().gold >= s.relic.cost) { buys.push(`工具:${s.relic.relic.name}`); buyShopRelic(state); }
  const ranked = s.cards.map((it,i)=>({i, name: cardName(it.card), id: it.card.id, cost: it.cost, score: scoreCard(it.card,'shop'), sold:it.sold})).sort((a,b)=>b.score-a.score);
  for (const item of ranked) {
    if (!state.shop) break;
    const cur = state.shop.cards[item.i];
    if (!cur.sold && player().gold >= cur.cost && scoreCard(cur.card,'shop') >= 58) { buys.push(`牌:${cardName(cur.card)}(${cur.cost})`); buyShopCard(state, item.i); }
  }
  shops.push({floor: state.floor, before, offerings: ranked, buys, after:{gold: player().gold, deck: player().deck.length, relics: player().relics.map(r=>r.name)}});
  goMap(state);
}

let loop = 0;
while (!['victory','gameover'].includes(state.screen) && loop++ < 100) {
  if (state.screen === 'map') chooseMapNode();
  else if (state.screen === 'combat') playCombat();
  else if (state.screen === 'cinematic') handleCinematic();
  else if (state.screen === 'reward') chooseReward();
  else if (state.screen === 'event') handleEvent();
  else if (state.screen === 'rest') handleRest();
  else if (state.screen === 'shop') handleShop();
  else if (state.screen === 'upgrade') handleUpgrade('unknown');
  else { notes.push(`Unhandled screen ${state.screen}`); break; }
}

const summary = {
  seed: 1499616542,
  difficulty: state.difficulty,
  result: state.screen,
  finalFloor: state.floor,
  hp: state.player ? `${state.player.hp}/${state.player.maxHp}` : null,
  gold: state.player?.gold,
  deckSize: state.player?.deck.length,
  deck: state.player?.deck.map(c=>cardName(c)),
  relics: state.player?.relics.map(r=>`${r.name}: ${r.text}`),
  route,
  combats,
  rewards,
  events,
  shops,
  rests,
  log: state.log,
  notes,
};
console.log(JSON.stringify(summary, null, 2));
