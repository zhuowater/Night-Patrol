import { Shield, SkipForward, Swords } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  cardCost,
  cardDef,
  cardThreatHint,
  hasSeenGuidance,
  intentText,
  markGuidanceSeen,
  previewAttackChain,
  recommendTurnAction,
} from "../../game/engine";
import type { CardInstance, EnemyState, GameState, PlayerState } from "../../game/types";
import { LazyCombatStage } from "../../phaser/LazyCombatStage";
import {
  blockBadgeUrl,
  incenseBadgeUrl,
  pileDiscardUrl,
  pileDrawUrl,
  sceneLoopVideoUrl,
  sealBadgeUrl,
} from "../assets";
import { GameCard, dragHitTarget, dropTargetForCard } from "../cards";
import { CombatIntelPanel } from "./CombatIntelPanel";

export function CombatScreen({ game, onPlayCard, onEndTurn, onDismissGuidance }: { game: GameState; onPlayCard: (uid: string) => void; onEndTurn: () => void; onDismissGuidance: (id: "firstCombat" | "firstC2" | "firstNoise") => void }) {
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
  const counterplayReadiness = riskPreview.counterplayReadiness;
  const bossPhase = riskPreview.bossPhase;
  const queryCacheStatus = riskPreview.queryCacheStatus;
  const ransomwareCountdown = riskPreview.ransomwareCountdown;
  const turnRecommendation = recommendTurnAction({ combat, player });
  const playableIocCard = combat.hand.some((card) => {
    const cost = cardCost(card);
    return typeof cost === "number" && player.energy >= cost && cardThreatHint(card, { combat, player })?.label === "可拦截 C2 信标";
  });
  const shouldShowFirstCombatCue = game.floor === 0 && !hasSeenGuidance(game, "firstCombat");
  const shouldShowC2Cue = enemy.attackChain.includes("C2") && !hasSeenGuidance(game, "firstC2");
  const shouldShowNoiseCue = !hasSeenGuidance(game, "firstNoise") && (noiseCount > 0 || enemy.intent?.type === "curse");

  const dismissCue = (id: "firstCombat" | "firstC2" | "firstNoise") => onDismissGuidance(id);
  const markCueOnAction = () => {
    if (shouldShowFirstCombatCue) markGuidanceSeen(game, "firstCombat");
    if (shouldShowC2Cue) markGuidanceSeen(game, "firstC2");
    if (shouldShowNoiseCue) markGuidanceSeen(game, "firstNoise");
  };

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
    markCueOnAction();
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
        <div className="combat-priority-row" aria-label="短视口值班优先级">
          <div className="combat-mini-intent">
            <span>敌方意图</span>
            <strong>{intentSummary}</strong>
          </div>
          <div className="combat-mini-recommendation">
            <span>值班建议</span>
            <strong>{turnRecommendation?.title || responseAdvice.replace(/^建议响应：/, "")}</strong>
          </div>
          <button className="end-turn combat-mini-end-turn" type="button" onClick={() => { markCueOnAction(); onEndTurn(); }}>
            <SkipForward /> 结束回合
          </button>
        </div>
        <div className="combat-guidance-stack" aria-label="值班引导">
          {shouldShowFirstCombatCue && (
            <FirstRunCue
              title="第一战先看敌方意图"
              body={`本回合预计压力：${intentSummary}。${turnRecommendation ? `建议先关注：${turnRecommendation.title}。` : "先补防护或压低攻击链血量。"}`}
              aside="你也可以反着来；这只是值班建议，不会强制操作。"
              onDismiss={() => dismissCue("firstCombat")}
            />
          )}
          {shouldShowC2Cue && (
            <MicroCue
              tone="counter"
              title="C2 信标"
              body={`C2 信标 = 倒计时威胁。给敌人叠 IOC 可以拦截它。${playableIocCard ? "手牌里带 IOC 的牌已高亮。" : "本回合没有 IOC 牌时，先补防护或准备下回合。"}`}
              onDismiss={() => dismissCue("firstC2")}
            />
          )}
          {shouldShowNoiseCue && (
            <MicroCue
              tone="noise"
              title="噪声告警"
              body="噪声告警 = 坏牌/告警债。留在手里或堆进牌组会拖慢循环。"
              onDismiss={() => dismissCue("firstNoise")}
            />
          )}
          {turnRecommendation && (
            <TurnRecommendationBanner recommendation={turnRecommendation} />
          )}
        </div>
        <div className={`actor-panel player-panel ${expectedTarget === "player" ? "preview-target" : ""} ${targetHot && hoverTarget === "player" ? "target-hot" : ""}`}>
          <HealthStrip current={player.hp} max={player.maxHp} />
          <div className="status-stack">
            <StatusBadge icon={<img src={blockBadgeUrl} alt="" draggable={false} />} text={`防护 ${player.block}`} />
            <StatusBadge icon={<img src={incenseBadgeUrl} alt="" draggable={false} />} text={`临时算力 ${player.incense}`} />
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
          <HealthStrip
            current={enemy.hp}
            max={enemy.maxHp}
            enemy
            phaseMarks={
              enemy.boss && enemy.phases?.length
                ? enemy.phases.map((phase) => ({
                    at: Math.round(phase.hpBelow * 100),
                    label: phase.hpBelow <= 0.33 ? "核心擦除" : "横向扩散",
                  }))
                : undefined
            }
          />
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
          counterplayReadiness={counterplayReadiness}
          lastInterruption={combat.lastInterruption}
          bossPhase={bossPhase}
          queryCacheStatus={queryCacheStatus}
          ransomwareCountdown={ransomwareCountdown}
          compactIntel={true}
        />
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
          counterplayReadiness={counterplayReadiness}
          lastInterruption={combat.lastInterruption}
          bossPhase={bossPhase}
          queryCacheStatus={queryCacheStatus}
          ransomwareCountdown={ransomwareCountdown}
        />
        <div className="energy-orb" title="响应算力：本回合可用于打出响应牌，回合开始刷新。" aria-label={`响应算力 ${player.energy}/${player.maxEnergy}`}>
          <small>响应算力</small>
          <strong>{player.energy}</strong>
          <span>/{player.maxEnergy}</span>
        </div>
        <button className="end-turn" type="button" onClick={() => { markCueOnAction(); onEndTurn(); }}>
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
                threatHint={disabled ? null : cardThreatHint(card, { combat, player })}
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

function FirstRunCue({ title, body, aside, onDismiss }: { title: string; body: string; aside: string; onDismiss: () => void }) {
  return (
    <div className="first-run-cue">
      <div>
        <strong>{title}</strong>
        <span>{body}</span>
        <em>{aside}</em>
      </div>
      <button type="button" onClick={onDismiss}>知道了</button>
    </div>
  );
}

function MicroCue({ tone, title, body, onDismiss }: { tone: "counter" | "noise"; title: string; body: string; onDismiss: () => void }) {
  return (
    <div className={`micro-cue micro-cue-${tone}`}>
      <strong>{title}</strong>
      <span>{body}</span>
      <button type="button" onClick={onDismiss}>×</button>
    </div>
  );
}

function TurnRecommendationBanner({ recommendation }: { recommendation: { title: string; reason: string; priority: string } }) {
  return (
    <div className={`turn-recommendation turn-recommendation-${recommendation.priority}`}>
      <strong>值班建议：{recommendation.title}</strong>
      <span>{recommendation.reason}</span>
    </div>
  );
}

function HealthStrip({
  current,
  max,
  enemy = false,
  phaseMarks = [],
}: {
  current: number;
  max: number;
  enemy?: boolean;
  phaseMarks?: Array<{ at: number; label: string }>;
}) {
  return (
    <div className={`health-strip ${enemy ? "enemy-health" : ""}`}>
      <div className="health-fill" style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%` }} />
      {phaseMarks.map((mark) => (
        <span
          key={`${mark.at}-${mark.label}`}
          className="health-phase-mark"
          style={{ left: `${Math.max(0, Math.min(100, mark.at))}%` }}
          title={`${mark.label}阶段阈值：${mark.at}% HP`}
          aria-label={`${mark.label}阶段阈值：${mark.at}% HP`}
        />
      ))}
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
  if (player.incense >= 2) return "建议响应：临时算力充足，可以保留到全域清剿，也可以转化为爆发处置。";
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


function StatusBadge({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <span className="status-badge">
      {icon}
      {text}
    </span>
  );
}
