import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Timer, Zap } from "lucide-react";
import { useGameState } from "../hooks/useGameState";
import { CrashOMeter } from "./CrashOMeter";
import { padScore, formatMultiplier, formatDuration } from "../lib/format";

function scoreColor(damage: number): string {
  if (damage < 0.4) return "#f3f315";
  if (damage < 0.7) return "#ffae1a";
  return "#ff3b2e";
}

export function HUDBar() {
  const { snapshot } = useGameState();
  const { score, multiplier, damage, durationMs, scoreJolt } = snapshot;

  const [joltKey, setJoltKey] = useState(0);
  const prevJolt = useRef(scoreJolt);
  useEffect(() => {
    if (scoreJolt !== prevJolt.current) {
      prevJolt.current = scoreJolt;
      setJoltKey((k) => k + 1);
    }
  }, [scoreJolt]);

  const color = scoreColor(damage);
  const multHot = multiplier > 1;

  return (
    <motion.div
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 w-full flex items-stretch justify-between gap-2 px-2 sm:px-4 py-2 bg-[var(--zc-surface)] border-b-[3px] border-[#000] select-none"
    >
      {/* SCORE */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-display text-[7px] sm:text-[8px] text-[var(--zc-muted)] leading-none tracking-widest">
          SCORE
        </span>
        <motion.span
          key={joltKey}
          animate={
            joltKey > 0
              ? { scale: [1, 1.18, 1], x: [0, -2, 3, 0], y: [0, 2, -1, 0] }
              : { scale: 1 }
          }
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="font-display text-base sm:text-xl leading-none whitespace-nowrap transition-colors duration-150"
          style={{ color, textShadow: `2px 2px 0 #000, 0 0 8px ${color}33` }}
        >
          {padScore(score)}
        </motion.span>
      </div>

      {/* MULTIPLIER + TIMER (center) */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-[7px] sm:text-[8px] text-[var(--zc-muted)] leading-none tracking-widest">
            MULT
          </span>
          <motion.span
            animate={
              multHot
                ? { scale: [1, 1.15, 1], color: ["#f3f315", "#ff3b2e", "#f3f315"] }
                : { scale: 1, color: "#7d8466" }
            }
            transition={
              multHot
                ? { duration: 0.7, repeat: Infinity }
                : { duration: 0.15 }
            }
            className="flex items-center gap-1 font-display text-base sm:text-xl leading-none"
            style={{ textShadow: "2px 2px 0 #000" }}
          >
            {multHot && <Zap size={14} strokeWidth={2.5} className="text-[var(--zc-accent2)]" />}
            {formatMultiplier(multiplier)}
          </motion.span>
        </div>

        <div className="hidden xs:flex sm:flex flex-col items-center gap-1">
          <span className="font-display text-[7px] sm:text-[8px] text-[var(--zc-muted)] leading-none tracking-widest flex items-center gap-1">
            <Timer size={10} strokeWidth={2} /> TIME
          </span>
          <span
            className="font-display text-sm sm:text-base text-[var(--zc-text)] leading-none"
            style={{ textShadow: "2px 2px 0 #000" }}
          >
            {formatDuration(durationMs)}
          </span>
        </div>
      </div>

      {/* CRASH-O-METER */}
      <CrashOMeter damage={damage} jolt={scoreJolt} />
    </motion.div>
  );
}

export default HUDBar;
