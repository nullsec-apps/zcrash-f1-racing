import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Skull, Flame, Gauge, Hash, Timer, Trophy, Check, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsEntry } from "./InitialsEntry";
import { StatusBanner } from "./StatusBanner";
import { useGameState } from "../hooks/useGameState";
import { useSubmitScore } from "../hooks/useSubmitScore";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { formatScore, formatDuration, formatMultiplier, sanitizeHandle } from "../lib/format";
import { playGameOver, playCoin, unlockAudio } from "../lib/audio";

export interface GameOverPanelProps {
  onRestart: () => void;
}

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}

function StatChip({ icon, label, value, accent }: StatChipProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#000] border-[3px] border-[var(--zc-muted)] px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--zc-muted)] shrink-0">{icon}</span>
        <span className="font-display text-[9px] text-[var(--zc-muted)] tracking-wider truncate">
          {label}
        </span>
      </div>
      <span
        className={[
          "font-display text-sm sm:text-base leading-none whitespace-nowrap",
          accent ? "text-[var(--zc-accent2)]" : "text-[var(--zc-accent)]",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export function GameOverPanel({ onRestart }: GameOverPanelProps) {
  const { snapshot } = useGameState();
  const { status, error, submit, reset } = useSubmitScore();
  const { topScore } = useLeaderboard();

  const [handle, setHandle] = useState("AAA");

  const isNewRecord = useMemo(
    () => snapshot.score > 0 && snapshot.score >= topScore,
    [snapshot.score, topScore],
  );

  useEffect(() => {
    playGameOver();
    return () => reset();
  }, [reset]);

  const submitted = status === "success";
  const submitting = status === "submitting";

  const handleSubmit = useCallback(async () => {
    unlockAudio();
    const ok = await submit({
      handle: sanitizeHandle(handle) || "AAA",
      score: snapshot.score,
      biggest_crash: snapshot.biggestCrash,
      crash_count: snapshot.crashCount,
      max_multiplier: snapshot.maxMultiplier,
      duration_ms: snapshot.durationMs,
    });
    if (ok) playCoin();
  }, [handle, snapshot, submit]);

  const bannerKind =
    status === "error" ? "error" : status === "offline" ? "offline" : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-4 py-6 bg-[#0c0d0a]/85 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md bg-[var(--zc-surface)] border-[4px] border-[#000] p-4 sm:p-6"
        style={{ boxShadow: "8px 8px 0 #000" }}
      >
        {/* header */}
        <div className="flex flex-col items-center text-center gap-2">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 0.6 }}
            className="text-[var(--zc-accent2)]"
          >
            <Skull size={40} strokeWidth={1.5} />
          </motion.div>
          <motion.h2
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="font-display text-xl sm:text-2xl text-[var(--zc-accent2)] leading-none"
          >
            GAME OVER
          </motion.h2>
          {isNewRecord && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-1.5 font-display text-[10px] text-[#000] bg-[var(--zc-accent)] px-2 py-1 mt-1"
            >
              <Trophy size={14} strokeWidth={2} /> NEW HIGH SCORE!
            </motion.div>
          )}
        </div>

        {/* final score */}
        <div className="mt-4 flex flex-col items-center bg-[#000] border-[3px] border-[var(--zc-accent)] py-4">
          <span className="font-display text-[9px] text-[var(--zc-muted)] tracking-widest">
            FINAL SCORE
          </span>
          <motion.span
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl text-[var(--zc-accent)] leading-none mt-1.5"
          >
            {formatScore(snapshot.score)}
          </motion.span>
        </div>

        {/* stats */}
        <div className="mt-3 grid grid-cols-1 gap-2">
          <StatChip
            icon={<Flame size={16} strokeWidth={2} />}
            label="BIGGEST CRASH"
            value={formatScore(snapshot.biggestCrash)}
            accent
          />
          <div className="grid grid-cols-2 gap-2">
            <StatChip
              icon={<Hash size={16} strokeWidth={2} />}
              label="CRASHES"
              value={String(snapshot.crashCount)}
            />
            <StatChip
              icon={<Gauge size={16} strokeWidth={2} />}
              label="MAX MULT"
              value={formatMultiplier(snapshot.maxMultiplier)}
            />
          </div>
          <StatChip
            icon={<Timer size={16} strokeWidth={2} />}
            label="DURATION"
            value={formatDuration(snapshot.durationMs)}
          />
        </div>

        {/* status banner */}
        {bannerKind && (
          <StatusBanner
            kind={bannerKind}
            message={error || undefined}
            className="mt-3"
          />
        )}

        {/* initials + submit */}
        {!submitted ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <InitialsEntry value={handle} onChange={setHandle} disabled={submitting} />
            <Button
              onClick={handleSubmit}
              disabled={submitting || snapshot.score <= 0}
              className="w-full font-display text-[11px] sm:text-xs bg-[var(--zc-accent)] text-[#000] hover:bg-[#ffff3a] active:translate-x-[2px] active:translate-y-[2px] rounded-none border-[3px] border-[#000] px-5 py-6 h-auto transition-all duration-150 disabled:opacity-50"
            >
              {submitting ? "SAVING..." : "SUBMIT SCORE"}
            </Button>
            {snapshot.score <= 0 && (
              <div className="font-body text-sm text-[var(--zc-muted)] text-center">
                NO CRASHES = NO SCORE. GO DESTROY SOMETHING.
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 bg-[#000] border-[3px] border-[var(--zc-accent)] py-3"
          >
            <Check size={18} strokeWidth={2.5} className="text-[var(--zc-accent)]" />
            <span className="font-display text-[11px] text-[var(--zc-accent)] tracking-wider">
              {sanitizeHandle(handle) || "AAA"} ON THE BOARD
            </span>
          </motion.div>
        )}

        {/* restart */}
        <Button
          onClick={() => {
            unlockAudio();
            playCoin();
            onRestart();
          }}
          className="mt-3 w-full font-display text-[11px] sm:text-xs bg-[var(--zc-surface)] text-[var(--zc-text)] hover:bg-[#26281f] active:translate-x-[2px] active:translate-y-[2px] rounded-none border-[3px] border-[var(--zc-muted)] px-5 py-6 h-auto transition-all duration-150 flex items-center justify-center gap-2"
        >
          <RotateCw size={16} strokeWidth={2} />
          RETRY — INSERT COIN
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default GameOverPanel;
