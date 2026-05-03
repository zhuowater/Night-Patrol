import type { GameState } from "../game/types";

function difficultyLabel(game: GameState) {
  if (game.difficulty === "story") return "剧情";
  if (game.difficulty === "hard") return "困难";
  return "标准";
}

function responseRating(game: GameState) {
  const player = game.player;
  if (!player) return "B";
  const hpRatio = player.hp / player.maxHp;
  if (game.screen === "gameover") return "失守";
  if (hpRatio >= 0.7) return "S";
  if (hpRatio >= 0.45) return "A";
  return "B";
}

function nextAdvice(game: GameState) {
  const summary = game.runSummary;
  if (summary.causeHint) return summary.causeHint;
  if ((summary.bossEntryHp ?? 999) / (summary.bossEntryMaxHp ?? 1) <= 0.3) return "下一局优先在 Boss 前补防线，少走连续高危节点。";
  if (summary.route.filter((route) => route.nodeType === "event").length >= 3) return "下一局事件路线要确认是否换到卡牌、工具或预算，不要只读故事。";
  if (!summary.relicsGained.length) return "下一局至少规划一次高危入侵或情报市场，补一件关键工具。";
  return "下一局优先检查 Boss 入场血线、收口爆发和路线风险。";
}

export function RunSummaryPanel({ game, variant }: { game: GameState; variant: "victory" | "gameover" }) {
  const player = game.player;
  const summary = game.runSummary;
  const route = summary.route.map((item) => item.nodeName).join(" → ") || "尚未进入路线";
  const bossEntry = summary.bossEntryHp == null ? "未进入核心域控" : `${summary.bossEntryHp}/${summary.bossEntryMaxHp}`;
  const combats = summary.combats.slice(-4);
  const events = summary.events.slice(-3);

  return (
    <section className={`run-summary-panel run-summary-panel-${variant}`} aria-label="本局 SOC 复盘">
      <div className="run-summary-heading">
        <p className="eyebrow">本局 SOC 复盘</p>
        <h2>{variant === "victory" ? "阻断成功，但仍要复盘路径" : "失守不是一句失败，而是一组可学习信号"}</h2>
      </div>
      <div className="run-summary-grid" aria-label="本局复盘摘要">
        <SummaryTile label="响应评级" value={responseRating(game)} accent />
        <SummaryTile label="难度" value={difficultyLabel(game)} />
        <SummaryTile label="最终防线" value={player ? `${player.hp}/${player.maxHp}` : "0/0"} />
        <SummaryTile label="Boss 入场" value={bossEntry} />
        <SummaryTile label="牌组规模" value={player ? `${player.deck.length} 张` : "0 张"} />
        <SummaryTile label="工具数量" value={`${summary.relicsGained.length} 件`} />
      </div>
      <div className="run-summary-route">
        <span>路线</span>
        <strong>{route}</strong>
      </div>
      <div className="run-summary-combats">
        <span>关键战斗</span>
        <ul>
          {combats.length ? (
            combats.map((combat) => (
              <li key={`${combat.floor}-${combat.enemyName}-${combat.turns}`}>
                {combat.floor} 层 · {combat.enemyName} · {combat.turns} 回合 · HP {combat.startHp}→{combat.endHp} · 峰值输出 {combat.maxDamageDealt} / 承伤 {combat.maxDamageTaken}
              </li>
            ))
          ) : (
            <li>暂无战斗摘要。</li>
          )}
        </ul>
      </div>
      <div className="run-summary-wide">
        <span>关键工具</span>
        <strong>{summary.relicsGained.length ? summary.relicsGained.map((item) => item.relicName).join(" · ") : "本局没有获得工具"}</strong>
      </div>
      <div className="run-summary-wide">
        <span>事件结果</span>
        <ul>
          {events.length ? events.map((event) => <li key={`${event.floor}-${event.title}-${event.choiceTitle}`}>{event.title} / {event.choiceTitle}：{event.result}</li>) : <li>本局没有事件记录。</li>}
        </ul>
      </div>
      <div className="run-summary-diagnosis">
        <span>诊断</span>
        <strong>{summary.causeHint ?? (variant === "victory" ? "核心域控已恢复；复盘重点是保留这套路线/构筑组合。" : "攻击链突破窗口，需要回看路线、血线与构筑短板。")}</strong>
      </div>
      <div className="run-summary-next-advice">
        <span>下一局建议</span>
        <strong>{nextAdvice(game)}</strong>
      </div>
    </section>
  );
}

function SummaryTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`summary-tile ${accent ? "summary-tile-accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
