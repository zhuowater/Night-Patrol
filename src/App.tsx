import {
  AudioWaveform,
  BadgeCent,
  BookOpen,
  Home,
  Info,
  RotateCcw,
  Shield,
  SkipForward,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { NODE_DEFS } from "./game/content";
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
import { RitualAudio } from "./game/audio";
import type { CardInstance, Difficulty, GameState, NodeType, Screen } from "./game/types";
import { CombatStage } from "./phaser/CombatStage";

const routeNames = ["边界", "办公网", "终端", "日志湖", "服务器区", "情报市", "核心域", "域控"];
const hudBloodUrl = new URL("../assets/vendor/shushan/icon-blood-orb.png", import.meta.url).href;
const baguaIconUrl = new URL("../assets/vendor/shushan/icon-bagua-gold.png", import.meta.url).href;
const talismanIconUrl = new URL("../assets/vendor/shushan/icon-talisman-paper.png", import.meta.url).href;
const swordFireUrl = new URL("../assets/vendor/shushan/icon-sword-flame.png", import.meta.url).href;
const swordCrossUrl = new URL("../assets/vendor/shushan/icon-sword-cross.png", import.meta.url).href;
const blockBadgeUrl = new URL("../assets/vendor/shushan/badge-shield.png", import.meta.url).href;
const incenseBadgeUrl = new URL("../assets/vendor/shushan/relic-bell.png", import.meta.url).href;
const sealBadgeUrl = new URL("../assets/vendor/shushan/relic-orb-blue.png", import.meta.url).href;
const pileDrawUrl = new URL("../assets/vendor/shushan/badge-scroll.png", import.meta.url).href;
const pileDiscardUrl = new URL("../assets/vendor/shushan/icon-talisman-paper.png", import.meta.url).href;
const relicIconUrl = new URL("../assets/vendor/shushan/relic-umbrella.png", import.meta.url).href;
const goldIconUrl = new URL("../assets/vendor/shushan/icon-bagua-gold.png", import.meta.url).href;
const mapIconUrl = new URL("../assets/vendor/aigei/pile-draw.png", import.meta.url).href;
const gameIconUrl = new URL("../assets/marketing/icon.png", import.meta.url).href;
const costGemUrls: Record<string, string> = {
  empty: new URL("../assets/vendor/shushan/cost/cost-empty.png", import.meta.url).href,
  "0": new URL("../assets/vendor/shushan/cost/cost-0.png", import.meta.url).href,
  "1": new URL("../assets/vendor/shushan/cost/cost-1.png", import.meta.url).href,
  "2": new URL("../assets/vendor/shushan/cost/cost-2.png", import.meta.url).href,
  "3": new URL("../assets/vendor/shushan/cost/cost-3.png", import.meta.url).href,
};
const playerNightPatrolUrl = new URL("../assets/generated/characters/player-night-patrol.png", import.meta.url).href;
const sceneLoopVideoUrl = new URL("../assets/generated/backgrounds/night-temple-loop.mp4", import.meta.url).href;
const enemyArtUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/enemies/lantern.png", import.meta.url).href,
  waterghost: new URL("../assets/generated/enemies/waterghost.png", import.meta.url).href,
  templecorpse: new URL("../assets/generated/enemies/templecorpse.png", import.meta.url).href,
  macaque: new URL("../assets/generated/enemies/macaque.png", import.meta.url).href,
  warlock: new URL("../assets/generated/enemies/warlock.png", import.meta.url).href,
  foxshade: new URL("../assets/generated/enemies/foxshade.png", import.meta.url).href,
  tigerlord: new URL("../assets/generated/enemies/tigerlord.png", import.meta.url).href,
};
const cinematicPosterUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/cinematics/victory-lantern-poster.png", import.meta.url).href,
  waterghost: new URL("../assets/generated/cinematics/victory-waterghost-poster.png", import.meta.url).href,
  templecorpse: new URL("../assets/generated/cinematics/victory-templecorpse-poster.png", import.meta.url).href,
  macaque: new URL("../assets/generated/cinematics/victory-macaque-poster.png", import.meta.url).href,
  warlock: new URL("../assets/generated/cinematics/victory-warlock-poster.png", import.meta.url).href,
  foxshade: new URL("../assets/generated/cinematics/victory-foxshade-poster.png", import.meta.url).href,
  "boss-tigerlord": new URL("../assets/generated/cinematics/victory-boss-tigerlord-poster.png", import.meta.url).href,
};
const cinematicVideoUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/cinematics/victory-lantern.mp4", import.meta.url).href,
  waterghost: new URL("../assets/generated/cinematics/victory-waterghost.mp4", import.meta.url).href,
  templecorpse: new URL("../assets/generated/cinematics/victory-templecorpse.mp4", import.meta.url).href,
  macaque: new URL("../assets/generated/cinematics/victory-macaque.mp4", import.meta.url).href,
  warlock: new URL("../assets/generated/cinematics/victory-warlock.mp4", import.meta.url).href,
  foxshade: new URL("../assets/generated/cinematics/victory-foxshade.mp4", import.meta.url).href,
  "boss-tigerlord": new URL("../assets/generated/cinematics/victory-boss-tigerlord.mp4", import.meta.url).href,
};

export function App() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [muted, setMuted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [loadingDifficulty, setLoadingDifficulty] = useState<Difficulty | null>(null);
  const [aboutReturnScreen, setAboutReturnScreen] = useState<Screen>("title");
  const audioRef = useRef<RitualAudio | null>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const audio = () => {
    if (!audioRef.current) audioRef.current = new RitualAudio();
    return audioRef.current;
  };

  const transact = (fn: (draft: GameState) => void, click = true) => {
    if (click) audio().sfx("click");
    setGame((prev) => {
      const next = cloneState(prev);
      next.lastFx = "none";
      fn(next);
      if (next.lastFx !== "none") window.setTimeout(() => audio().sfx(next.lastFx), 0);
      return next;
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio().setMuted(next);
  };

  const returnHome = () => {
    audio().sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setAboutReturnScreen("title");
    setGame(createGameState());
  };

  const openAbout = () => {
    audio().sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setGame((prev) => {
      if (prev.screen !== "about") setAboutReturnScreen(prev.screen);
      return { ...cloneState(prev), screen: "about" };
    });
  };

  const closeAbout = () => {
    audio().sfx("click");
    setGame((prev) => ({ ...cloneState(prev), screen: aboutReturnScreen || "title" }));
  };

  const beginRun = (difficulty: Difficulty) => {
    audio().sfx("click");
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
    audio().setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
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

function TopHud({
  game,
  muted,
  onMute,
  onHome,
  onAbout,
  onRestart,
}: {
  game: GameState;
  muted: boolean;
  onMute: () => void;
  onHome: () => void;
  onAbout: () => void;
  onRestart: () => void;
}) {
  const player = game.player;
  return (
    <header className="top-hud">
      <div className="hud-left">
        <div className="hero-seal">
          <img src={baguaIconUrl} alt="" draggable={false} />
        </div>
        {player && (
          <>
            <HudChip icon={<img className="hud-asset-icon" src={hudBloodUrl} alt="" draggable={false} />} label={`${player.hp}/${player.maxHp}`} tone="heart" />
            <HudChip icon={<img className="hud-asset-icon" src={goldIconUrl} alt="" draggable={false} />} label={String(player.gold)} tone="gold" />
          </>
        )}
      </div>
      <div className="hud-center">
        <div className="hud-center-stack">
          <div className="hud-primary-row">
            {player ? (
              <>
            <HudChip icon={<img className="hud-asset-icon" src={pileDrawUrl} alt="" draggable={false} />} label={`牌组 ${player.deck.length}`} />
            <HudChip icon={<img className="hud-asset-icon" src={relicIconUrl} alt="" draggable={false} />} label={`遗物 ${player.relics.length}`} />
            <HudChip icon={<img className="hud-asset-icon hud-map-icon" src={mapIconUrl} alt="" draggable={false} />} label={`地图 ${Math.min(game.floor + 1, 8)}/8`} tone="map" />
              </>
            ) : (
              <span className="hud-title">夜巡 SOC：边界告警</span>
            )}
          </div>
          <span className="hud-credit">zhuowater × Hermes 联合开发 · 安全响应主题 demo · 非商用署名</span>
        </div>
      </div>
      <div className="hud-right">
        {game.screen !== "title" && (
          <button className="icon-btn" type="button" title="回到首页" onClick={onHome}>
            <Home />
          </button>
        )}
        <button className="icon-btn" type="button" title={muted ? "打开声音" : "静音"} onClick={onMute}>
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button className="icon-btn" type="button" title="关于本作" onClick={onAbout}>
          <Info />
        </button>
        {player && game.screen !== "title" && (
          <button className="icon-btn" type="button" title="重新开始本局" onClick={onRestart}>
            <RotateCcw />
          </button>
        )}
      </div>
    </header>
  );
}

function HudChip({ icon, label, tone }: { icon: ReactNode; label: string; tone?: string }) {
  return (
    <div className={`hud-chip ${tone ? `hud-chip-${tone}` : ""}`}>
      <span>{icon}</span>
      <strong>{label}</strong>
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

function MapScreen({ game, onChoose }: { game: GameState; onChoose: (nodeId: string) => void }) {
  const rows = routeNames.map((_, row) => game.mapNodes.filter((node) => node.row === row).sort((a, b) => a.lane - b.lane));
  const available = new Set(game.availableNodeIds);
  const visited = new Set(game.visitedNodeIds || []);
  const nodeById = new globalThis.Map(game.mapNodes.map((node) => [node.id, node]));
  const mapWidth = 400;
  const mapHeight = 640;
  const laneX = (lane: number) => 28 + (lane / 4) * (mapWidth - 56);
  const rowY = (row: number) => 26 + (row / (routeNames.length - 1)) * (mapHeight - 52);
  const links = game.mapNodes.flatMap((node) =>
    node.nextIds.flatMap((targetId) => {
      const target = nodeById.get(targetId);
      return target ? [{ from: node, to: target }] : [];
    }),
  );
  return (
    <section className="route-view">
      <div className="route-map-panel">
        <div className="route-header">
          <p className="eyebrow">响应路径</p>
          <h2>攻击链分叉</h2>
          <p>每个节点只通向几条后续链路。想压高危、找维护窗口、进情报市场，都要提前看两步。</p>
        </div>
        <div className="branch-map" style={{ "--map-rows": routeNames.length } as CSSProperties}>
          <svg className="branch-links" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
            {links.map(({ from, to }) => {
              const isPast = visited.has(from.id) && visited.has(to.id);
              const isOpen = available.has(from.id) || game.currentNodeId === from.id;
              return (
                <line
                  key={`${from.id}-${to.id}`}
                  className={`branch-link ${isOpen ? "open" : ""} ${isPast ? "past" : ""}`}
                  x1={laneX(from.lane)}
                  y1={rowY(from.row)}
                  x2={laneX(to.lane)}
                  y2={rowY(to.row)}
                />
              );
            })}
          </svg>
          {routeNames.map((name, rowIndex) => (
            <span key={name} className="branch-row-label" style={{ gridColumn: 1, gridRow: rowIndex + 1 }}>
              {name}
            </span>
          ))}
          {rows.flat().map((node) => {
            const isAvailable = available.has(node.id);
            const isCurrent = game.currentNodeId === node.id;
            const isPast = visited.has(node.id) && !isCurrent;
            return (
              <button
                key={node.id}
                type="button"
                className={`map-node map-node-${node.type} ${isAvailable ? "available" : ""} ${isCurrent ? "current" : ""} ${isPast ? "past" : ""}`}
                style={{ gridColumn: node.lane + 2, gridRow: node.row + 1 }}
                disabled={!isAvailable}
                onClick={() => onChoose(node.id)}
                title={NODE_DEFS[node.type].desc}
              >
                {nodeIcon(node.type)}
                <span>{NODE_DEFS[node.type].name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="node-choice-grid">
        {game.availableNodeIds.map((id) => {
          const node = game.mapNodes.find((item) => item.id === id);
          if (!node) return null;
          return (
            <button key={node.id} className={`node-card node-${node.type}`} type="button" onClick={() => onChoose(node.id)}>
              <span className="node-icon">{nodeIcon(node.type)}</span>
              <strong>{NODE_DEFS[node.type].name}</strong>
              <p>{NODE_DEFS[node.type].desc}</p>
            </button>
          );
        })}
      </div>
      <LogRail logs={game.log} />
    </section>
  );
}

function nodeIcon(type: NodeType) {
  if (type === "combat") return <Swords />;
  if (type === "elite") return <Zap />;
  if (type === "event") return <BookOpen />;
  if (type === "rest") return <Sparkles />;
  if (type === "shop") return <BadgeCent />;
  return <AudioWaveform />;
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
      <CombatStage combat={combat} player={player} />
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
            <strong>{intentText(enemy.intent)}</strong>
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

function StatusBadge({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <span className="status-badge">
      {icon}
      {text}
    </span>
  );
}

function GameCard({
  card,
  mode,
  index = 0,
  count = 1,
  disabled,
  dragging,
  dragOffset,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  card: CardInstance;
  mode?: "hand" | "reward" | "pick";
  index?: number;
  count?: number;
  disabled?: boolean;
  dragging?: boolean;
  dragOffset?: { x: number; y: number };
  onClick?: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: () => void;
}) {
  const def = cardDef(card);
  const costKey = typeof def.cost === "number" ? String(Math.min(def.cost, 3)) : "empty";
  const center = (count - 1) / 2;
  const rotate = (index - center) * 5.5;
  const lift = Math.abs(index - center) * 9;
  const offset = (index - center) * 78;
  const style =
    mode === "hand"
      ? ({
          "--card-rot": `${rotate}deg`,
          "--card-x": `${offset}px`,
          "--card-y": `${lift}px`,
          "--drag-x": `${dragOffset?.x || 0}px`,
          "--drag-y": `${dragOffset?.y || 0}px`,
          zIndex: 20 + index,
        } as CSSProperties)
      : undefined;

  return (
    <button
      type="button"
      className={`game-card card-${def.type} ${disabled ? "disabled" : ""} ${dragging ? "is-dragging" : ""} ${mode ? `card-mode-${mode}` : ""}`}
      style={style}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className={`card-cost card-cost-${costKey}`}>
        <img src={costGemUrls[costKey]} alt="" draggable={false} />
        <strong>{def.cost}</strong>
      </div>
      <div className="card-title">{cardName(card)}</div>
      <div className="card-art-window">
        <img className={`card-art-icon card-art-icon-${def.type}`} src={cardArtImage(card)} alt="" draggable={false} />
        <div className="sigil-lines" />
      </div>
      <div className="card-kind">{typeLabel(def.type)}</div>
      <p>{cardText(card)}</p>
    </button>
  );
}

function cardArtImage(card: CardInstance) {
  const def = cardDef(card);
  if (def.type === "attack") {
    return ["strike", "taomu", "paperBlade"].includes(def.id) ? swordCrossUrl : swordFireUrl;
  }
  if (def.type === "power") return baguaIconUrl;
  if (def.type === "status") return hudBloodUrl;
  return talismanIconUrl;
}

function dropTargetForCard(card: CardInstance): "player" | "enemy" | null {
  const type = cardDef(card).type;
  if (type === "attack") return "enemy";
  if (type === "skill" || type === "power") return "player";
  return null;
}

function dragHitTarget(point: { x: number; y: number }): "player" | "enemy" | null {
  if (typeof window === "undefined") return null;
  const inBattleBand = point.y > 120 && point.y < window.innerHeight * 0.78;
  if (!inBattleBand) return null;
  if (point.x < window.innerWidth * 0.48) return "player";
  if (point.x > window.innerWidth * 0.52) return "enemy";
  return null;
}

function typeLabel(type: string) {
  if (type === "attack") return "攻击";
  if (type === "skill") return "技能";
  if (type === "power") return "法门";
  return "状态";
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

function logTone(log: string) {
  if (/获得|采购|预算|工具|响应动作/.test(log)) return { label: "收获", tone: "gain" };
  if (/造成|攻击|伤害|降权|暴露面|IOC|防护|强度|注入/.test(log)) return { label: "处置", tone: "combat" };
  if (/回复|升级|清理|维护|恢复/.test(log)) return { label: "整备", tone: "ready" };
  if (/误报|情报|供应链|异常|市场|维护窗口/.test(log)) return { label: "事件", tone: "event" };
  return { label: "路径", tone: "route" };
}

function LogRail({ logs }: { logs: string[] }) {
  return (
    <aside className="log-rail">
      <strong>响应日志</strong>
      {logs.length === 0 && <span className="log-entry log-route"><small>路径</small><b>控制台刚刚启动，攻击路径还没有留下痕迹。</b></span>}
      {logs.map((log, index) => {
        const meta = logTone(log);
        return (
          <span className={`log-entry log-${meta.tone}`} key={`${log}-${index}`}>
            <small>{meta.label}</small>
            <b>{log}</b>
          </span>
        );
      })}
    </aside>
  );
}

function EndScreen({ title, body, onStart }: { title: string; body: string; onStart: () => void }) {
  return (
    <section className="title-view">
      <div className="title-copy">
        <p className="eyebrow">复盘</p>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={onStart}>
            <Swords /> 再接一班
          </button>
        </div>
      </div>
    </section>
  );
}
