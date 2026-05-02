import { cardCost, cardDef, cardName, cardText, previewCardEffect, previewUpgradeDelta } from "../../game/engine";
import type { CardInstance, GameState } from "../../game/types";
import { GameCard } from "../cards";
import { LogRail } from "../map-log";
import { sceneLoopVideoUrl } from "../assets";

function AmbientSceneVideo() {
  return <video className="scene-loop-video ambient-scene-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />;
}

function relicBuildHint(relicId: string) {
  const hints: Record<string, { build: string; value: string }> = {
    bronzeMirror: { build: "IOC 爆发 / 溯源打击", value: "开局直接铺 IOC，让雷击、沙箱引爆和溯源加权更早进入斩杀线。" },
    taomuTassel: { build: "攻击牌压血", value: "第一张攻击牌自带额外伤害，适合精简牌组后稳定抢节奏。" },
    citySeal: { build: "首回合爆发", value: "第一回合多 2 临时算力，可以提前打出防护+标记+输出的组合。" },
    brokenCenser: { build: "技能防护循环", value: "每张技能牌都补防护，适合高压多段攻击和长线消耗。" },
    nightSand: { build: "抽牌稳定性", value: "首回合多看一张牌，减少关键响应牌沉底的挫败感。" },
    oldUmbrella: { build: "防守起手", value: "首回合自动垫防护，给慢热牌组争取部署窗口。" },
    thunderWood: { build: "IOC 叠层收益", value: "每层 IOC 都更痛，让标记类牌从铺垫变成主要输出。" },
    blankPage: { build: "低费连打 / 查询缓存", value: "每回合第三张牌返抽，奖励低费循环和节奏规划。" },
    paperHorse: { build: "响应算力突破", value: "首回合多 1 响应算力，让三牌展开更容易成立。" },
    foxCoin: { build: "商店经济", value: "立即多 60 预算，能更早买工具、删噪声或补关键牌。" },
  };
  return hints[relicId] ?? { build: "通用响应构筑", value: "为后续路线提供稳定收益，降低单次抽牌波动。" };
}

function shopBuildReason(card: CardInstance, game: GameState) {
  const deck = game.player?.deck ?? [];
  const deckTexts = deck.map((deckCard) => cardText(deckCard)).join(" ");
  const deckHasIocPayoff = deck.some((deckCard) => ["windScroll", "thunder", "burn", "breakEvil"].includes(deckCard.id));
  const iocApplicators = deck.filter((deckCard) => cardText(deckCard).includes("IOC") && !["windScroll", "thunder", "burn", "breakEvil"].includes(deckCard.id)).length;
  const text = cardText(card);
  const def = cardDef(card);

  if (text.includes("IOC") && deckHasIocPayoff && iocApplicators < 3) return "补 IOC 引擎，给现有爆发牌找弹药";
  if (["windScroll", "thunder", "burn", "breakEvil"].includes(card.id) && iocApplicators >= 3) return "兑现 IOC 爆发，牌组已有足够标记来源";
  if (def.type === "skill" && (text.includes("防护") || card.id === "golden") && (game.difficulty === "hard" || (game.player && game.player.hp <= game.player.maxHp * 0.5))) return "稳住高压路线，低血量/困难难度更需要防护";
  if (def.cost === 0 || text.includes("抽")) return "改善出牌节奏，减少关键响应卡手";
  if (def.type === "attack") return "补足处置输出，缩短危险攻击链停留时间";
  if (def.type === "power") return "长期改变值班节奏，越早部署收益越高";
  return deckTexts.includes("IOC") ? "与现有 IOC/响应牌有基础协同" : "补充通用响应面，降低单一路线风险";
}

function shopRemovalReason(game: GameState) {
  const deckSize = game.player?.deck.length ?? 0;
  if (deckSize > 17) return "牌组偏厚，删牌价值上升";
  if (game.player?.deck.some((card) => card.id === "yinCold")) return "牌组有噪声，优先清理低价值告警";
  return "精简低效动作，提高关键剧本上手率";
}

export function RewardScreen({ game, onTake, onSkip }: { game: GameState; onTake: (uid: string) => void; onSkip: () => void }) {
  const reward = game.reward!;
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header reward-briefing">
        <p className="eyebrow">处置奖励 · 复盘选择</p>
        <h2>选择一张响应动作</h2>
        <p>本次回收 {reward.gold} 预算；优先看适合构筑、预计效果和响应算力代价。</p>
        <div className="reward-metrics" aria-label="奖励情报摘要">
          <span><strong>+{reward.gold}</strong> 预算回收</span>
          <span><strong>{reward.cards.length}</strong> 条候选剧本</span>
          <span><strong>{reward.relic ? "1" : "0"}</strong> 件工具入库</span>
        </div>
      </div>
      <div className="reward-primary-choice" aria-label="候选响应动作">
        {reward.cards.map((card) => {
          const def = cardDef(card);
          const tacticalCost = typeof cardCost(card) === "number" ? `${cardCost(card)} 响应算力` : "状态负担";
          const forensicValue = def.type === "attack" ? "压低攻击强度" : def.type === "skill" ? "稳住防线窗口" : def.type === "power" ? "长期改变值班节奏" : "风险残留";
          return (
            <div key={card.uid} className="reward-option">
              <GameCard card={card} mode="reward" onClick={() => onTake(card.uid)} />
              <button className="reward-choice-cta" type="button" onClick={() => onTake(card.uid)}>选择：{cardName(card)}</button>
              <div className="reward-dossier">
                <span><strong>预计效果</strong>{previewCardEffect(card)}</span>
                <span><strong>取证价值</strong>{forensicValue}</span>
                <span><strong>战术代价</strong>{tacticalCost}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="reward-secondary-panel">
        {reward.relic && (
          <details className="relic-reward-card" open>
            <summary>本次缴获工具</summary>
            <div>
              <span className="reward-badge">新工具入库</span>
              <h3>{reward.relic.name}</h3>
              <p>{reward.relic.text}</p>
            </div>
            <dl>
              <div>
                <dt>适合构筑</dt>
                <dd>{relicBuildHint(reward.relic.id).build}</dd>
              </div>
              <div>
                <dt>为什么值钱</dt>
                <dd>{relicBuildHint(reward.relic.id).value}</dd>
              </div>
            </dl>
          </details>
        )}
        <details className="reward-log-details">
          <summary>展开响应日志</summary>
          <LogRail logs={game.log} />
        </details>
      </div>
      <button className="secondary-command reward-skip" type="button" onClick={onSkip}>跳过响应动作</button>
    </section>
  );
}

export function EventScreen({ game, onChoice }: { game: GameState; onChoice: (choice: string) => void }) {
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
            {choice.preview && <b className="event-choice-preview">预计结果：{choice.preview}</b>}
            <em className="decision-card-cta">选择：{choice.title}</em>
          </button>
        ))}
      </div>
      <LogRail logs={game.log} />
    </section>
  );
}

export function RestScreen({ onHeal, onUpgrade }: { onHeal: () => void; onUpgrade: () => void }) {
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

export function ShopScreen({
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
            <small>{previewCardEffect(item.card)}</small>
            <b className="shop-build-reason">推荐理由：{shopBuildReason(item.card, game)}</b>
            <em>{item.sold ? "已采购" : gold < item.cost ? `预算不足 · ${item.cost}` : `${item.cost} 预算`}</em>
          </button>
        ))}
        <button className="shop-card relic-shop-card" type="button" disabled={shop.relic.sold || !shop.relic.relic || gold < shop.relic.cost} onClick={onBuyRelic}>
          <small>工具摊位</small>
          <strong>{shop.relic.relic?.name || "空摊"}</strong>
          <span>{shop.relic.relic?.text || "没有新的工具。"}</span>
          {shop.relic.relic && <b className="shop-build-reason">推荐理由：{relicBuildHint(shop.relic.relic.id).build}</b>}
          <em>{shop.relic.sold ? "已采购" : !shop.relic.relic ? "暂无库存" : gold < shop.relic.cost ? `预算不足 · ${shop.relic.cost}` : `${shop.relic.cost} 预算`}</em>
        </button>
        <button className="shop-card" type="button" disabled={gold < shop.removeCost} onClick={onRemove}>
          <small>牌组治理</small>
          <strong>清理误报规则</strong>
          <span>移除一张不再需要的响应动作，降低抽到低价值动作的概率。</span>
          <b className="shop-build-reason">推荐理由：{shopRemovalReason(game)}</b>
          <em>{gold < shop.removeCost ? `预算不足 · ${shop.removeCost}` : `${shop.removeCost} 预算`}</em>
        </button>
      </div>
      <button className="secondary-command" type="button" onClick={onLeave}>离开市场</button>
    </section>
  );
}

export function DeckPickScreen({
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
              <small>{previewCardEffect(card)}</small>
              {actionLabel === "升级" && <small className="upgrade-delta-preview">升级变化：{previewUpgradeDelta(card)}</small>}
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
