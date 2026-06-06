import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { sanitizeHandle } from "../lib/format";
import { playUiTick } from "../lib/audio";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export interface InitialsEntryProps {
  value: string; // up to 3 letters
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function InitialsEntry({ value, onChange, disabled = false }: InitialsEntryProps) {
  const slots = sanitizeHandle(value).padEnd(3, "A").slice(0, 3).split("");
  const activeRef = useRef(0);

  const setLetterAt = useCallback(
    (idx: number, letter: string) => {
      const next = [...slots];
      next[idx] = letter;
      onChange(next.join(""));
    },
    [slots, onChange],
  );

  const cycle = useCallback(
    (idx: number, dir: 1 | -1) => {
      if (disabled) return;
      const cur = LETTERS.indexOf(slots[idx]);
      const safe = cur < 0 ? 0 : cur;
      const ni = (safe + dir + 26) % 26;
      setLetterAt(idx, LETTERS[ni]);
      playUiTick();
    },
    [slots, setLetterAt, disabled],
  );

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const idx = activeRef.current;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        cycle(idx, 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        cycle(idx, -1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        activeRef.current = (idx + 2) % 3;
        onChange(slots.join(""));
        playUiTick();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        activeRef.current = (idx + 1) % 3;
        onChange(slots.join(""));
        playUiTick();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setLetterAt(idx, e.key.toUpperCase());
        activeRef.current = Math.min(2, idx + 1);
        playUiTick();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, slots, setLetterAt, onChange, disabled]);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="font-display text-[10px] text-[var(--zc-muted)] tracking-widest">
        ENTER INITIALS
      </div>
      <div className="flex items-end gap-3">
        {slots.map((letter, idx) => {
          const isActive = activeRef.current === idx;
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <button
                type="button"
                aria-label={`Increment letter ${idx + 1}`}
                disabled={disabled}
                onClick={() => {
                  activeRef.current = idx;
                  cycle(idx, 1);
                }}
                className="flex items-center justify-center w-9 h-7 bg-[#000] border-[3px] border-[var(--zc-muted)] text-[var(--zc-accent)] hover:bg-[var(--zc-accent)] hover:text-[#000] active:translate-y-[1px] transition-all duration-150 disabled:opacity-40"
              >
                <ChevronUp size={16} strokeWidth={2.5} />
              </button>

              <motion.div
                onClick={() => {
                  if (disabled) return;
                  activeRef.current = idx;
                  onChange(slots.join(""));
                }}
                animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
                className={[
                  "relative flex items-center justify-center w-14 h-16 sm:w-16 sm:h-20 cursor-pointer",
                  "bg-[#000] border-[4px] transition-colors duration-150",
                  isActive
                    ? "border-[var(--zc-accent)]"
                    : "border-[var(--zc-muted)]",
                ].join(" ")}
              >
                <span className="font-display text-2xl sm:text-3xl text-[var(--zc-accent)] leading-none">
                  {letter}
                </span>
                {isActive && !disabled && (
                  <motion.div
                    className="absolute bottom-1 left-1 right-1 h-[3px] bg-[var(--zc-accent)]"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <button
                type="button"
                aria-label={`Decrement letter ${idx + 1}`}
                disabled={disabled}
                onClick={() => {
                  activeRef.current = idx;
                  cycle(idx, -1);
                }}
                className="flex items-center justify-center w-9 h-7 bg-[#000] border-[3px] border-[var(--zc-muted)] text-[var(--zc-accent)] hover:bg-[var(--zc-accent)] hover:text-[#000] active:translate-y-[-1px] transition-all duration-150 disabled:opacity-40"
              >
                <ChevronDown size={16} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="font-body text-sm text-[var(--zc-muted)] tracking-wide">
        ↑↓ CYCLE · ←→ MOVE · TYPE A–Z
      </div>
    </div>
  );
}

export default InitialsEntry;
