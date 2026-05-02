import { chooseEnemyIntent, createGameState, endTurn, finishCinematic, hasSeenGuidance, markGuidanceSeen, playCard, previewAttackChain, previewUpgradeDelta, recommendTurnAction, resolveEvent, startRun, cardThreatHint } from '../src/game/engine';
import { ENEMIES, EVENTS } from '../src/game/content';
import type { CardInstance, GameState } from '../src/game/types';

type Scenario = {
  name: string;
  run: () => void;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeCard(state: GameState, id: string): CardInstance {
  return { uid: `scenario-${state.nextCardUid++}`, id, upgraded: false };
}

function setupCombat(enemyId: keyof typeof ENEMIES) {
  const state = createGameState();
  state.seed = 20260501;
  startRun(state, 'normal');
  const firstNode = state.availableNodeIds[0];
  state.currentNodeId = firstNode;
  state.visitedNodeIds.push(firstNode);
  state.availableNodeIds = [];
  state.floor = 1;

  const template = ENEMIES[enemyId];
  state.combat = {
    type: template.boss ? 'boss' : template.elite ? 'elite' : 'combat',
    enemy: {
      ...template,
      hp: template.hp,
      maxHp: template.hp,
      block: 0,
      strength: 0,
      seal: 0,
      weak: 0,
      vulnerable: 0,
      intent: { type: 'block', amount: 0, label: '等待' },
    },
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    hand: [],
    turn: 2,
    cardsPlayedThisTurn: 0,
    attackPlayed: false,
    pulse: 0,
    hitTarget: null,
    lastInterruption: null,
    queryCacheProgress: 0,
  };
  state.screen = 'combat';
  state.player!.hp = 50;
  state.player!.maxHp = 50;
  state.player!.block = 0;
  state.player!.energy = 3;
  state.player!.maxEnergy = 3;
  state.player!.incense = 0;
  state.player!.weak = 0;
  state.player!.vulnerable = 0;
  state.player!.powers = {};
  return state;
}

function countNoise(state: GameState) {
  const combat = state.combat;
  assert(combat, 'combat should be active');
  return [...combat.drawPile, ...combat.discardPile, ...combat.hand].filter((card) => card.id === 'yinCold').length;
}

const scenarios: Scenario[] = [
  {
    name: 'guidance state initializes and tolerates legacy missing field',
    run: () => {
      const state = createGameState();
      assert(hasSeenGuidance(state, 'firstCombat') === false, 'fresh guidance should not mark first combat seen');
      markGuidanceSeen(state, 'firstCombat');
      assert(hasSeenGuidance(state, 'firstCombat') === true, 'markGuidanceSeen should persist cue state');
      delete state.guidance;
      markGuidanceSeen(state, 'firstC2');
      assert(hasSeenGuidance(state, 'firstC2') === true, 'legacy states without guidance should be upgraded');
      startRun(state, 'normal');
      assert(hasSeenGuidance(state, 'firstCombat') === false, 'new runs should reset guidance');
    },
  },
  {
    name: 'turn recommendation prioritizes defense and C2 IOC windows',
    run: () => {
      const defenseState = setupCombat('lantern');
      defenseState.combat!.enemy.intent = { type: 'attack', amount: 8, label: '入侵打点' };
      defenseState.combat!.hand = [makeCard(defenseState, 'defend')];
      const defense = recommendTurnAction({ combat: defenseState.combat!, player: defenseState.player! });
      assert(defense?.priority === 'defense', `expected defense recommendation, got ${defense?.priority}`);

      const c2State = setupCombat('warlock');
      c2State.combat!.hand = [makeCard(c2State, 'zhusha')];
      const c2 = recommendTurnAction({ combat: c2State.combat!, player: c2State.player! });
      assert(c2?.priority === 'counter' && c2.title.includes('IOC'), `expected IOC counter recommendation, got ${c2?.title}`);
    },
  },
  {
    name: 'lethal IOC damage wins before enemy intent resolves',
    run: () => {
      const state = setupCombat('lantern');
      const combat = state.combat!;
      combat.enemy.hp = 3;
      combat.enemy.seal = 1;
      combat.enemy.intent = { type: 'attack', amount: 99, label: 'should not fire' };
      endTurn(state);
      assert(state.screen === 'cinematic', `expected cinematic victory, got ${state.screen}`);
      assert(state.player!.hp === 50, 'enemy intent should not hit after lethal IOC tick');
      finishCinematic(state);
      const screenAfterCinematic = state.screen as GameState['screen'];
      assert(screenAfterCinematic === 'reward', `expected reward after cinematic, got ${screenAfterCinematic}`);
    },
  },
  {
    name: 'C2 even turn consumes IOC and prevents beacon noise',
    run: () => {
      const state = setupCombat('warlock');
      const combat = state.combat!;
      combat.turn = 2;
      combat.enemy.seal = 2;
      endTurn(state);
      assert(state.screen === 'combat', `expected combat to continue, got ${state.screen}`);
      assert(combat.discardPile.filter((card) => card.id === 'yinCold').length === 0, 'C2 counterplay should prevent new beacon noise');
      assert(combat.lastInterruption?.includes('C2 追踪拦截'), 'C2 counterplay interruption missing');
    },
  },
  {
    name: 'C2 even turn injects noise without IOC',
    run: () => {
      const state = setupCombat('warlock');
      state.combat!.turn = 2;
      endTurn(state);
      assert(state.screen === 'combat', `expected combat to continue, got ${state.screen}`);
      assert(countNoise(state) === 1, `expected one total C2 beacon noise, got ${countNoise(state)}`);
      assert(state.log.some((line) => line.includes('C2 信标回连')), 'C2 pressure log missing');
    },
  },
  {
    name: 'credential chain weak window cleans noise before draw penalty',
    run: () => {
      const state = setupCombat('waterghost');
      const combat = state.combat!;
      combat.turn = 0;
      combat.enemy.weak = 3;
      combat.drawPile = [makeCard(state, 'yinCold'), makeCard(state, 'yinCold'), makeCard(state, 'strike'), makeCard(state, 'defend'), makeCard(state, 'qingxin')];
      combat.discardPile = [makeCard(state, 'yinCold')];
      endTurn(state);
      assert(state.screen === 'combat', `expected combat to continue, got ${state.screen}`);
      assert(countNoise(state) === 0, `credential counterplay should clean all noise, got ${countNoise(state)}`);
      assert(state.log.some((line) => line.includes('凭据隔离清洗')), 'credential cleanup log missing');
    },
  },
  {
    name: 'ransomware countdown consumes compute and cancels HP loss',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 3;
      state.player!.incense = 2;
      endTurn(state);
      assert(state.screen === 'combat', `expected combat to continue, got ${state.screen}`);
      assert(state.player!.hp === 50, `ransomware counterplay should cancel HP loss, hp=${state.player!.hp}`);
      assert(state.player!.incense === 0, `ransomware counterplay should consume compute, incense=${state.player!.incense}`);
      assert(state.log.some((line) => line.includes('勒索恢复演练')), 'ransomware recovery log missing');
    },
  },
  {
    name: 'ransomware countdown damages player without compute',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 3;
      state.player!.incense = 0;
      endTurn(state);
      assert(state.screen === 'combat', `expected combat to continue, got ${state.screen}`);
      assert(state.player!.hp === 46, `expected 4 HP ransomware loss, hp=${state.player!.hp}`);
    },
  },
  {
    name: 'qingxin zero-cost draw exhausts to prevent repeat-loop abuse',
    run: () => {
      const state = setupCombat('lantern');
      const combat = state.combat!;
      combat.drawPile = [makeCard(state, 'strike'), makeCard(state, 'defend'), makeCard(state, 'zhusha')];
      combat.hand = [makeCard(state, 'qingxin')];
      state.player!.energy = 3;
      const card = combat.hand[0];
      playCard(state, card.uid);
      assert(state.player!.energy === 3, `qingxin should remain zero cost, energy=${state.player!.energy}`);
      assert(combat.hand.length === 2, `base qingxin should draw two cards before exhausting, hand=${combat.hand.length}`);
      assert(combat.exhaustPile.some((item) => item.id === 'qingxin'), 'qingxin should exhaust after play');
      assert(!combat.discardPile.some((item) => item.id === 'qingxin'), 'qingxin should not re-enter discard loop');
    },
  },
  {
    name: 'query cache tracks visible progress and draws every third played card',
    run: () => {
      const state = setupCombat('lantern');
      const combat = state.combat!;
      state.player!.relics.push({ id: 'blankPage', name: '查询缓存', text: '每回合每打出 3 张牌，抽 1 张牌。' });
      state.player!.energy = 3;
      combat.hand = [makeCard(state, 'defend'), makeCard(state, 'defend'), makeCard(state, 'defend')];
      combat.drawPile = [makeCard(state, 'strike')];
      playCard(state, combat.hand[0].uid);
      const progressAfterFirst = combat.queryCacheProgress;
      assert(progressAfterFirst === 1, `expected cache progress 1, got ${progressAfterFirst}`);
      assert(!combat.hand.some((card) => card.id === 'strike'), 'query cache should not draw before third card');
      playCard(state, combat.hand[0].uid);
      const progressAfterSecond = combat.queryCacheProgress;
      assert(progressAfterSecond === 2, `expected cache progress 2, got ${progressAfterSecond}`);
      playCard(state, combat.hand[0].uid);
      const progressAfterThird = combat.queryCacheProgress;
      assert(progressAfterThird === 0, `expected cache progress reset after draw, got ${progressAfterThird}`);
      assert(combat.hand.some((card) => card.id === 'strike'), 'query cache should draw on third card');
    },
  },
  {
    name: 'boss intent switches to pressure phase below 66 percent hp',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 1;
      combat.enemy.hp = Math.floor(combat.enemy.maxHp * 0.6);
      for (let i = 0; i < 12; i += 1) {
        chooseEnemyIntent(state);
        assert(combat.enemy.intent, 'boss intent should be set');
        assert(['密钥横向扩散', '恢复票据污染', '备份目录驻留'].includes(combat.enemy.intent.label), `unexpected phase-two intent ${combat.enemy.intent.label}`);
      }
      assert(state.log.some((line) => line.includes('Boss 阶段切换')), 'boss phase switch log missing');
    },
  },
  {
    name: 'boss intent switches to final phase below 33 percent hp',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 1;
      combat.enemy.hp = Math.floor(combat.enemy.maxHp * 0.25);
      for (let i = 0; i < 12; i += 1) {
        chooseEnemyIntent(state);
        assert(combat.enemy.intent, 'boss intent should be set');
        assert(['核心密钥擦除', '勒索倒计时爆发', '僵尸网络总动员'].includes(combat.enemy.intent.label), `unexpected final-phase intent ${combat.enemy.intent.label}`);
      }
    },
  },
  {
    name: 'attack chain preview reports ransomware countdown before trigger',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 2;
      state.player!.incense = 1;
      const preview = previewAttackChain(state);
      assert(preview.ransomwareCountdown?.turnsRemaining === 1, `expected one turn before ransomware trigger, got ${preview.ransomwareCountdown?.turnsRemaining}`);
      assert(preview.ransomwareCountdown.triggeringThisTurn === false, 'ransomware countdown should not trigger on turn 2');
      assert(preview.ransomwareCountdown.canCancel === false, 'one compute should not cancel ransomware countdown');
      assert(preview.riskForecast.some((item) => item.includes('1 回合后触发')), 'ransomware risk forecast should mention next trigger window');
    },
  },
  {
    name: 'attack chain preview reports ransomware cancellation when compute is ready',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.turn = 3;
      state.player!.incense = 2;
      const preview = previewAttackChain(state);
      assert(preview.ransomwareCountdown?.triggeringThisTurn === true, 'ransomware countdown should trigger on turn 3');
      assert(preview.ransomwareCountdown.canCancel === true, 'two compute should cancel ransomware countdown');
      assert(preview.counterplayWindows.some((item) => item.includes('已满足')), 'ransomware counterplay should report satisfied compute window');
    },
  },
  {
    name: 'attack chain preview reports boss pressure and final phases',
    run: () => {
      const state = setupCombat('tigerlord');
      const combat = state.combat!;
      combat.enemy.hp = Math.floor(combat.enemy.maxHp * 0.6);
      const pressurePreview = previewAttackChain(state);
      assert(pressurePreview.bossPhase?.tone === 'pressure', `expected pressure boss phase, got ${pressurePreview.bossPhase?.tone}`);
      combat.enemy.hp = Math.floor(combat.enemy.maxHp * 0.25);
      const finalPreview = previewAttackChain(state);
      assert(finalPreview.bossPhase?.tone === 'final', `expected final boss phase, got ${finalPreview.bossPhase?.tone}`);
    },
  },
  {
    name: 'attack chain preview reports query cache progress when relic is owned',
    run: () => {
      const state = setupCombat('lantern');
      state.player!.relics.push({ id: 'blankPage', name: '查询缓存', text: '每回合每打出 3 张牌，抽 1 张牌。' });
      state.combat!.queryCacheProgress = 2;
      const preview = previewAttackChain(state);
      assert(preview.queryCacheStatus === '查询缓存 2/3', `unexpected query cache status ${preview.queryCacheStatus}`);
    },
  },
  {
    name: 'attack chain preview reports structured C2 readiness',
    run: () => {
      const state = setupCombat('warlock');
      const combat = state.combat!;
      combat.turn = 2;
      combat.enemy.seal = 0;
      const missingPreview = previewAttackChain(state);
      const missingC2 = missingPreview.counterplayReadiness.find((item) => item.id === 'c2');
      assert(missingC2, 'C2 readiness row should exist');
      assert(missingC2.ready === false, 'zero IOC should not satisfy C2 readiness');
      assert(missingC2.missing === '还差 1 IOC', `unexpected C2 missing text ${missingC2.missing}`);
      combat.enemy.seal = 1;
      const readyPreview = previewAttackChain(state);
      const readyC2 = readyPreview.counterplayReadiness.find((item) => item.id === 'c2');
      assert(readyC2?.ready === true, 'one IOC should satisfy C2 readiness');
      assert(readyC2.current === 'IOC 1', `unexpected C2 current text ${readyC2?.current}`);
    },
  },
  {
    name: 'attack chain preview reports structured credential readiness with noise count',
    run: () => {
      const state = setupCombat('waterghost');
      const combat = state.combat!;
      combat.enemy.weak = 1;
      combat.discardPile = [makeCard(state, 'yinCold')];
      const preview = previewAttackChain(state);
      const credential = preview.counterplayReadiness.find((item) => item.id === 'credential');
      assert(credential, 'credential readiness row should exist');
      assert(credential.ready === false, 'weak 1 should not satisfy credential cleanup readiness');
      assert(credential.current.includes('噪声 1'), `credential current should include noise count, got ${credential.current}`);
      combat.enemy.weak = 2;
      const readyCredential = previewAttackChain(state).counterplayReadiness.find((item) => item.id === 'credential');
      assert(readyCredential?.ready === true, 'weak 2 plus noise should satisfy credential cleanup readiness');
    },
  },
  {
    name: 'card threat hint highlights current attack answers',
    run: () => {
      const state = setupCombat('lantern');
      const combat = state.combat!;
      combat.enemy.intent = { type: 'attack', amount: 8, label: '入侵打点' };
      assert(cardThreatHint(makeCard(state, 'defend'), { combat, player: state.player! })?.label === '补足防护窗口', 'defense card should answer incoming attack');
    },
  },
  {
    name: 'card threat hint highlights attack-chain counters and IOC payoff',
    run: () => {
      const c2State = setupCombat('warlock');
      assert(cardThreatHint(makeCard(c2State, 'zhusha'), { combat: c2State.combat!, player: c2State.player! })?.label === '可拦截 C2 信标', 'IOC card should answer C2 chain');

      const ransomwareState = setupCombat('tigerlord');
      assert(cardThreatHint(makeCard(ransomwareState, 'incense'), { combat: ransomwareState.combat!, player: ransomwareState.player! })?.label === '补算力取消倒计时', 'compute card should answer ransomware chain');

      const credentialState = setupCombat('waterghost');
      assert(cardThreatHint(makeCard(credentialState, 'bell'), { combat: credentialState.combat!, player: credentialState.player! })?.label === '可压制凭据/横移', 'weak card should answer credential chain');

      const payoffState = setupCombat('lantern');
      payoffState.combat!.enemy.seal = 1;
      assert(cardThreatHint(makeCard(payoffState, 'thunder'), { combat: payoffState.combat!, player: payoffState.player! })?.label === '兑现 IOC 爆发', 'IOC payoff card should be highlighted when IOC exists');
    },
  },
  {
    name: 'upgrade delta preview reports before and after value changes',
    run: () => {
      const state = setupCombat('lantern');
      assert(previewUpgradeDelta(makeCard(state, 'strike')) === '6 → 9 伤害', 'strike upgrade delta should show damage increase');
      assert(previewUpgradeDelta(makeCard(state, 'defend')) === '5 → 8 防护', 'defend upgrade delta should show block increase');
      assert(previewUpgradeDelta(makeCard(state, 'qingxin')) === '抽 2 → 3', 'qingxin upgrade delta should show draw increase');
    },
  },
  {
    name: 'event choices expose honest previews and result summaries',
    run: () => {
      for (const event of EVENTS) {
        for (const choice of event.choices) {
          assert(choice.preview && choice.preview.length > 0, `${event.id}/${choice.id} should expose a preview`);
        }
      }

      const healState = createGameState();
      startRun(healState, 'normal');
      healState.event = EVENTS.find((event) => event.choices.some((choice) => choice.id === 'wellHeal'))!;
      healState.screen = 'event';
      healState.player!.hp = 32;
      resolveEvent(healState, 'wellHeal');
      assert(healState.lastEventResult === '获得：防线 +12', `unexpected heal event result ${healState.lastEventResult}`);
      assert(healState.log[0].includes('事件结果：获得：防线 +12'), 'event result should be written into the visible log');

      const cardState = createGameState();
      startRun(cardState, 'normal');
      cardState.event = EVENTS.find((event) => event.choices.some((choice) => choice.id === 'foxCard'))!;
      cardState.screen = 'event';
      const beforeDeck = cardState.player!.deck.length;
      resolveEvent(cardState, 'foxCard');
      assert(cardState.player!.deck.length === beforeDeck + 1, 'fox card event should add one card');
      assert(cardState.lastEventResult?.startsWith('获得：'), `fox card event should summarize gained card, got ${cardState.lastEventResult}`);
    },
  },
 ];

for (const scenario of scenarios) {
  scenario.run();
  console.log(`✓ ${scenario.name}`);
}

console.log(`Engine scenario check passed (${scenarios.length} scenarios).`);
