import {
  AudioWaveform,
  Home,
  Info,
  RotateCcw,
  Shield,
  SkipForward,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  buyShopCard,
  buyShopRelic,
  cardCost,
  cardDef,
  cardName,
  cardText,
  chooseNode,
  cloneState,
  createGameState,
  endTurn,
  finishCinematic,
  goMap,
  heal,
  hpPercent,
  intentText,
  openRemoveCard,
  openUpgrade,
  playCard,
  removeCard,
  resolveEvent,
  restHeal,
  startRun,
  takeRewardCard,
  upgradeCard,
} from "./game/engine";
import type { CardInstance, Difficulty, EnemyState, GameState, PlayerState, Screen } from "./game/types";
import { LazyCombatStage } from "./phaser/LazyCombatStage";
import {
  baguaIconUrl,
  blockBadgeUrl,
  cinematicPosterUrls,
  cinematicVideoUrls,
  costGemUrls,
  enemyArtUrls,
  gameIconUrl,
  goldIconUrl,
  hudBloodUrl,
  incenseBadgeUrl,
  mapIconUrl,
  pileDiscardUrl,
  pileDrawUrl,
  playerNightPatrolUrl,
  relicIconUrl,
  sceneLoopVideoUrl,
  sealBadgeUrl,
  swordCrossUrl,
  swordFireUrl,
  talismanIconUrl,
} from "./ui/assets";
import { GameCard, dragHitTarget, dropTargetForCard } from "./ui/cards";
import { LogRail, MapScreen } from "./ui/map-log";
import { EndScreen, TopHud } from "./ui/shell";

export function App() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [muted, setMuted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [loadingDifficulty, setLoadingDifficulty] = useState<Difficulty | null>(null);
  const [aboutReturnScreen, setAboutReturnScreen] = useState<Screen>("title");
  const audioRef = useRef<import("./game/audio").RitualAudio | null>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const audio = () => {
    if (!audioRef.current) {
      import("./game/audio").then(({ RitualAudio }) => {
        if (!audioRef.current) {
          audioRef.current = new RitualAudio();
          audioRef.current.setMuted(muted);
          audioRef.current.setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
        }
      });
    }
    return audioRef.current;
  };

  const transact = (fn: (draft: GameState) => void, click = true) => {
    if (click) audio()?.sfx("click");
    setGame((prev) => {
      const next = cloneState(prev);
      next.lastFx = "none";
      fn(next);
      if (next.lastFx !== "none") window.setTimeout(() => audio()?.sfx(next.lastFx), 0);
      return next;
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio()?.setMuted(next);
  };

  const returnHome = () => {
    audio()?.sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setAboutReturnScreen("title");
    setGame(createGameState());
  };

  const openAbout = () => {
    audio()?.sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setGame((prev) => {
      if (prev.screen !== "about") setAboutReturnScreen(prev.screen);
      return { ...cloneState(prev), screen: "about" };
    });
  };

  const closeAbout = () => {
    audio()?.sfx("click");
    setGame((prev) => ({ ...cloneState(prev), screen: aboutReturnScreen || "title" }));
  };

  const beginRun = (difficulty: Difficulty) => {
    audio()?.sfx("click");
    setSelectedDifficulty(difficulty);
    setLoadingDifficulty(difficulty);
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingDifficulty(null);
      transact((draft) => startRun(draft, difficulty), false);
    }, 1450);
  };

  const player = game.player;

  useEffect(() => {
    audio()?.setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
  }, [game.screen]);

  useEffect(
    () => () => {
      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    },
    [],
  );

  const visibleScreen = loadingDifficulty ? "loading" : game.screen;

  return (
    <div className="app-frame">
      <TopHud
        game={game}
        muted={muted}
        onMute={toggleMute}
        onHome={returnHome}
        onAbout={openAbout}
        onRestart={() => transact((draft) => startRun(draft, game.difficulty || selectedDifficulty))}
        icons={{ Home: <Home />, Info: <Info />, RotateCcw: <RotateCcw />, Volume2: <Volume2 />, VolumeX: <VolumeX /> }}
      />
      <main className={`screen screen-${visibleScreen}`}>
        {loadingDifficulty && <LoadingScreen difficulty={loadingDifficulty} />}
        {!loadingDifficulty && game.screen === "title" && (
          <TitleScreen
            selectedDifficulty={selectedDifficulty}
            onDifficulty={setSelectedDifficulty}
            onStart={beginRun}
          />
        )}
        {!loadingDifficulty && game.screen === "about" && <AboutScreen onBack={closeAbout} onHome={returnHome} />}
        {player && game.screen === "map" && <MapScreen game={game} onChoose={(nodeId) => transact((draft) => chooseNode(draft, nodeId))} />}
        {player && game.screen === "combat" && game.combat && (
          <CombatScreen
            game={game}
            onPlayCard={(uid) => transact((draft) => playCard(draft, uid), false)}
            onEndTurn={() => transact(endTurn)}
          />
        )}
        {player && game.screen === "cinematic" && game.cinematic && (
          <CinematicScreen game={game} onContinue={() => transact(finishCinematic, false)} />
        )}
        {player && game.screen === "reward" && game.reward && (
          <RewardScreen
            game={game}
            onTake={(uid) => transact((draft) => takeRewardCard(draft, uid))}
            onSkip={() => transact(goMap)}
          />
        )}
        {player && game.screen === "event" && game.event && (
          <EventScreen game={game} onChoice={(choice) => transact((draft) => resolveEvent(draft, choice))} />
        )}
        {player && game.screen === "rest" && (
          <RestScreen
            onHeal={() => transact(restHeal)}
            onUpgrade={() => transact((draft) => openUpgrade(draft, "map"))}
          />
        )}
        {player && game.screen === "shop" && game.shop && (
          <ShopScreen
            game={game}
            onBuyCard={(index) => transact((draft) => buyShopCard(draft, index))}
            onBuyRelic={() => transact(buyShopRelic)}
            onRemove={() => transact((draft) => openRemoveCard(draft, draft.shop?.removeCost || 75, "shop"))}
            onLeave={() => transact(goMap)}
          />
        )}
        {player && game.screen === "remove" && (
          <DeckPickScreen
            title="清理一张牌"
            desc={`花费 ${game.pendingRemove?.cost || 0} 预算。选中的牌会从牌组中移除。`}
            cards={player.deck}
            actionLabel="清理"
            onPick={(uid) => transact((draft) => removeCard(draft, uid))}
          />
        )}
        {player && game.screen === "upgrade" && (
          <DeckPickScreen
            title="升级一张牌"
            desc="重写响应剧本，旧动作也能变得更快更准。"
            cards={player.deck.filter((card) => !card.upgraded && cardDef(card).rarity !== "status")}
            actionLabel="升级"
            onPick={(uid) => transact((draft) => upgradeCard(draft, uid))}
            emptyAction={() => transact(goMap)}
          />
        )}
        {game.screen === "gameover" && <EndScreen title="响应失守" body="攻击链突破了窗口，核心资产进入应急隔离。下一次接班，你会更懂哪些告警不能拖。" onStart={() => transact(startRun)} />}
        {game.screen === "victory" && <EndScreen title="边界天明" body="勒索核心被阻断，核心域控恢复控制。你带回来的不是答案，而是一套能让夜班活下来的响应剧本。" onStart={() => transact(startRun)} />}
      </main>
    </div>
  );
}

const difficultyOptions: Array<{
  id: Difficulty;
  name: string;
  tag: string;
  desc: string;
}> = [
  { id: "story", name: "演示模式", tag: "演示", desc: "血量更高，攻击活动更松，开局多一点循环支撑。" },
  { id: "normal", name: "标准值班", tag: "推荐", desc: "完整响应路线体验，数值更稳，适合第一次接管夜班。" },
  { id: "hard", name: "高压演练", tag: "挑战", desc: "攻击活动更硬更痛，适合后续调平衡时压测。" },
];

function TitleScreen({
  selectedDifficulty,
  onDifficulty,
  onStart,
}: {
  selectedDifficulty: Difficulty;
  onDifficulty: (difficulty: Difficulty) => void;
  onStart: (difficulty: Difficulty) => void;
}) {
  return (
    <section className="title-view">
      <video className="scene-loop-video title-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="title-copy">
        <p className="eyebrow">Cybersecurity roguelike prototype</p>
        <div className="title-brand">
          <img src={gameIconUrl} alt="" draggable={false} />
          <h1>夜巡 SOC：边界告警</h1>
        </div>
        <p>
          凌晨 02:17，边界探针捕获异常握手。你接管夜班 SOC 控制台，用 IOC、隔离、降噪和自动化剧本，在每一次响应路径里阻断攻击链。
        </p>
        <div className="difficulty-picker" role="radiogroup" aria-label="难度选择">
          {difficultyOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`difficulty-card ${selectedDifficulty === option.id ? "selected" : ""}`}
              onClick={() => onDifficulty(option.id)}
              role="radio"
              aria-checked={selectedDifficulty === option.id}
            >
              <span>{option.tag}</span>
              <strong>{option.name}</strong>
              <em>{option.desc}</em>
            </button>
          ))}
        </div>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={() => onStart(selectedDifficulty)}>
            <Swords /> 接管夜班
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutScreen({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <section className="about-view">
      <video className="scene-loop-video title-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="about-panel">
        <p className="eyebrow">About</p>
        <h1>关于《夜巡 SOC：边界告警》</h1>
        <p className="about-lead">
          本游戏由 zhuowater 与 Hermes 联合开发，是一个网络安全主题卡牌构筑 roguelike 原型 demo，仅供娱乐、学习和非商业展示。
        </p>
        <div className="about-grid">
          <article>
            <strong>共同创作</strong>
            <span>zhuowater 负责主题方向、审美判断、玩法反馈和素材取舍；Hermes 负责代码实现、系统迭代、UI 打磨、打包流程和工程文档。</span>
          </article>
          <article>
            <strong>版权声明</strong>
            <span>未经授权，不得移除署名，不得将本项目或其改包版本发布到其它平台，不得用于售卖、广告导流、商业试玩包或其它商业用途。</span>
          </article>
          <article>
            <strong>授权方式</strong>
            <span>除另有说明外，本仓库采用 CC BY-NC 4.0：允许分享和改编，但必须署名，且不得用于商业目的。</span>
          </article>
          <article>
            <strong>素材边界</strong>
            <span>项目包含 AI 生成素材、用户整理素材和原型资源。若进入正式发行或商业化阶段，需要重新确认素材授权或替换为自有资产。</span>
          </article>
        </div>
        <p className="about-notice">署名建议：夜巡 SOC：边界告警，由 zhuowater × Hermes 联合开发。</p>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={onBack}>
            <SkipForward /> 返回
          </button>
          <button className="secondary-command title-about-command" type="button" onClick={onHome}>
            <Home /> 回到首页
          </button>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen({ difficulty }: { difficulty: Difficulty }) {
  const option = difficultyOptions.find((item) => item.id === difficulty) || difficultyOptions[1];
  return (
    <section className="loading-view">
      <video className="scene-loop-video loading-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="loading-copy">
        <p className="eyebrow">接班</p>
        <h2>控制台启动</h2>
        <span>{option.name}难度</span>
      </div>
      <div className="loading-thread" />
    </section>
  );
}

function AmbientSceneVideo() {
  return <video className="scene-loop-video ambient-scene-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />;
}

function CombatScreen({ game, onPlayCard, onEndTurn }: { game: GameState; onPlayCard: (uid: string) => void; onEndTurn: () => void }) {
  const combat = game.combat!;
  const player = game.player!;
  const enemy = combat.enemy;
  const [drag, setDrag] = useState<{
    uid: string;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [burst, setBurst] = useState<{
    id: number;
    target: "player" | "enemy";
    kind: "shield" | "strike";
  } | null>(null);
  const draggedCard = drag ? combat.hand.find((card) => card.uid === drag.uid) : null;
  const expectedTarget = draggedCard ? dropTargetForCard(draggedCard) : null;
  const dragPoint = drag ? { x: drag.originX + drag.dx, y: drag.originY + drag.dy } : null;
  const hoverTarget = dragPoint ? dragHitTarget(dragPoint) : null;
  const targetHot = Boolean(expectedTarget && hoverTarget === expectedTarget);
  const dropHint = expectedTarget === "enemy" ? "拖到攻击活动上施放" : expectedTarget === "player" ? "拖到自己身上施放" : "拖到目标身上施放";
  const noiseCount = [...combat.hand, ...combat.drawPile, ...combat.discardPile].filter((card) => card.id === "yinCold").length;
  const responseAdvice = getResponseAdvice(player, enemy, noiseCount);
  const intentSummary = intentText(enemy.intent);
  const moveTactic = getMoveTactic(enemy.intent);
  const riskForecast = getRiskForecast(enemy, combat.turn, noiseCount, player.incense);
  const counterplayWindows = getCounterplayWindows(enemy, combat.turn, noiseCount, player.incense);

  const beginDrag = (card: CardInstance, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (cardDef(card).unplayable) return;
    const cost = cardCost(card);
    if (typeof cost !== "number" || player.energy < cost) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window-level pointer listeners below keep drag release reliable even if capture is unavailable.
    }
    setDrag({ uid: card.uid, originX: event.clientX, originY: event.clientY, dx: 0, dy: 0 });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    setDrag({ ...drag, dx: event.clientX - drag.originX, dy: event.clientY - drag.originY });
  };

  const releaseDragAt = (uid: string, point: { x: number; y: number }) => {
    const card = combat.hand.find((item) => item.uid === uid);
    const target = card ? dropTargetForCard(card) : null;
    if (!target || dragHitTarget(point) !== target) return;
    const id = Date.now();
    setBurst({ id, target, kind: target === "enemy" ? "strike" : "shield" });
    window.setTimeout(() => {
      setBurst((current) => (current?.id === id ? null : current));
    }, 520);
    onPlayCard(uid);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const uid = drag.uid;
    setDrag(null);
    releaseDragAt(uid, { x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      setDrag((current) => {
        if (!current || current.uid !== drag.uid) return current;
        return { ...current, dx: event.clientX - current.originX, dy: event.clientY - current.originY };
      });
    };
    const handleEnd = (event: PointerEvent) => {
      const uid = drag.uid;
      setDrag(null);
      releaseDragAt(uid, { x: event.clientX, y: event.clientY });
    };
    const handleCancel = () => setDrag(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [combat.hand, drag, onPlayCard]);

  return (
    <section className="combat-view">
      <Suspense fallback={<div className="combat-stage-loading">战斗场景加载中...</div>}><LazyCombatStage combat={combat} player={player} /></Suspense>
      <video className="combat-scene-loop" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className={`combat-overlay ${drag ? "drag-active" : ""} ${expectedTarget ? `expects-${expectedTarget}` : ""} ${targetHot ? "target-hot" : ""}`}>
        <div className={`play-drop-zone ${drag ? "visible" : ""} ${targetHot ? "hot" : ""}`}>{targetHot ? "松手施放" : dropHint}</div>
        <div className={`target-ghost target-player ${expectedTarget === "player" ? "visible" : ""} ${targetHot && hoverTarget === "player" ? "hot" : ""}`}>
          <Shield />
          <span>防护预备</span>
        </div>
        <div className={`target-ghost target-enemy ${expectedTarget === "enemy" ? "visible" : ""} ${targetHot && hoverTarget === "enemy" ? "hot" : ""}`}>
          <Swords />
          <span>处置预热</span>
        </div>
        {burst && (
          <div key={burst.id} className={`target-burst target-burst-${burst.target} burst-${burst.kind}`}>
            {burst.kind === "shield" ? <Shield /> : <Swords />}
          </div>
        )}
        <div className={`actor-panel player-panel ${expectedTarget === "player" ? "preview-target" : ""} ${targetHot && hoverTarget === "player" ? "target-hot" : ""}`}>
          <HealthStrip current={player.hp} max={player.maxHp} />
          <div className="status-stack">
            <StatusBadge icon={<img src={blockBadgeUrl} alt="" draggable={false} />} text={`防护 ${player.block}`} />
            <StatusBadge icon={<img src={incenseBadgeUrl} alt="" draggable={false} />} text={`算力 ${player.incense}`} />
            {player.weak > 0 && <StatusBadge text={`降权 ${player.weak}`} />}
            {player.powers.nightEye && <StatusBadge text="持续监控" />}
            {player.powers.citygod && <StatusBadge text="自动化响应" />}
          </div>
        </div>
        <div className={`actor-panel enemy-panel ${expectedTarget === "enemy" ? "preview-target" : ""} ${targetHot && hoverTarget === "enemy" ? "target-hot" : ""}`}>
          <div className="intent-plaque">
            <span>活动意图</span>
            <strong>{intentSummary}</strong>
          </div>
          <HealthStrip current={enemy.hp} max={enemy.maxHp} enemy />
          <div className="status-stack">
            <StatusBadge icon={<img src={sealBadgeUrl} alt="" draggable={false} />} text={`IOC ${enemy.seal}`} />
            <StatusBadge icon={<img src={blockBadgeUrl} alt="" draggable={false} />} text={`防护 ${enemy.block}`} />
            {enemy.strength > 0 && <StatusBadge text={`强度 ${enemy.strength}`} />}
            {enemy.weak > 0 && <StatusBadge text={`降权 ${enemy.weak}`} />}
            {enemy.vulnerable > 0 && <StatusBadge text={`暴露面 ${enemy.vulnerable}`} />}
          </div>
        </div>
        <CombatIntelPanel
          enemyName={enemy.name}
          attackChain={enemy.attackChain}
          tradecraft={enemy.tradecraft}
          counter={enemy.counter}
          intent={intentSummary}
          moveTactic={moveTactic}
          seal={enemy.seal}
          noiseCount={noiseCount}
          block={player.block}
          incense={player.incense}
          advice={responseAdvice}
          riskForecast={riskForecast}
          counterplayWindows={counterplayWindows}
          lastInterruption={combat.lastInterruption}
        />
        <div className="energy-orb">
          <strong>{player.energy}</strong>
          <span>/{player.maxEnergy}</span>
        </div>
        <button className="end-turn" type="button" onClick={onEndTurn}>
          <SkipForward /> 结束回合
        </button>
        <div className="pile-counters pile-left" title={`已弃牌 ${combat.discardPile.length}`} aria-label={`已弃牌 ${combat.discardPile.length}`}>
          <img src={pileDiscardUrl} alt="" draggable={false} />
          <span>已弃牌</span>
          <strong>{combat.discardPile.length}</strong>
        </div>
        <div className="pile-counters pile-right" title={`牌库 ${combat.drawPile.length}`} aria-label={`牌库 ${combat.drawPile.length}`}>
          <img src={pileDrawUrl} alt="" draggable={false} />
          <span>牌库</span>
          <strong>{combat.drawPile.length}</strong>
        </div>
        <div className="hand-fan" style={{ "--hand-count": combat.hand.length } as CSSProperties}>
          {combat.hand.map((card, index) => {
            const cost = cardCost(card);
            const disabled = cardDef(card).unplayable || typeof cost !== "number" || player.energy < cost;
            const isDragging = drag?.uid === card.uid;
            return (
              <GameCard
                key={card.uid}
                card={card}
                mode="hand"
                index={index}
                count={combat.hand.length}
                disabled={disabled}
                dragOffset={isDragging ? { x: drag.dx, y: drag.dy } : undefined}
                dragging={isDragging}
                onPointerDown={(event) => beginDrag(card, event)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HealthStrip({ current, max, enemy = false }: { current: number; max: number; enemy?: boolean }) {
  return (
    <div className={`health-strip ${enemy ? "enemy-health" : ""}`}>
      <div className="health-fill" style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%` }} />
      <strong>
        {current}/{max}
      </strong>
    </div>
  );
}

function getResponseAdvice(player: PlayerState, enemy: EnemyState, noiseCount: number) {
  const incomingAttack = enemy.intent?.type === "attack" || enemy.intent?.type === "blockAttack";
  if (incomingAttack && player.block < (enemy.intent?.amount || 0)) return `建议响应：${enemy.counter}`;
  if (enemy.seal >= 3) return "建议响应：IOC 已足够，优先沙箱引爆或溯源打击收束攻击链。";
  if (noiseCount >= 3) return "建议响应：噪声告警偏多，优先降噪过滤或清理牌组，保持抽牌质量。";
  if (player.incense >= 2) return "建议响应：算力充足，可以保留到全域清剿，也可以转化为爆发处置。";
  return `建议响应：${enemy.counter}`;
}

function getMoveTactic(intent: EnemyState["intent"]) {
  if (!intent) return "暂无攻击活动。";
  if (intent.type === "attack" && intent.hits && intent.hits > 1) return "多段打点：容易绕过单次防护阈值，优先堆足防护或降权。";
  if (intent.type === "attack") return "直接打击：按伤害窗口配置防护，留意下一轮是否会增强。";
  if (intent.type === "blockAttack") return "驻留打击：同时输出与加固，适合先标记 IOC 再集中爆发。";
  if (intent.type === "buff") return "威胁增强：下一轮伤害会抬升，推荐反制是提前降权或快速斩杀。";
  if (intent.type === "debuff") return "响应降级：会削弱值班质量，推荐反制是保持抽牌与防护冗余。";
  if (intent.type === "curse") return "噪声污染：会向牌组注入噪声告警，推荐反制是降噪过滤和牌组治理。";
  return "防御动作：趁窗口补 IOC 或准备爆发。";
}

function getRiskForecast(enemy: EnemyState, turn: number, noiseCount: number, incense: number) {
  const items: string[] = [];
  const chain = enemy.attackChain;
  if (chain.includes("C2")) {
    if (turn % 2 === 0) {
      items.push(`下次信标：${enemy.seal > 0 ? "本回合 IOC 拦截，噪声不增加" : "本回合结束触发，噪声 +1"}`);
    } else {
      items.push("下次信标：1 回合后注入噪声，可提前补 IOC 拦截");
    }
  }
  if (chain.includes("凭据")) {
    if (noiseCount >= 2) items.push(`抽牌污染：${enemy.weak > 1 ? "敌方已降权，下次抽牌前清洗" : "已生效，下回合少抽 1 张"}`);
    else items.push(`抽牌污染：还差 ${2 - noiseCount} 张噪声触发${enemy.weak > 1 && noiseCount > 0 ? "，已降权会先清洗" : ""}`);
  }
  if (chain.includes("勒索")) {
    if (turn % 3 === 0) {
      items.push(`勒索倒计时：${incense >= 2 ? "本回合算力恢复演练取消扣血" : "本回合结束扣 4 生命"}`);
    } else {
      items.push(`勒索倒计时：${3 - (turn % 3)} 回合后触发，可存 2 算力取消`);
    }
  }
  if (chain.includes("横向移动")) {
    const lateralTriggered = enemy.intent?.type === "attack";
    items.push(`横移失控：${enemy.weak > 0 ? "已降权，强度滚雪球暂停" : lateralTriggered ? "本轮攻击后强度 +1" : "本轮不触发，留意下一次攻击"}`);
  }
  return items.length ? items : ["暂无额外链路节奏，按当前意图处置。"];
}

function getCounterplayWindows(enemy: EnemyState, turn: number, noiseCount: number, incense: number) {
  const items: string[] = [];
  const chain = enemy.attackChain;
  if (chain.includes("C2")) {
    const c2Triggering = turn % 2 === 0;
    if (c2Triggering) items.push(`C2：IOC ≥ 1 可拦截本轮信标${enemy.seal > 0 ? "（已满足）" : "（未满足）"}`);
    else items.push(`C2：IOC ≥ 1 可拦截信标（${2 - (turn % 2)} 回合后检查）`);
  }
  if (chain.includes("凭据")) {
    const cleanupReady = enemy.weak > 1;
    if (noiseCount > 0) items.push(`凭据：敌方降权可在下次抽牌前清洗 ${noiseCount} 张噪声${cleanupReady ? "（已满足）" : "（建议降噪过滤）"}`);
    else items.push(`凭据：敌方降权可清洗噪声（等待噪声出现）`);
  }
  if (chain.includes("勒索")) {
    const ransomwareTriggering = turn % 3 === 0;
    if (ransomwareTriggering) items.push(`勒索：算力 ≥ 2 可取消本轮倒计时${incense >= 2 ? "（已满足）" : `（还差 ${2 - incense}）`}`);
    else items.push(`勒索：算力 ≥ 2 可取消倒计时（${3 - (turn % 3)} 回合后检查）`);
  }
  if (chain.includes("横向移动")) items.push(`横移：降权可冻结攻击后强度滚雪球${enemy.weak > 0 ? "（已满足）" : "（建议降噪过滤）"}`);
  if (turn % 2 === 0 && enemy.intent?.type !== "attack") items.push("非攻击回合：适合补 IOC / 算力，为下一次链路触发做反制。");
  return items.length ? items : ["当前攻击链没有额外反制窗口，按意图处置即可。"];
}

function CombatIntelPanel({
  enemyName,
  attackChain,
  tradecraft,
  counter,
  intent,
  moveTactic,
  seal,
  noiseCount,
  block,
  incense,
  advice,
  riskForecast,
  counterplayWindows,
  lastInterruption,
}: {
  enemyName: string;
  attackChain: string;
  tradecraft: string;
  counter: string;
  intent: string;
  moveTactic: string;
  seal: number;
  noiseCount: number;
  block: number;
  incense: number;
  advice: string;
  riskForecast: string[];
  counterplayWindows: string[];
  lastInterruption: string | null;
}) {
  return (
    <aside className="combat-intel-panel" aria-label="攻击链态势">
      <div className="intel-header">
        <span>攻击链态势</span>
        <strong>{enemyName}</strong>
        <em>{attackChain}</em>
      </div>
      <p className="intel-tradecraft">{tradecraft}</p>
      <div className="intel-interruption" aria-label="主动打断反馈">
        <strong>主动打断反馈</strong>
        <span>{lastInterruption || "最近压制：暂无，拖出攻击或加固动作后会记录链路压制结果。"}</span>
      </div>
      <div className="intel-risk-forecast" aria-label="链路风险预告">
        <strong>链路风险预告</strong>
        {riskForecast.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="intel-counterplay" aria-label="反制窗口">
        <strong>反制窗口</strong>
        {counterplayWindows.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="intel-grid">
        <span><strong>当前意图</strong>{intent}</span>
        <span><strong>IOC 层数</strong>{seal}</span>
        <span><strong>噪声告警</strong>{noiseCount}</span>
        <span><strong>防护状态</strong>{block}</span>
        <span><strong>可用算力</strong>{incense}</span>
      </div>
      <p className="intel-move-tactic"><strong>意图研判</strong>{moveTactic}</p>
      <p className="intel-advice">{advice}</p>
      <div className="term-hints" aria-label="术语解释">
        <strong>推荐反制</strong>
        <span>{counter}</span>
        <strong>术语解释</strong>
        <span>IOC：标记后可被沙箱引爆、溯源打击放大。</span>
        <span>噪声告警：污染牌组并拖慢响应节奏。</span>
        <span>算力：临时资源，可支撑爆发清剿。</span>
      </div>
    </aside>
  );
}

function StatusBadge({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <span className="status-badge">
      {icon}
      {text}
    </span>
  );
}

function CinematicScreen({ game, onContinue }: { game: GameState; onContinue: () => void }) {
  const cinematic = game.cinematic!;
  const reward = game.reward;
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const enemyArt = enemyArtUrls[cinematic.enemyArtKey] || enemyArtUrls.lantern;
  const mediaKey = cinematic.combatType === "boss" ? `boss-${cinematic.enemyId}` : cinematic.enemyId;
  const videoSrc = cinematicVideoUrls[mediaKey];
  const posterSrc = cinematicPosterUrls[mediaKey] || cinematic.posterUrl;
  const isBoss = cinematic.combatType === "boss";
  const isElite = cinematic.combatType === "elite";
  const shouldTryVideo = Boolean(videoSrc) && !videoFailed;

  useEffect(() => {
    setVideoFailed(false);
    setVideoStarted(false);
  }, [cinematic.enemyId, cinematic.combatType]);

  return (
    <section
      className={`cinematic-view ${isBoss ? "cinematic-boss" : ""}`}
      data-video-slot={videoSrc || cinematic.videoUrl}
      data-poster-slot={posterSrc}
    >
      <div className="cinematic-scene" aria-label={`${cinematic.enemyName}处置过场参考画面`}>
        <div className="cinematic-moon" />
        <img className="cinematic-player" src={playerNightPatrolUrl} alt="" draggable={false} />
        <img className={`cinematic-enemy enemy-${cinematic.enemyArtKey}`} src={enemyArt} alt="" draggable={false} />
        <div className="cinematic-slash" />
        <div className="cinematic-caption">
          <p className="eyebrow">{isBoss ? "Boss Clear" : isElite ? "Elite Clear" : "Encounter Clear"}</p>
          <h2>{cinematic.title}</h2>
          <span>{cinematic.subtitle}</span>
        </div>
        {shouldTryVideo && (
          <video
            className={`cinematic-video ${videoStarted ? "is-playing" : ""}`}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            playsInline
            onPlay={() => setVideoStarted(true)}
            onEnded={onContinue}
            onError={() => setVideoFailed(true)}
          />
        )}
        {(videoFailed || !videoStarted) && (
          <div className="cinematic-static-card">
            <strong>{cinematic.enemyName}</strong>
            <span>{isBoss ? "核心域控恢复心跳。" : "异常流量停在隔离区。"}</span>
          </div>
        )}
      </div>
      <aside className="settlement-panel">
        <p className="eyebrow">处置结算</p>
        <h3>{isBoss ? "边界事件已处置" : "响应成果待确认"}</h3>
        <div className="settlement-line">
          <img src={goldIconUrl} alt="" draggable={false} />
          <span>{cinematic.rewardSummary ? `获得 ${cinematic.rewardSummary.gold} 预算` : "勒索核心已阻断，域控恢复控制"}</span>
        </div>
        {cinematic.rewardSummary?.relicName && (
          <div className="settlement-line">
            <Sparkles />
            <span>工具：{cinematic.rewardSummary.relicName}</span>
          </div>
        )}
        {reward && (
          <div className="settlement-card-peek">
            {reward.cards.map((card) => (
              <span key={card.uid}>{cardName(card)}</span>
            ))}
          </div>
        )}
        <div className="settlement-flavor">
          <strong>响应日志</strong>
          <span>{isBoss ? "核心域控恢复心跳，勒索倒计时被清零。" : "异常流量沉降，只留下可复盘的 IOC 轨迹。"}</span>
        </div>
        <button className="primary-command" type="button" onClick={onContinue}>
          <SkipForward /> {isBoss ? "进入通关页" : "确认成果"}
        </button>
      </aside>
    </section>
  );
}

function RewardScreen({ game, onTake, onSkip }: { game: GameState; onTake: (uid: string) => void; onSkip: () => void }) {
  const reward = game.reward!;
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header reward-briefing">
        <p className="eyebrow">处置奖励 · 复盘选择</p>
        <h2>{reward.title}</h2>
        <p>本次处置回收 {reward.gold} 预算。{reward.relic ? `工具「${reward.relic.name}」已入库。` : "没有新增工具入库。"} 现在选择下一条响应动作：要补攻击、补防护，还是保持牌组清瘦。</p>
        <div className="reward-metrics" aria-label="奖励情报摘要">
          <span><strong>+{reward.gold}</strong> 预算回收</span>
          <span><strong>{reward.cards.length}</strong> 条候选剧本</span>
          <span><strong>{reward.relic ? "1" : "0"}</strong> 件工具入库</span>
        </div>
      </div>
      {reward.relic && <div className="relic-banner"><strong>{reward.relic.name}</strong>{reward.relic.text}</div>}
      <div className="reward-row">
        {reward.cards.map((card) => {
          const def = cardDef(card);
          const tacticalCost = typeof cardCost(card) === "number" ? `${cardCost(card)} 算力` : "状态负担";
          const forensicValue = def.type === "attack" ? "压低攻击强度" : def.type === "skill" ? "稳住防线窗口" : def.type === "power" ? "长期改变值班节奏" : "风险残留";
          return (
            <div key={card.uid} className="reward-option">
              <GameCard card={card} mode="reward" onClick={() => onTake(card.uid)} />
              <div className="reward-dossier">
                <span><strong>取证价值</strong>{forensicValue}</span>
                <span><strong>战术代价</strong>{tacticalCost}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="secondary-command" type="button" onClick={onSkip}>跳过响应动作</button>
      <LogRail logs={game.log} />
    </section>
  );
}

function EventScreen({ game, onChoice }: { game: GameState; onChoice: (choice: string) => void }) {
  const event = game.event!;
  const signalCount = event.choices.length;
  return (
    <section className="choice-view event-view">
      <AmbientSceneVideo />
      <div className="choice-header event-briefing">
        <p className="eyebrow">异常事件 · 值班研判</p>
        <h2>{event.title}</h2>
        <p>{event.body}</p>
        <div className="event-ticker" aria-label="异常研判摘要">
          <span><strong>{signalCount}</strong> 条研判信号</span>
          <span><strong>人工确认</strong> 响应路径</span>
          <span><strong>低峰处置</strong> 业务扰动</span>
        </div>
      </div>
      <div className="decision-grid decision-grid-detailed">
        {event.choices.map((choice, index) => (
          <button key={choice.id} type="button" className="decision-card decision-card-detailed" onClick={() => onChoice(choice.id)}>
            <small>研判信号 0{index + 1}</small>
            <strong>{choice.title}</strong>
            <span>{choice.desc}</span>
            <em>点击提交值班结论</em>
          </button>
        ))}
      </div>
      <LogRail logs={game.log} />
    </section>
  );
}

function RestScreen({ onHeal, onUpgrade }: { onHeal: () => void; onUpgrade: () => void }) {
  return (
    <section className="choice-view rest-view">
      <AmbientSceneVideo />
      <div className="choice-header rest-briefing">
        <p className="eyebrow">维护窗口 · 变更评审</p>
        <h2>维护窗口</h2>
        <p>业务低峰窗口打开。你可以恢复防线，也可以把一张响应动作升级到更顺手。每次变更都会影响下一段巡检节奏。</p>
        <div className="rest-ticker" aria-label="维护变更摘要">
          <span><strong>30%</strong> 防线恢复</span>
          <span><strong>1</strong> 条剧本升级</span>
          <span><strong>变更影响</strong> 立即生效</span>
        </div>
      </div>
      <div className="decision-grid decision-grid-detailed">
        <button type="button" className="decision-card decision-card-detailed" onClick={onHeal}>
          <small>变更影响 · 稳态优先</small>
          <strong>恢复防线</strong>
          <span>回复最大生命 30%，适合下一跳前先降低爆仓风险。</span>
          <em>执行维护回滚与加固</em>
        </button>
        <button type="button" className="decision-card decision-card-detailed" onClick={onUpgrade}>
          <small>变更影响 · 效率优先</small>
          <strong>升级剧本</strong>
          <span>升级 1 张牌，让关键响应动作在后续战斗中更快闭环。</span>
          <em>进入剧本变更清单</em>
        </button>
      </div>
    </section>
  );
}

function ShopScreen({
  game,
  onBuyCard,
  onBuyRelic,
  onRemove,
  onLeave,
}: {
  game: GameState;
  onBuyCard: (index: number) => void;
  onBuyRelic: () => void;
  onRemove: () => void;
  onLeave: () => void;
}) {
  const shop = game.shop!;
  const gold = game.player!.gold;
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header market-briefing">
        <p className="eyebrow">情报报价单</p>
        <h2>情报市场</h2>
        <p>暗网样本、供应商热补丁和蓝队脚本同时上架。你有 {gold} 预算；每笔采购都会改变后续牌组厚度和处置节奏。</p>
        <div className="market-ticker" aria-label="市场态势">
          <span><strong>{gold}</strong> 可用预算</span>
          <span><strong>{shop.cards.filter((item) => !item.sold).length}</strong> 条剧本在售</span>
          <span><strong>{shop.relic.sold ? "售罄" : `${shop.relic.cost}`}</strong> 工具报价</span>
        </div>
      </div>
      <div className="shop-grid">
        {shop.cards.map((item, index) => (
          <button key={item.card.uid} className="shop-card" type="button" disabled={item.sold || gold < item.cost} onClick={() => onBuyCard(index)}>
            <small>响应剧本</small>
            <strong>{cardName(item.card)}</strong>
            <span>{cardText(item.card)}</span>
            <em>{item.sold ? "已采购" : gold < item.cost ? `预算不足 · ${item.cost}` : `${item.cost} 预算`}</em>
          </button>
        ))}
        <button className="shop-card relic-shop-card" type="button" disabled={shop.relic.sold || !shop.relic.relic || gold < shop.relic.cost} onClick={onBuyRelic}>
          <small>工具摊位</small>
          <strong>{shop.relic.relic?.name || "空摊"}</strong>
          <span>{shop.relic.relic?.text || "没有新的工具。"}</span>
          <em>{shop.relic.sold ? "已采购" : !shop.relic.relic ? "暂无库存" : gold < shop.relic.cost ? `预算不足 · ${shop.relic.cost}` : `${shop.relic.cost} 预算`}</em>
        </button>
        <button className="shop-card" type="button" disabled={gold < shop.removeCost} onClick={onRemove}>
          <small>牌组治理</small>
          <strong>清理误报规则</strong>
          <span>移除一张不再需要的响应动作，降低抽到低价值动作的概率。</span>
          <em>{gold < shop.removeCost ? `预算不足 · ${shop.removeCost}` : `${shop.removeCost} 预算`}</em>
        </button>
      </div>
      <button className="secondary-command" type="button" onClick={onLeave}>离开市场</button>
    </section>
  );
}

function DeckPickScreen({
  title,
  desc,
  cards,
  actionLabel,
  onPick,
  emptyAction,
}: {
  title: string;
  desc: string;
  cards: CardInstance[];
  actionLabel: string;
  onPick: (uid: string) => void;
  emptyAction?: () => void;
}) {
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">响应牌组</p>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {cards.length ? (
        <div className="deck-grid">
          {cards.map((card) => (
            <button key={card.uid} type="button" className="deck-card" onClick={() => onPick(card.uid)}>
              <strong>{cardName(card)}</strong>
              <span>{cardText(card)}</span>
              <em>{actionLabel}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <p>没有可选择的牌。</p>
          {emptyAction && <button type="button" onClick={emptyAction}>继续</button>}
        </div>
      )}
    </section>
  );
}

