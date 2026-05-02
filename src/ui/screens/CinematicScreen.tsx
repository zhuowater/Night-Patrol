import { SkipForward, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cardName } from "../../game/engine";
import type { GameState } from "../../game/types";
import {
  cinematicPosterUrls,
  cinematicVideoUrls,
  enemyArtUrls,
  goldIconUrl,
  playerNightPatrolUrl,
} from "../assets";

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
          <div className="settlement-line settlement-relic-line">
            <Sparkles />
            <span>
              <strong>新工具入库</strong>
              {cinematic.rewardSummary.relicName}
              {reward?.relic ? ` · ${reward.relic.text}` : ""}
            </span>
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
