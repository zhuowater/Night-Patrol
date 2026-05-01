import {
  buyShopCard,
  buyShopRelic,
  cardDef,
  cardName,
  cardText,
  chooseNode,
  createGameState,
  endTurn,
  finishCinematic,
  goMap,
  intentText,
  openUpgrade,
  playCard,
  resolveEvent,
  restHeal,
  startRun,
  takeRewardCard,
  upgradeCard,
} from '../src/game/engine';
import { NODE_DEFS } from '../src/game/content';
import type { CardInstance, Difficulty, GameState, MapNode, NodeType } from '../src/game/types';

type PlaytestResult = {
  seed: number;
  difficulty: Difficulty;
  result: GameState['screen'];
  finalFloor: number;
  hp: string | null;
  gold: number | undefined;
  deckSize: number | undefined;
  combats: Array<{ floor: number; type: string; enemy: string; startHp: number; endHp: number; result: GameState['screen']; turns: number }>;
  route: Array<{ floor: number; nodeId: string; nodeType: NodeType; nodeName: string; hp: string; gold: number }>;
  notes: string[];
};

const FIXTURES: Array<{
  difficulty: Difficulty;
  seed: number;
  expected: {
    result: GameState['screen'];
    finalFloor: number;
    minHp: number;
    minCombats: number;
  };
}> = [
  { difficulty: 'story', seed: 1499616542, expected: { result: 'victory', finalFloor: 8, minHp: 1, minCombats: 4 } },
  { difficulty: 'normal', seed: 1499616542, expected: { result: 'victory', finalFloor: 8, minHp: 1, minCombats: 4 } },
  { difficulty: 'hard', seed: 1499616542, expected: { result: 'victory', finalFloor: 8, minHp: 1, minCombats: 4 } },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runFixture(difficulty: Difficulty, seed: number): PlaytestResult {
  const state = createGameState();
  state.seed = seed;
  startRun(state, difficulty);

  const notes: string[] = [];
  const combats: PlaytestResult['combats'] = [];
  const route: PlaytestResult['route'] = [];

  const player = () => {
    if (!state.player) throw new Error('no player');
    return state.player;
  };
  const combat = () => {
    if (!state.combat) throw new Error('no combat');
    return state.combat;
  };
  const cdef = (card: CardInstance) => cardDef(card);

  function incomingDamage() {
    const c = state.combat;
    if (!c || !c.enemy.intent) return 0;
    const i = c.enemy.intent;
    const specFactor = difficulty === 'story' ? 0.72 : difficulty === 'hard' ? 1.08 : 0.9;
    if (i.type === 'attack') return Math.max(1, Math.round(i.amount * specFactor) + c.enemy.strength) * (i.hits || 1);
    if (i.type === 'blockAttack') return Math.max(1, Math.round(i.amount * specFactor) + c.enemy.strength) * (i.hits || 1);
    return 0;
  }

  function scoreCard(card: CardInstance, phase: 'reward' | 'shop' | 'upgrade' = 'reward') {
    const base: Record<string, number> = {
      citygod: 98,
      nightEye: 94,
      mirror: 88,
      command: 84,
      burn: 82,
      thunderLaw: 82,
      bell: 78,
      breakEvil: 76,
      thunder: 74,
      golden: 70,
      paper: 68,
      fog: 65,
      qingxin: 62,
      windScroll: 60,
      cloudstep: 58,
      ashReturn: 55,
      incense: 52,
      zhusha: 50,
      taomu: 46,
      refine: 25,
      strike: 30,
      defend: 28,
    };
    if (phase === 'upgrade') {
      const upgrade: Record<string, number> = {
        zhusha: 100,
        citygod: 92,
        nightEye: 88,
        command: 86,
        mirror: 82,
        thunderLaw: 80,
        qingxin: 76,
        strike: 70,
        defend: 68,
        bell: 66,
        thunder: 64,
      };
      return upgrade[card.id] ?? base[card.id] ?? 40;
    }
    return base[card.id] ?? 40;
  }

  function chooseReward() {
    if (!state.reward) return;
    const choices = state.reward.cards.map((card) => ({ uid: card.uid, score: scoreCard(card) })).sort((a, b) => b.score - a.score);
    if (choices[0]) takeRewardCard(state, choices[0].uid);
    else goMap(state);
  }

  function chooseMapNode() {
    const available = state.availableNodeIds.map((id) => state.mapNodes.find((node) => node.id === id)!).filter(Boolean);
    function futureValue(node: MapNode, depth = 2): number {
      const value: Record<NodeType, number> = { combat: 45, elite: 80, event: 50, rest: 45, shop: 54, boss: 999 };
      let score = value[node.type] ?? 0;
      if (player().hp < Math.round(player().maxHp * 0.55) && node.type === 'rest') score += 40;
      if (player().gold > 120 && node.type === 'shop') score += 20;
      if (depth <= 0) return score;
      const children = node.nextIds.map((id) => state.mapNodes.find((candidate) => candidate.id === id)!).filter(Boolean);
      if (children.length) score += Math.max(...children.map((child) => futureValue(child, depth - 1))) * 0.45;
      return score;
    }
    const pick = available.map((node) => ({ node, score: futureValue(node) })).sort((a, b) => b.score - a.score)[0]?.node;
    assert(pick, 'expected at least one available map node');
    route.push({
      floor: state.floor + 1,
      nodeId: pick.id,
      nodeType: pick.type,
      nodeName: NODE_DEFS[pick.type].name,
      hp: `${player().hp}/${player().maxHp}`,
      gold: player().gold,
    });
    chooseNode(state, pick.id);
  }

  function playCombat() {
    const startHp = player().hp;
    const enemyStart = combat().enemy.name;
    const type = combat().type;
    let turns = 0;
    let guard = 0;
    while (state.screen === 'combat' && guard++ < 80) {
      turns += 1;
      let inner = 0;
      while (state.screen === 'combat' && inner++ < 30) {
        const c = combat();
        const p = player();
        const e = c.enemy;
        const playable = [...c.hand].filter((card) => typeof cdef(card).cost === 'number' && (cdef(card).cost as number) <= p.energy && !cdef(card).unplayable);
        if (!playable.length) break;

        const incoming = incomingDamage();
        let pick = playable.find((card) => ['strike', 'zhusha', 'taomu', 'thunder', 'burn', 'breakEvil', 'thunderLaw', 'paperBlade'].includes(card.id) && e.hp <= 18);
        if (!pick) pick = playable.find((card) => ['qingxin', 'windScroll', 'cloudstep', 'incense', 'refine'].includes(card.id) && (cdef(card).cost as number) === 0);
        if (!pick) pick = playable.find((card) => ['nightEye', 'citygod'].includes(card.id));
        if (!pick && e.seal === 0) pick = playable.find((card) => ['mirror', 'command', 'zhusha'].includes(card.id));
        if (!pick && p.block < incoming) pick = playable.sort((a, b) => scoreCard(b) - scoreCard(a)).find((card) => ['defend', 'bell', 'golden', 'fog', 'paper', 'command', 'cloudstep', 'ashReturn'].includes(card.id));
        if (!pick) pick = playable.sort((a, b) => scoreCard(b) - scoreCard(a)).find((card) => ['burn', 'thunderLaw', 'breakEvil', 'thunder', 'taomu', 'strike', 'zhusha', 'paperBlade', 'mirror', 'command', 'bell', 'golden', 'fog'].includes(card.id));
        if (!pick) break;

        playCard(state, pick.uid);
        if (state.screen !== 'combat') break;
        if (player().energy <= 0 && !combat().hand.some((card) => typeof cdef(card).cost === 'number' && (cdef(card).cost as number) === 0 && !cdef(card).unplayable)) break;
      }
      if (state.screen === 'combat') endTurn(state);
    }

    combats.push({ floor: state.floor, type, enemy: enemyStart, startHp, endHp: player().hp, result: state.screen, turns });
  }

  function handleEvent() {
    if (!state.event) return;
    const ev = state.event;
    let choice = ev.choices[0].id;
    if (ev.id === 'well') choice = player().hp <= Math.round(player().maxHp * 0.7) ? 'wellHeal' : 'wellRelic';
    if (ev.id === 'fox') choice = player().gold >= 80 && player().deck.length > 12 ? 'foxRemove' : 'foxCard';
    if (ev.id === 'temple') choice = 'templeUpgrade';
    if (ev.id === 'scholar') choice = player().deck.some((card) => !['basic', 'status'].includes(cardDef(card).rarity)) ? 'scholarCopy' : 'scholarLeave';
    resolveEvent(state, choice);
    if (state.screen === 'upgrade') handleUpgrade();
    if (state.screen === 'remove') goMap(state);
  }

  function handleUpgrade() {
    const pick = player().deck
      .filter((card) => !card.upgraded && cardDef(card).rarity !== 'status')
      .map((card) => ({ uid: card.uid, score: scoreCard(card, 'upgrade') }))
      .sort((a, b) => b.score - a.score)[0];
    if (pick) upgradeCard(state, pick.uid);
    else goMap(state);
  }

  function handleRest() {
    if (player().hp <= Math.round(player().maxHp * 0.62)) restHeal(state);
    else {
      openUpgrade(state, 'map');
      handleUpgrade();
    }
  }

  function handleShop() {
    const shop = state.shop!;
    if (shop.relic.relic && player().gold >= shop.relic.cost) buyShopRelic(state);
    const ranked = shop.cards.map((item, index) => ({ index, score: scoreCard(item.card, 'shop') })).sort((a, b) => b.score - a.score);
    for (const item of ranked) {
      if (!state.shop) break;
      const current = state.shop.cards[item.index];
      if (!current.sold && player().gold >= current.cost && scoreCard(current.card, 'shop') >= 58) buyShopCard(state, item.index);
    }
    goMap(state);
  }

  let loop = 0;
  while (!['victory', 'gameover'].includes(state.screen) && loop++ < 100) {
    if (state.screen === 'map') chooseMapNode();
    else if (state.screen === 'combat') playCombat();
    else if (state.screen === 'cinematic') finishCinematic(state);
    else if (state.screen === 'reward') chooseReward();
    else if (state.screen === 'event') handleEvent();
    else if (state.screen === 'rest') handleRest();
    else if (state.screen === 'shop') handleShop();
    else if (state.screen === 'upgrade') handleUpgrade();
    else {
      notes.push(`Unhandled screen ${state.screen}`);
      break;
    }
  }

  return {
    seed,
    difficulty,
    result: state.screen,
    finalFloor: state.floor,
    hp: state.player ? `${state.player.hp}/${state.player.maxHp}` : null,
    gold: state.player?.gold,
    deckSize: state.player?.deck.length,
    combats,
    route,
    notes,
  };
}

for (const fixture of FIXTURES) {
  const result = runFixture(fixture.difficulty, fixture.seed);
  const hp = Number(result.hp?.split('/')[0] ?? 0);
  assert(result.result === fixture.expected.result, `${fixture.difficulty} expected ${fixture.expected.result}, got ${result.result}`);
  assert(result.finalFloor === fixture.expected.finalFloor, `${fixture.difficulty} expected floor ${fixture.expected.finalFloor}, got ${result.finalFloor}`);
  assert(hp >= fixture.expected.minHp, `${fixture.difficulty} expected hp >= ${fixture.expected.minHp}, got ${result.hp}`);
  assert(result.combats.length >= fixture.expected.minCombats, `${fixture.difficulty} expected at least ${fixture.expected.minCombats} combats, got ${result.combats.length}`);
  assert(result.notes.length === 0, `${fixture.difficulty} produced notes: ${result.notes.join('; ')}`);
  console.log(`✓ ${fixture.difficulty} playtest fixture: ${result.result} floor ${result.finalFloor}, hp ${result.hp}, combats ${result.combats.length}`);
}

console.log(`Playtest run check passed (${FIXTURES.length} fixtures).`);
