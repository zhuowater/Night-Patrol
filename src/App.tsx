import {
  AudioWaveform,
  Home,
  Info,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  cardDef,
  buyShopCard,
  buyShopRelic,
  cardName,
  cardText,
  chooseNode,
  cloneState,
  createGameState,
  endTurn,
  finishCinematic,
  goMap,
  markGuidanceSeen,
  openRemoveCard,
  openUpgrade,
  playCard,
  removeCard,
  resolveEvent,
  restHeal,
  startRun,
  takeRewardCard,
  upgradeCard,
} from "./game/engine";
import type { Difficulty, GameState, Screen } from "./game/types";
import {
  baguaIconUrl,
  cinematicPosterUrls,
  cinematicVideoUrls,
  enemyArtUrls,
  gameIconUrl,
  goldIconUrl,
  hudBloodUrl,
  mapIconUrl,
  playerNightPatrolUrl,
  relicIconUrl,
  sceneLoopVideoUrl,
} from "./ui/assets";
import { MapScreen } from "./ui/map-log";
import { EndScreen, TopHud } from "./ui/shell";
import { AboutScreen, CinematicScreen, DeckPickScreen, EventScreen, LoadingScreen, RewardScreen, RestScreen, ShopScreen, TitleScreen } from "./ui/screens";
import { CombatScreen } from "./ui/screens/CombatScreen";

export function App() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [muted, setMuted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [loadingDifficulty, setLoadingDifficulty] = useState<Difficulty | null>(null);
  const [aboutReturnScreen, setAboutReturnScreen] = useState<Screen>("title");
  const audioRef = useRef<import("./game/audio").RitualAudio | null>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const audio = () => {
    if (!audioRef.current) {
      import("./game/audio").then(({ RitualAudio }) => {
        if (!audioRef.current) {
          audioRef.current = new RitualAudio();
          audioRef.current.setMuted(muted);
          audioRef.current.setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
        }
      });
    }
    return audioRef.current;
  };

  const transact = (fn: (draft: GameState) => void, click = true) => {
    if (click) audio()?.sfx("click");
    setGame((prev) => {
      const next = cloneState(prev);
      next.lastFx = "none";
      fn(next);
      if (next.lastFx !== "none") window.setTimeout(() => audio()?.sfx(next.lastFx), 0);
      return next;
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio()?.setMuted(next);
  };

  const returnHome = () => {
    audio()?.sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setAboutReturnScreen("title");
    setGame(createGameState());
  };

  const openAbout = () => {
    audio()?.sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setGame((prev) => {
      if (prev.screen !== "about") setAboutReturnScreen(prev.screen);
      return { ...cloneState(prev), screen: "about" };
    });
  };

  const closeAbout = () => {
    audio()?.sfx("click");
    setGame((prev) => ({ ...cloneState(prev), screen: aboutReturnScreen || "title" }));
  };

  const beginRun = (difficulty: Difficulty) => {
    audio()?.sfx("click");
    setSelectedDifficulty(difficulty);
    setLoadingDifficulty(difficulty);
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingDifficulty(null);
      transact((draft) => startRun(draft, difficulty), false);
    }, 1450);
  };

  const player = game.player;

  useEffect(() => {
    audio()?.setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
  }, [game.screen]);

  useEffect(
    () => () => {
      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    },
    [],
  );

  const visibleScreen = loadingDifficulty ? "loading" : game.screen;

  return (
    <div className="app-frame">
      <TopHud
        game={game}
        muted={muted}
        onMute={toggleMute}
        onHome={returnHome}
        onAbout={openAbout}
        onRestart={() => transact((draft) => startRun(draft, game.difficulty || selectedDifficulty))}
        icons={{ Home: <Home />, Info: <Info />, RotateCcw: <RotateCcw />, Volume2: <Volume2 />, VolumeX: <VolumeX /> }}
      />
      <main className={`screen screen-${visibleScreen}`}>
        {loadingDifficulty && <LoadingScreen difficulty={loadingDifficulty} />}
        {!loadingDifficulty && game.screen === "title" && (
          <TitleScreen
            selectedDifficulty={selectedDifficulty}
            onDifficulty={setSelectedDifficulty}
            onStart={beginRun}
          />
        )}
        {!loadingDifficulty && game.screen === "about" && <AboutScreen onBack={closeAbout} onHome={returnHome} />}
        {player && game.screen === "map" && <MapScreen game={game} onChoose={(nodeId) => transact((draft) => chooseNode(draft, nodeId))} />}
        {player && game.screen === "combat" && game.combat && (
          <CombatScreen
            game={game}
            onPlayCard={(uid) => transact((draft) => playCard(draft, uid), false)}
            onEndTurn={() => transact(endTurn)}
            onDismissGuidance={(id) => transact((draft) => markGuidanceSeen(draft, id), false)}
          />
        )}
        {player && game.screen === "cinematic" && game.cinematic && (
          <CinematicScreen game={game} onContinue={() => transact(finishCinematic, false)} />
        )}
        {player && game.screen === "reward" && game.reward && (
          <RewardScreen
            game={game}
            onTake={(uid) => transact((draft) => takeRewardCard(draft, uid))}
            onSkip={() => transact(goMap)}
          />
        )}
        {player && game.screen === "event" && game.event && (
          <EventScreen game={game} onChoice={(choice) => transact((draft) => resolveEvent(draft, choice))} />
        )}
        {player && game.screen === "rest" && (
          <RestScreen
            onHeal={() => transact(restHeal)}
            onUpgrade={() => transact((draft) => openUpgrade(draft, "map"))}
          />
        )}
        {player && game.screen === "shop" && game.shop && (
          <ShopScreen
            game={game}
            onBuyCard={(index) => transact((draft) => buyShopCard(draft, index))}
            onBuyRelic={() => transact(buyShopRelic)}
            onRemove={() => transact((draft) => openRemoveCard(draft, draft.shop?.removeCost || 75, "shop"))}
            onLeave={() => transact(goMap)}
          />
        )}
        {player && game.screen === "remove" && (
          <DeckPickScreen
            title="清理一张牌"
            desc={`花费 ${game.pendingRemove?.cost || 0} 预算。选中的牌会从牌组中移除。`}
            cards={player.deck}
            actionLabel="清理"
            onPick={(uid) => transact((draft) => removeCard(draft, uid))}
          />
        )}
        {player && game.screen === "upgrade" && (
          <DeckPickScreen
            title="升级一张牌"
            desc="重写响应剧本，旧动作也能变得更快更准。"
            cards={player.deck.filter((card) => !card.upgraded && cardDef(card).rarity !== "status")}
            actionLabel="升级"
            onPick={(uid) => transact((draft) => upgradeCard(draft, uid))}
            emptyAction={() => transact(goMap)}
          />
        )}
        {game.screen === "victory" && (
          <EndScreen
            title="边界天明"
            body="勒索核心被阻断，核心域控恢复控制。你带回来的不是答案，而是一套能让夜班活下来的响应剧本。"
            game={game}
            variant="victory"
            onStart={() => transact(startRun)}
          />
        )}
        {game.screen === "gameover" && <EndScreen title="响应失守" body="攻击链突破了窗口，核心资产进入应急隔离。下一次接班，你会更懂哪些告警不能拖。" onStart={() => transact(startRun)} />}
      </main>
    </div>
  );
}
