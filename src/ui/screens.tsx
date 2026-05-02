import { Home, SkipForward, Sparkles, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { cardCost, cardDef, cardName, cardText, previewCardEffect } from "../game/engine";
import type { CardInstance, Difficulty, GameState } from "../game/types";
import { GameCard } from "./cards";
import { LogRail } from "./map-log";
import {
  cinematicPosterUrls,
  cinematicVideoUrls,
  enemyArtUrls,
  gameIconUrl,
  goldIconUrl,
  playerNightPatrolUrl,
  sceneLoopVideoUrl,
} from "./assets";

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

export function TitleScreen({
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

export function AboutScreen({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
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

export function LoadingScreen({ difficulty }: { difficulty: Difficulty }) {
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

export function AmbientSceneVideo() {
  return <video className="scene-loop-video ambient-scene-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />;
}

export function CinematicScreen({ game, onContinue }: { game: GameState; onContinue: () => void }) {
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

export function RewardScreen({ game, onTake, onSkip }: { game: GameState; onTake: (uid: string) => void; onSkip: () => void }) {
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
                <span><strong>预计效果</strong>{previewCardEffect(card)}</span>
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
            <em>点击提交值班结论</em>
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

