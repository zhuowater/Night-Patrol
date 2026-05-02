import { Home, SkipForward, Swords } from "lucide-react";
import type { Difficulty } from "../game/types";
import { gameIconUrl, sceneLoopVideoUrl } from "./assets";

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
