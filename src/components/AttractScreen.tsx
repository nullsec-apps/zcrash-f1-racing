// Pre-game attract-mode / start screen. Big ZCRASH headline, subheadline,
// blinking 'INSERT COIN \u2014 PLAY' CTA, live marquee with TOP SCORE proof.
// The ghost car self-destruct loop runs on the GameCanvas behind this overlay.

import { motion } from "framer-motion";
import { Coins, Trophy, Gauge, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useCrashFeed } from "../hooks/useCrashFeed";
import { formatScore, formatPoints, timeAgo } from "../lib/format";
import { playCoin, unlockAudio } from "../lib/audio";

export interface AttractScreenProps {
  onStart: () => void;
}

export function AttractScreen({ onStart }: AttractScreenProps) {
  const { topScore, topHandle, status: lbStatus } = useLeaderboard();
  const { feed, status: feedStatus } = useCrashFeed();

  const handleStart = () => {
    unlockAudio();
    playCoin();
    onStart();
  };

  const lastThree = feed.slice(0, 3);
  const loading = lbStatus === "loading" && feedStatus === "loading";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-4 py-8 overflow-hidden"
    >
      {/* darken canvas behind */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative w-full max-w-2xl flex flex-col items-center text-center">
        {/* headline */}
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="font-display text-[var(--zc-accent)] leading-none flicker-text"
          style={{
            fontSize: "clamp(2.2rem, 11vw, 5.5rem)",
            textShadow: "5px 5px 0 #000, 0 0 22px rgba(243,243,21,0.35)",
            letterSpacing: "0.02em",
          }}
        >
          ZCRASH
        </motion.h1>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-5 max-w-md text-[var(--zc-text)] text-lg sm:text-xl leading-snug px-2"
        >
          Pilot the{" "}
          <span className="text-[var(--zc-accent)]">ZCASH F1 car.</span> Don't
          avoid the wall \u2014{" "}
          <span className="text-[var(--zc-accent2)] font-display text-sm">
            DESTROY IT.
          </span>{" "}
          Bigger impacts, harder hits, bigger score.
        </motion.p>

        {/* proof module */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6 w-full max-w-lg pixel-panel p-4 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-[var(--zc-accent)]" strokeWidth={2} />
            <span className="font-display text-[10px] text-[var(--zc-accent)]">
              TOP SCORE
            </span>
          </div>
          {loading ? (
            <div className="h-7 w-48 bg-[var(--zc-bg)] animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className="font-display text-[var(--zc-accent)] text-xl sm:text-2xl"
                style={{ textShadow: "3px 3px 0 #000" }}
              >
                {formatScore(topScore)}
              </span>
              <span className="text-[var(--zc-text)] text-xl">by</span>
              <span className="font-display text-[var(--zc-text)] text-base">
                {topHandle}
              </span>
            </div>
          )}

          <div className="mt-3 border-t-[3px] border-[#000] pt-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-[var(--zc-accent2)]" strokeWidth={2} />
              <span className="font-display text-[9px] text-[var(--zc-muted)]">
                LAST CRASHES
              </span>
            </div>
            {loading ? (
              <>
                <div className="h-5 w-full bg-[var(--zc-bg)] animate-pulse" />
                <div className="h-5 w-3/4 bg-[var(--zc-bg)] animate-pulse" />
              </>
            ) : lastThree.length === 0 ? (
              <div className="text-[var(--zc-muted)] text-lg">
                NO CRASHES YET \u2014 BE THE FIRST
              </div>
            ) : (
              lastThree.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 text-lg"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[var(--zc-muted)] font-display text-[8px] shrink-0">
                      {c.handle || "???"}
                    </span>
                    <span className="text-[var(--zc-text)] truncate">
                      {c.crash_type}
                    </span>
                  </span>
                  <span className="text-[var(--zc-accent)] shrink-0">
                    {formatPoints(c.points)}
                    <span className="text-[var(--zc-muted)] text-sm ml-2">
                      {timeAgo(c.created_at)}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
          className="mt-7"
        >
          <Button
            onClick={handleStart}
            className="font-display text-sm sm:text-base bg-[var(--zc-accent)] text-[#000] hover:bg-[#ffff3a] active:translate-x-[2px] active:translate-y-[2px] rounded-none border-[3px] border-[#000] px-7 py-7 h-auto transition-all duration-150 blink-coin"
            style={{ boxShadow: "6px 6px 0 0 #000" }}
          >
            <Coins size={22} strokeWidth={2.5} className="mr-2" />
            INSERT COIN \u2014 PLAY
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 flex items-center gap-2 text-[var(--zc-muted)] text-base"
        >
          <Gauge size={14} strokeWidth={2} />
          <span>ARROWS / WASD \u2014 SPACE TO BRAKE</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AttractScreen;
