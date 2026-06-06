import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Volume2, VolumeX } from "lucide-react";
import { GameCanvas } from "./components/GameCanvas";
import { HUDBar } from "./components/HUDBar";
import { CrashFeedMarquee } from "./components/CrashFeedMarquee";
import { CrashScorePopup } from "./components/CrashScorePopup";
import { ControlHintBar } from "./components/ControlHintBar";
import { MobileControls } from "./components/MobileControls";
import { AttractScreen } from "./components/AttractScreen";
import { GameOverPanel } from "./components/GameOverPanel";
import { LeaderboardCabinet } from "./components/LeaderboardCabinet";
import { CRTOverlay } from "./components/CRTOverlay";
import { useGameState } from "./hooks/useGameState";
import { useGameControls } from "./hooks/useGameControls";
import { setAudioEnabled, isAudioEnabled, unlockAudio } from "./lib/audio";

export default function App() {
  const { phase, startGame, toAttract } = useGameState();
  const controls = useGameControls();
  const [boardOpen, setBoardOpen] = useState(false);
  const [muted, setMuted] = useState(!isAudioEnabled());

  // enable controls only while playing
  useEffect(() => {
    controls.setEnabled(phase === "playing");
    if (phase !== "playing") controls.reset();
  }, [phase, controls]);

  const handleStart = useCallback(() => {
    unlockAudio();
    startGame();
  }, [startGame]);

  const handleRestart = useCallback(() => {
    toAttract();
    setTimeout(() => startGame(), 60);
  }, [toAttract, startGame]);

  const toggleMute = useCallback(() => {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    setAudioEnabled(!next);
  }, [muted]);

  const showCanvasGhost = phase === "attract";

  return (
    <div className="fixed inset-0 bg-[var(--zc-bg)] overflow-hidden font-body text-[var(--zc-text)] select-none">
      {/* full-bleed game canvas */}
      <GameCanvas controls={controls} ghostMode={showCanvasGhost} />

      {/* top HUD + marquee (only while playing/gameover) */}
      {(phase === "playing" || phase === "crashing" || phase === "gameover") && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <HUDBar />
          <CrashFeedMarquee />
        </div>
      )}

      {/* persistent top-right controls */}
      <div className="absolute top-2 right-2 z-40 flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="flex items-center justify-center w-9 h-9 bg-[var(--zc-surface)] border-[3px] border-[#000] text-[var(--zc-accent)] hover:bg-[var(--zc-accent)] hover:text-[#000] transition-all duration-150 active:translate-y-[1px]"
          style={{ boxShadow: "3px 3px 0 #000" }}
        >
          {muted ? (
            <VolumeX size={16} strokeWidth={2.5} />
          ) : (
            <Volume2 size={16} strokeWidth={2.5} />
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => setBoardOpen(true)}
          aria-label="Leaderboard"
          className="flex items-center gap-1.5 h-9 px-2.5 bg-[var(--zc-surface)] border-[3px] border-[#000] text-[var(--zc-accent)] hover:bg-[var(--zc-accent)] hover:text-[#000] transition-all duration-150 active:translate-y-[1px]"
          style={{ boxShadow: "3px 3px 0 #000" }}
        >
          <Trophy size={16} strokeWidth={2.5} />
          <span className="font-display text-[8px] leading-none hidden xs:inline sm:inline">
            SCORES
          </span>
        </motion.button>
      </div>

      {/* crash score popups (gameplay only) */}
      {(phase === "playing" || phase === "crashing") && <CrashScorePopup />}

      {/* desktop control hints + mobile controls (gameplay only) */}
      {phase === "playing" && (
        <>
          <ControlHintBar />
          <MobileControls controls={controls} />
        </>
      )}

      {/* overlays */}
      {phase === "attract" && <AttractScreen onStart={handleStart} />}
      {phase === "gameover" && <GameOverPanel onRestart={handleRestart} />}

      {/* leaderboard cabinet */}
      <LeaderboardCabinet open={boardOpen} onOpenChange={setBoardOpen} />

      {/* CRT overlay above everything */}
      <CRTOverlay />
    </div>
  );
}
