import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Skull } from "lucide-react";
import { clamp } from "../lib/format";

export interface CrashOMeterProps {
  damage: number; // 0..1
  jolt?: number; // increments to retrigger shake
}

const SEGMENTS = 12;

function tierFor(d: number): { label: string; color: string } {
  if (d < 0.001) return { label: "INTACT", color: "#7d8466" };
  if (d < 0.25) return { label: "TAP", color: "#f3f315" };
  if (d < 0.5) return { label: "SMASH", color: "#ffae1a" };
  if (d < 0.8) return { label: "MEGA", color: "#ff7a1a" };
  return { label: "CATASTROPHE", color: "#ff3b2e" };
}

function segColor(idx: number): string {
  const ratio = idx / (SEGMENTS - 1);
  if (ratio < 0.4) return "#f3f315";
  if (ratio < 0.7) return "#ffae1a";
  return "#ff3b2e";
}

export function CrashOMeter({ damage, jolt = 0 }: CrashOMeterProps) {
  const d = clamp(damage, 0, 1);
  const filled = Math.round(d * SEGMENTS);
  const tier = tierFor(d);
  const critical = d >= 0.8;

  const [shakeKey, setShakeKey] = useState(0);
  const prevJolt = useRef(jolt);
  useEffect(() => {
    if (jolt !== prevJolt.current) {
      prevJolt.current = jolt;
      setShakeKey((k) => k + 1);
    }
  }, [jolt]);

  return (
    <motion.div
      key={shakeKey}
      animate={
        shakeKey > 0
          ? { x: [0, -3, 4, -2, 0], y: [0, 2, -2, 1, 0] }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-col items-end gap-1 select-none"
    >
      <div className="flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {critical ? (
            <motion.span
              key="skull"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.25, 1], opacity: 1 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Skull size={13} strokeWidth={2.5} className="text-[var(--zc-accent2)]" />
            </motion.span>
          ) : (
            <AlertTriangle
              size={13}
              strokeWidth={2.5}
              style={{ color: tier.color }}
            />
          )}
        </AnimatePresence>
        <span
          className="font-display text-[8px] leading-none whitespace-nowrap transition-colors duration-150"
          style={{ color: tier.color }}
        >
          CRASH-O-METER
        </span>
      </div>

      <div
        className="flex items-center gap-[2px] bg-[#000] border-[3px] border-[#000] p-[3px]"
        style={{ boxShadow: "3px 3px 0 #000" }}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const active = i < filled;
          const isLastActive = i === filled - 1;
          return (
            <motion.div
              key={i}
              className="w-[6px] sm:w-[9px] h-4"
              animate={{
                backgroundColor: active ? segColor(i) : "#23261d",
                opacity: active && critical ? [1, 0.55, 1] : 1,
              }}
              transition={{
                backgroundColor: { duration: 0.12 },
                opacity:
                  active && critical
                    ? { duration: 0.4, repeat: Infinity }
                    : { duration: 0.1 },
              }}
              style={{
                boxShadow: isLastActive
                  ? `0 0 6px ${segColor(i)}`
                  : "none",
              }}
            />
          );
        })}
      </div>

      <span
        className="font-body text-sm leading-none tracking-widest transition-colors duration-150"
        style={{ color: tier.color }}
      >
        {tier.label}
      </span>
    </motion.div>
  );
}

export default CrashOMeter;
