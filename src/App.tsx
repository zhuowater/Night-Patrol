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
  previewAttackChain,
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
import { AboutScreen, CinematicScreen, DeckPickScreen, EventScreen, LoadingScreen, RewardScreen, RestScreen, ShopScreen, TitleScreen } from "./ui/screens";

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
  const dropHint = expectedTarget === "enemy" ? "松手处置当前攻击链" : expectedTarget === "player" ? "松手加固自身防线" : "点击卡牌或拖出手牌区施放";
  const noiseCount = [...combat.hand, ...combat.drawPile, ...combat.discardPile].filter((card) => card.id === "yinCold").length;
  const responseAdvice = getResponseAdvice(player, enemy, noiseCount);
  const intentSummary = intentText(enemy.intent);
  const moveTactic = getMoveTactic(enemy.intent);
  const riskPreview = previewAttackChain(game);
  const riskForecast = riskPreview.riskForecast;
  const counterplayWindows = riskPreview.counterplayWindows;
  const bossPhase = riskPreview.bossPhase;
  const queryCacheStatus = riskPreview.queryCacheStatus;
  const ransomwareCountdown = riskPreview.ransomwareCountdown;

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
          bossPhase={bossPhase}
          queryCacheStatus={queryCacheStatus}
          ransomwareCountdown={ransomwareCountdown}
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
                onClick={() => onPlayCard(card.uid)}
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
  bossPhase,
  queryCacheStatus,
  ransomwareCountdown,
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
  bossPhase: { label: string; next: string; tone: string } | null;
  queryCacheStatus: string | null;
  ransomwareCountdown: {
    turnsRemaining: number;
    triggeringThisTurn: boolean;
    canCancel: boolean;
    computeNeeded: number;
  } | null;
}) {
  return (
    <aside className="combat-intel-panel" aria-label="攻击链态势">
      <div className="intel-header">
        <span>攻击链态势</span>
        <strong>{enemyName}</strong>
        <em>{attackChain}</em>
      </div>
      <p className="intel-tradecraft">{tradecraft}</p>
      {(bossPhase || queryCacheStatus) && (
        <div className="intel-boss-cache" aria-label="Boss 与缓存状态">
          {bossPhase && (
            <span className={`boss-phase boss-phase-${bossPhase.tone}`}>
              <strong>{bossPhase.label}</strong>
              {bossPhase.next}
            </span>
          )}
          {queryCacheStatus && <span><strong>遗物联动</strong>{queryCacheStatus}，每第 3 张已打出卡额外抽 1 张。</span>}
        </div>
      )}
      {ransomwareCountdown && (
        <div className={`intel-ransomware-countdown ${ransomwareCountdown.triggeringThisTurn ? "is-triggering" : ""} ${ransomwareCountdown.canCancel ? "is-ready" : "is-not-ready"}`} aria-label="勒索倒计时">
          <strong>勒索倒计时</strong>
          <span>{ransomwareCountdown.triggeringThisTurn ? "本回合结束触发" : `${ransomwareCountdown.turnsRemaining} 回合后触发`}</span>
          <em>{ransomwareCountdown.canCancel ? "算力恢复演练已就绪，可取消扣血" : `需要 ${ransomwareCountdown.computeNeeded} 算力取消扣血`}</em>
        </div>
      )}
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
