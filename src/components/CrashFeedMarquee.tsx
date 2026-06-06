import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import { useCrashFeed } from "../hooks/useCrashFeed";
import { formatPoints } from "../lib/format";

export function CrashFeedMarquee() {
  const { feed, status, isExample } = useCrashFeed();

  const items = useMemo(() => feed.slice(0, 12), [feed]);

  const loopItems = items.length > 0 ? [...items, ...items] : [];

  return (
    <div className="relative z-10 w-full overflow-hidden border-b-[3px] border-[#000] bg-[#1a1c15] h-8 flex items-center select-none">
      <div className="flex-shrink-0 flex items-center gap-1.5 px-2 h-full bg-[var(--zc-accent)] border-r-[3px] border-[#000]">
        <Flame size={14} strokeWidth={2.5} className="text-[#000]" />
        <span className="font-display text-[8px] text-[#000] leading-none whitespace-nowrap">
          LIVE
        </span>
      </div>

      {status === "loading" && (
        <div className="flex-1 px-3 font-body text-[var(--zc-muted)] text-base tracking-wider animate-pulse">
          BOOTING CRASH FEED...
        </div>
      )}

      {status !== "loading" && loopItems.length === 0 && (
        <div className="flex-1 px-3 font-body text-[var(--zc-muted)] text-base tracking-wider">
          NO CRASHES YET — BE THE FIRST TO SMASH
        </div>
      )}

      {status !== "loading" && loopItems.length > 0 && (
        <div className="flex-1 overflow-hidden relative h-full">
          <motion.div
            className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap will-change-transform"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: Math.max(18, loopItems.length * 3),
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {loopItems.map((row, i) => {
              const big = row.points >= 5000;
              return (
                <span
                  key={`${row.id}-${i}`}
                  className="inline-flex items-center gap-1.5 px-4 font-body text-lg leading-none"
                >
                  <span className="text-[var(--zc-muted)]">
                    {(row.handle || "???").toUpperCase()}
                  </span>
                  {big && (
                    <Zap
                      size={13}
                      strokeWidth={2.5}
                      className="text-[var(--zc-accent2)]"
                    />
                  )}
                  <span
                    className={
                      big
                        ? "text-[var(--zc-accent2)] font-bold"
                        : "text-[var(--zc-text)]"
                    }
                  >
                    {row.crash_type}
                  </span>
                  {row.combo && row.combo > 1 ? (
                    <span className="text-[var(--zc-accent)]">
                      x{row.combo}
                    </span>
                  ) : null}
                  <span
                    className={
                      big
                        ? "text-[var(--zc-accent2)] font-bold"
                        : "text-[var(--zc-accent)]"
                    }
                  >
                    {formatPoints(row.points)}
                  </span>
                  <span className="text-[var(--zc-muted)] mx-1">//</span>
                </span>
              );
            })}
          </motion.div>
        </div>
      )}

      {isExample && (
        <div className="flex-shrink-0 px-2 h-full flex items-center bg-[#2c2f27] border-l-[3px] border-[#000]">
          <span className="font-display text-[7px] text-[var(--zc-muted)] leading-none whitespace-nowrap">
            EXAMPLE
          </span>
        </div>
      )}
    </div>
  );
}

export default CrashFeedMarquee;
