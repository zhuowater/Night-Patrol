import type { AttackChainPreview } from "../../game/engine";

export function CombatIntelPanel({
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
  counterplayReadiness,
  lastInterruption,
  bossPhase,
  queryCacheStatus,
  ransomwareCountdown,
  compactIntel = false,
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
  counterplayReadiness: AttackChainPreview["counterplayReadiness"];
  lastInterruption: string | null;
  bossPhase: { label: string; next: string; tone: string } | null;
  queryCacheStatus: string | null;
  ransomwareCountdown: {
    turnsRemaining: number;
    triggeringThisTurn: boolean;
    canCancel: boolean;
    computeNeeded: number;
  } | null;
  compactIntel?: boolean;
}) {
  return (
    <aside className={`combat-intel-panel ${compactIntel ? "combat-intel-panel-compact" : ""}`} aria-label="攻击链态势">
      <div className="intel-header">
        <span>攻击链态势</span>
        <strong>{enemyName}</strong>
        <em>{attackChain}</em>
      </div>
      <details className="intel-expert-details" open={!compactIntel}>
        <summary>专业态势详情</summary>
        <p className="intel-tradecraft">{tradecraft}</p>
      </details>
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
          <em>{ransomwareCountdown.canCancel ? "临时算力恢复演练已就绪，可取消扣血" : `需要 ${ransomwareCountdown.computeNeeded} 临时算力取消扣血`}</em>
        </div>
      )}
      <div className="intel-interruption" aria-label="主动打断反馈">
        <strong>主动打断反馈</strong>
        <span>{lastInterruption || "最近压制：暂无，拖出攻击或加固动作后会记录链路压制结果。"}</span>
      </div>
      {counterplayReadiness.length > 0 && (
        <div className="intel-readiness" aria-label="反制条件状态">
          {counterplayReadiness.map((item) => (
            <span className={`readiness-chip readiness-${item.tone}`} key={item.id}>
              <strong>{item.label}</strong>
              <b>{item.ready ? "已满足" : item.missing || "未满足"}</b>
              <em>{item.requirement} · {item.current}</em>
            </span>
          ))}
        </div>
      )}
      <details className="intel-expert-details intel-chain-details">
        <summary>展开链路风险与反制窗口</summary>
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
      </details>
      <div className="intel-grid">
        <span><strong>当前意图</strong>{intent}</span>
        <span><strong>IOC 层数</strong>{seal}</span>
        <span><strong>噪声告警</strong>{noiseCount}</span>
        <span><strong>防护状态</strong>{block}</span>
        <span><strong>临时算力</strong>{incense}</span>
      </div>
      <p className="intel-move-tactic"><strong>意图研判</strong>{moveTactic}</p>
      <p className="intel-advice">{advice}</p>
      <div className="term-hints" aria-label="术语解释">
        <strong>推荐反制</strong>
        <span>{counter}</span>
        <strong>术语解释</strong>
        <span>IOC：标记后可被沙箱引爆、溯源打击放大。</span>
        <span>噪声告警：污染牌组并拖慢响应节奏。</span>
        <span>临时算力：战斗内临时资源，可支撑爆发清剿。</span>
      </div>
    </aside>
  );
}
