import { cardDef, value } from "./cards";
import type { CardInstance, CombatState, PlayerState } from "../types";

export function previewCardEffect(card: CardInstance, context?: { combat?: CombatState; player?: PlayerState }) {
  const enemy = context?.combat?.enemy;
  const player = context?.player;
  const firstAttackBonus = cardDef(card).type === "attack" && context?.combat && !context.combat.attackPlayed ? 4 : 0;
  const attackBonusText = firstAttackBonus ? "；首张攻击工具 +4" : "";

  switch (card.id) {
    case "strike":
      return `预计：造成 ${value(card, 6, 9) + firstAttackBonus} 伤害${attackBonusText}`;
    case "defend":
      return `预计：获得 ${value(card, 5, 8)} 防护`;
    case "zhusha":
      return `预计：造成 ${value(card, 4, 6) + firstAttackBonus} 伤害，叠 ${value(card, 1, 2)} IOC${attackBonusText}`;
    case "taomu":
      return `预计：造成 ${value(card, 4, 5)}×2 伤害${attackBonusText}`;
    case "cloudstep":
      return `预计：获得 ${value(card, 3, 5)} 防护，抽 1 张`;
    case "qingxin":
      return `预计：抽 ${value(card, 2, 3)} 张，随后归档消耗`;
    case "golden":
      return `预计：获得 ${value(card, 8, 11)} 防护，算力 +1`;
    case "incense":
      return `预计：算力 +${value(card, 2, 3)}，随后归档消耗`;
    case "windScroll": {
      const extra = enemy && enemy.seal > 0 ? value(card, 1, 2) : 0;
      return `预计：抽 ${1 + extra} 张${extra ? "（IOC 已命中）" : "；目标有 IOC 时额外抽牌"}`;
    }
    case "thunder": {
      const bonus = enemy && enemy.seal > 0 ? value(card, 6, 8) : 0;
      return `预计：造成 ${value(card, 10, 14) + bonus + firstAttackBonus} 伤害${bonus ? "（含 IOC 引爆）" : "；有 IOC 时追加伤害"}${attackBonusText}`;
    }
    case "bell":
      return `预计：获得 ${value(card, 3, 5)} 防护，施加 ${value(card, 2, 3)} 降权`;
    case "fog":
      return `预计：获得 ${value(card, 6, 9)} 防护，抽 1 张`;
    case "command":
      return `预计：获得 ${value(card, 4, 6)} 防护，叠 ${value(card, 4, 5)} IOC`;
    case "burn": {
      const layers = enemy?.seal || 0;
      return layers > 0 ? `预计：消耗 ${layers} IOC，造成 ${layers * value(card, 5, 7) + firstAttackBonus} 伤害${attackBonusText}` : "预计：当前无 IOC 可溯源，建议先标记 IOC";
    }
    case "paper":
      return `预计：获得 ${value(card, 7, 10)} 防护，生成 1 张蜜罐回刺`;
    case "breakEvil":
      return `预计：造成 ${value(card, 14, 18) + firstAttackBonus} 伤害${enemy && enemy.seal > 0 ? "，并返还 1 能量" : "；目标有 IOC 时返还能量"}${attackBonusText}`;
    case "mirror":
      return `预计：叠 ${value(card, 2, 3)} IOC 与 2 暴露面`;
    case "refine":
      return `预计：能量 +1，生命 -${value(card, 2, 1)}`;
    case "scripture":
      return `预计：抽 ${value(card, 3, 4)} 张，并加入 1 张噪声告警`;
    case "ashReturn":
      return `预计：弃牌堆洗回抽牌堆，抽 ${value(card, 1, 2)} 张，获得 ${value(card, 4, 6)} 防护`;
    case "nightEye":
      return card.upgraded ? "预计：开启每回合 +1 抽牌，并立即抽 1 张" : "预计：开启每回合 +1 抽牌";
    case "citygod":
      return `预计：每回合获得 ${value(card, 3, 5)} 防护与 1 算力`;
    case "thunderLaw": {
      const spent = player?.incense || 0;
      return `预计：消耗 ${spent} 算力，造成 ${value(card, 12, 16) + spent * value(card, 5, 6) + firstAttackBonus} 伤害${attackBonusText}`;
    }
    case "paperBlade":
      return `预计：造成 ${value(card, 3, 5) + firstAttackBonus} 伤害，随后归档消耗${attackBonusText}`;
    case "yinCold":
      return "预计：无法打出；留在手牌会造成 2 生命损失";
    default:
      return "预计：按卡牌文本结算";
  }
}
