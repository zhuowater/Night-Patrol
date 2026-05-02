import { cardDef, value } from "./cards";
import type { CardInstance, CombatState, PlayerState } from "../types";

export type CardThreatHint = {
  label: string;
  tone: "attack" | "defense" | "counter" | "resource";
};

export type TurnRecommendation = {
  title: string;
  reason: string;
  priority: "defense" | "counter" | "attack" | "setup";
};

export function cardThreatHint(
  card: CardInstance,
  context: { combat: CombatState; player: PlayerState },
): CardThreatHint | null {
  const def = cardDef(card);
  if (def.unplayable) return null;
  const chain = context.combat.enemy.attackChain;
  const intent = context.combat.enemy.intent;
  const cardTextValue = cardTextForThreat(card);

  if ((intent?.type === "attack" || intent?.type === "blockAttack") && cardTextValue.includes("防护")) {
    return { label: "补足防护窗口", tone: "defense" };
  }
  if (chain.includes("C2") && cardTextValue.includes("IOC")) {
    return { label: "可拦截 C2 信标", tone: "counter" };
  }
  if (chain.includes("勒索") && cardTextValue.includes("算力")) {
    return { label: "补算力取消倒计时", tone: "resource" };
  }
  if ((chain.includes("凭据") || chain.includes("横向移动")) && cardTextValue.includes("降权")) {
    return { label: "可压制凭据/横移", tone: "counter" };
  }
  if (context.combat.enemy.seal > 0 && ["windScroll", "thunder", "burn", "breakEvil"].includes(card.id)) {
    return { label: "兑现 IOC 爆发", tone: "attack" };
  }
  return null;
}

export function recommendTurnAction(context: { combat: CombatState; player: PlayerState }): TurnRecommendation | null {
  const { combat, player } = context;
  const playableHints = combat.hand
    .filter((card) => {
      const cost = cardDef(card).cost;
      return !cardDef(card).unplayable && typeof cost === "number" && player.energy >= cost;
    })
    .map((card) => cardThreatHint(card, context));
  const hasHint = (label: string) => playableHints.some((hint) => hint?.label === label);
  const incoming = combat.enemy.intent?.type === "attack" || combat.enemy.intent?.type === "blockAttack";
  const incomingDamage = combat.enemy.intent?.amount ?? 0;

  if (incoming && player.block < incomingDamage && hasHint("补足防护窗口")) {
    return { title: "先补防护窗口", reason: `敌方本回合预计施压 ${incomingDamage}，当前防护 ${player.block}。`, priority: "defense" };
  }
  if (combat.enemy.attackChain.includes("C2") && hasHint("可拦截 C2 信标")) {
    return { title: "优先标记 IOC 拦截 C2", reason: "这条链路需要 IOC 才能截断信标回连。", priority: "counter" };
  }
  if (combat.enemy.attackChain.includes("勒索") && hasHint("补算力取消倒计时")) {
    return { title: "预留临时算力", reason: "勒索倒计时需要临时算力窗口来取消核心损伤。", priority: "setup" };
  }
  if (combat.enemy.seal > 0 && hasHint("兑现 IOC 爆发")) {
    return { title: "兑现 IOC 爆发", reason: `目标已有 IOC ${combat.enemy.seal}，可以转化为处置伤害或抽牌。`, priority: "attack" };
  }
  const attackCard = combat.hand.find((card) => {
    const cost = cardDef(card).cost;
    return cardDef(card).type === "attack" && typeof cost === "number" && player.energy >= cost;
  });
  if (attackCard) return { title: "压低攻击链血量", reason: "没有紧急反制窗口时，先缩短威胁停留时间。", priority: "attack" };
  return { title: "建立响应节奏", reason: "先打抽牌、防护或资源牌，为下一回合准备窗口。", priority: "setup" };
}

function cardTextForThreat(card: CardInstance) {
  const def = cardDef(card);
  return `${def.text[card.upgraded ? 1 : 0]} ${def.name}`;
}

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
      return `预计：获得 ${value(card, 8, 11)} 防护，响应算力 +1`;
    case "incense":
      return `预计：响应算力 +${value(card, 2, 3)}，随后归档消耗`;
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
      return `预计：造成 ${value(card, 14, 18) + firstAttackBonus} 伤害${enemy && enemy.seal > 0 ? "，并返还 1 响应算力" : "；目标有 IOC 时返还响应算力"}${attackBonusText}`;
    case "mirror":
      return `预计：叠 ${value(card, 2, 3)} IOC 与 2 暴露面`;
    case "refine":
      return `预计：响应算力 +1，生命 -${value(card, 2, 1)}`;
    case "scripture":
      return `预计：抽 ${value(card, 3, 4)} 张，并加入 1 张噪声告警`;
    case "ashReturn":
      return `预计：弃牌堆洗回抽牌堆，抽 ${value(card, 1, 2)} 张，获得 ${value(card, 4, 6)} 防护`;
    case "nightEye":
      return card.upgraded ? "预计：开启每回合 +1 抽牌，并立即抽 1 张" : "预计：开启每回合 +1 抽牌";
    case "citygod":
      return `预计：每回合获得 ${value(card, 3, 5)} 防护与 1 响应算力`;
    case "thunderLaw": {
      const spent = player?.incense || 0;
      return `预计：消耗 ${spent} 临时算力，造成 ${value(card, 12, 16) + spent * value(card, 5, 6) + firstAttackBonus} 伤害${attackBonusText}`;
    }
    case "paperBlade":
      return `预计：造成 ${value(card, 3, 5) + firstAttackBonus} 伤害，随后归档消耗${attackBonusText}`;
    case "yinCold":
      return "预计：无法打出；留在手牌会造成 2 生命损失";
    default:
      return "预计：按卡牌文本结算";
  }
}

export function previewUpgradeDelta(card: CardInstance): string {
  if (card.upgraded) return "已是升级版本";
  const current = previewCardEffect({ ...card, upgraded: false });
  const upgradedCard = { ...card, upgraded: true };
  const upgraded = previewCardEffect(upgradedCard);
  const currentText = current.replace(/^预计：/, "");
  const upgradedText = upgraded.replace(/^预计：/, "");

  const damage = numericDelta(currentText, upgradedText, "造成 ", " 伤害");
  if (damage) return `${damage} 伤害`;

  const block = numericDelta(currentText, upgradedText, "获得 ", " 防护");
  if (block) return `${block} 防护`;

  const draw = numericDelta(currentText, upgradedText, "抽 ", " 张");
  if (draw) return `抽 ${damage ?? draw}`;

  return `升级后：${upgraded}`;
}

function numericDelta(beforeText: string, afterText: string, prefix: string, suffix: string) {
  const before = extractNumberBetween(beforeText, prefix, suffix);
  const after = extractNumberBetween(afterText, prefix, suffix);
  return before !== null && after !== null && before !== after ? `${before} → ${after}` : null;
}

function extractNumberBetween(text: string, prefix: string, suffix: string) {
  const start = text.indexOf(prefix);
  if (start < 0) return null;
  const from = start + prefix.length;
  const end = text.indexOf(suffix, from);
  if (end < 0) return null;
  const valueText = text.slice(from, end).trim();
  return /^\d+$/.test(valueText) ? Number(valueText) : null;
}
