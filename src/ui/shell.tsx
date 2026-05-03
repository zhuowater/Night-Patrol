import { RunSummaryPanel } from "./RunSummaryPanel";
import { Swords } from "lucide-react";
import type { ReactNode } from "react";
import type { GameState } from "../game/types";
import {
  baguaIconUrl,
  goldIconUrl,
  hudBloodUrl,
  mapIconUrl,
  pileDrawUrl,
  relicIconUrl,
} from "./assets";

export function TopHud({
  game,
  muted,
  onMute,
  onHome,
  onAbout,
  onRestart,
  icons,
}: {
  game: GameState;
  muted: boolean;
  onMute: () => void;
  onHome: () => void;
  onAbout: () => void;
  onRestart: () => void;
  icons: {
    Home: ReactNode;
    Info: ReactNode;
    RotateCcw: ReactNode;
    Volume2: ReactNode;
    VolumeX: ReactNode;
  };
}) {
  const player = game.player;
  return (
    <header className="top-hud">
      <div className="hud-left">
        <div className="hero-seal">
          <img src={baguaIconUrl} alt="" draggable={false} />
        </div>
        {player && (
          <>
            <HudChip icon={<img className="hud-asset-icon" src={hudBloodUrl} alt="" draggable={false} />} label={`${player.hp}/${player.maxHp}`} tone="heart" />
            <HudChip icon={<img className="hud-asset-icon" src={goldIconUrl} alt="" draggable={false} />} label={String(player.gold)} tone="gold" />
          </>
        )}
      </div>
      <div className="hud-center">
        <div className="hud-center-stack">
          <div className="hud-primary-row">
            {player ? (
              <>
                <HudChip icon={<img className="hud-asset-icon" src={pileDrawUrl} alt="" draggable={false} />} label={`牌组 ${player.deck.length}`} />
                <HudChip icon={<img className="hud-asset-icon" src={relicIconUrl} alt="" draggable={false} />} label={`遗物 ${player.relics.length}`} />
                <HudChip icon={<img className="hud-asset-icon hud-map-icon" src={mapIconUrl} alt="" draggable={false} />} label={`地图 ${Math.min(game.floor + 1, 8)}/8`} tone="map" />
              </>
            ) : (
              <span className="hud-title">夜巡 SOC：边界告警</span>
            )}
          </div>
          <span className="hud-credit">zhuowater × Hermes 联合开发 · 安全响应主题 demo · 非商用署名</span>
        </div>
      </div>
      <div className="hud-right">
        {game.screen !== "title" && (
          <button className="icon-btn" type="button" title="回到首页" onClick={onHome}>
            {icons.Home}
          </button>
        )}
        <button className="icon-btn" type="button" title={muted ? "打开声音" : "静音"} onClick={onMute}>
          {muted ? icons.VolumeX : icons.Volume2}
        </button>
        <button className="icon-btn" type="button" title="关于本作" onClick={onAbout}>
          {icons.Info}
        </button>
        {player && game.screen !== "title" && (
          <button className="icon-btn" type="button" title="重新开始本局" onClick={onRestart}>
            {icons.RotateCcw}
          </button>
        )}
      </div>
    </header>
  );
}

function HudChip({ icon, label, tone }: { icon: ReactNode; label: string; tone?: string }) {
  return (
    <div className={`hud-chip ${tone ? `hud-chip-${tone}` : ""}`}>
      <span>{icon}</span>
      <strong>{label}</strong>
    </div>
  );
}

export function EndScreen({
  title,
  body,
  onStart,
  game,
  variant = "gameover",
}: {
  title: string;
  body: string;
  onStart: () => void;
  game?: GameState;
  variant?: "victory" | "gameover";
}) {
  const player = game?.player;

  return (
    <section className="title-view end-view">
      <div className="title-copy end-copy">
        <p className="eyebrow">{variant === "victory" ? "复盘" : "本局 SOC 复盘"}</p>
        <h1>{title}</h1>
        <p>{body}</p>
        {player && game ? <RunSummaryPanel game={game} variant={variant} /> : null}
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={onStart}>
            <Swords /> 再接一班
          </button>
        </div>
      </div>
    </section>
  );
}
