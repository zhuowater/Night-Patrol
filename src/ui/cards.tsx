import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { cardCost, cardDef, cardName, cardText, previewCardEffect } from "../game/engine";
import type { CardThreatHint } from "../game/engine";
import type { CardInstance } from "../game/types";
import {
  baguaIconUrl,
  costGemUrls,
  hudBloodUrl,
  swordCrossUrl,
  swordFireUrl,
  talismanIconUrl,
} from "./assets";

export function GameCard({
  card,
  mode,
  index = 0,
  count = 1,
  disabled,
  threatHint,
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
  threatHint?: CardThreatHint | null;
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
      aria-label={`${cardName(card)}，${typeLabel(def.type)}，消耗 ${cardCost(card)} 算力。${cardText(card)}`}
    >
      <div className={`card-cost card-cost-${costKey}`}>
        <img src={costGemUrls[costKey]} alt="" draggable={false} />
        <strong>{def.cost}</strong>
      </div>
      <div className="card-title">{cardName(card)}</div>
      {threatHint && !disabled && <div className={`card-threat-hint hint-${threatHint.tone}`}>{threatHint.label}</div>}
      <div className="card-art-window">
        <img className={`card-art-icon card-art-icon-${def.type}`} src={cardArtImage(card)} alt="" draggable={false} />
        <div className="sigil-lines" />
      </div>
      <div className="card-kind">{typeLabel(def.type)}</div>
      <p>{cardText(card)}</p>
      <div className="card-term-hint">{cardTermHint(card)}</div>
      <div className="card-effect-preview">{previewCardEffect(card)}</div>
    </button>
  );
}

export function cardTermHint(card: CardInstance) {
  const text = cardText(card);
  if (text.includes("IOC")) return "IOC 会放大沙箱引爆、溯源打击与关联分析。";
  if (text.includes("噪声告警")) return "噪声告警会污染牌组，降低后续响应效率。";
  if (text.includes("算力")) return "算力是临时资源，可支撑爆发清剿。";
  if (text.includes("防护")) return "防护抵消本回合攻击活动。";
  if (text.includes("降权")) return "降权会压低攻击活动的输出强度。";
  return "点击卡牌或拖出手牌区施放；攻击默认命中当前攻击链。";
}

export function cardArtImage(card: CardInstance) {
  const def = cardDef(card);
  if (def.type === "attack") {
    return ["strike", "taomu", "paperBlade"].includes(def.id) ? swordCrossUrl : swordFireUrl;
  }
  if (def.type === "power") return baguaIconUrl;
  if (def.type === "status") return hudBloodUrl;
  return talismanIconUrl;
}

export function dropTargetForCard(card: CardInstance): "player" | "enemy" | null {
  const type = cardDef(card).type;
  if (type === "attack") return "enemy";
  if (type === "skill" || type === "power") return "player";
  return null;
}

export function dragHitTarget(point: { x: number; y: number }): "player" | "enemy" | null {
  if (typeof window === "undefined") return null;
  const inBattleBand = point.y > 120 && point.y < window.innerHeight * 0.78;
  if (!inBattleBand) return null;
  if (point.x < window.innerWidth * 0.48) return "player";
  if (point.x > window.innerWidth * 0.52) return "enemy";
  return null;
}

export function typeLabel(type: string) {
  if (type === "attack") return "处置";
  if (type === "skill") return "防护";
  if (type === "power") return "自动化";
  return "噪声";
}
