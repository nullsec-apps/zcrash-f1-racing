import { AnimatePresence, motion } from "framer-motion";
import { useGameState } from "../hooks/useGameState";
import { formatPoints } from "../lib/format";
import type { CrashPopup } from "../lib/gameStore";

function popupColor(intensity: number): string {
  if (intensity < 0.4) return "#f3f315";
  if (intensity < 0.7) return "#ffae1a";
  return "#ff3b2e";
}

function popupOffset(id: number): { x: number; y: number } {
  // pseudo-random scatter so stacked popups don't fully overlap
  const seed = id * 2654435761;
  const x = ((seed % 200) / 200 - 0.5) * 160;
  const y = (((seed >> 8) % 200) / 200 - 0.5) * 90;
  return { x, y };
}

export function CrashScorePopup() {
  const { snapshot } = useGameState();
  const popups = snapshot.popups;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {popups.map((p: CrashPopup) => {
          const color = popupColor(p.intensity);
          const big = p.intensity >= 0.66;
          const off = popupOffset(p.id);
          return (
            <motion.div
              key={p.id}
              initial={{ scale: 0.2, opacity: 0, y: off.y + 20 }}
              animate={{
                scale: big ? [0.2, 1.35, 1] : [0.2, 1.12, 1],
                opacity: 1,
                y: off.y,
                x: off.x,
              }}
              exit={{ scale: 1, opacity: 0, y: off.y - 50 }}
              transition={{
                scale: { duration: 0.3, ease: "easeOut" },
                default: { duration: 0.25 },
              }}
              className="absolute flex flex-col items-center text-center select-none"
            >
              <span
                className="font-display leading-none whitespace-nowrap"
                style={{
                  color,
                  fontSize: big ? "clamp(14px,3.2vw,30px)" : "clamp(10px,2.2vw,20px)",
                  textShadow: `3px 3px 0 #000, ${big ? `0 0 14px ${color}` : "0 0 6px #000"}`,
                }}
              >
                {p.label}
              </span>
              <span
                className="font-display leading-none mt-1"
                style={{
                  color: "#f7f7ef",
                  fontSize: big ? "clamp(16px,3.6vw,34px)" : "clamp(12px,2.6vw,24px)",
                  textShadow: "3px 3px 0 #000",
                }}
              >
                {formatPoints(p.points)}
              </span>
              {p.combo > 1 && (
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.35 }}
                  className="font-display text-[var(--zc-accent)] leading-none mt-1"
                  style={{
                    fontSize: "clamp(9px,1.8vw,16px)",
                    textShadow: "2px 2px 0 #000",
                  }}
                >
                  COMBO x{p.combo}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default CrashScorePopup;
