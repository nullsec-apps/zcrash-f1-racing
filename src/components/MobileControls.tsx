import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import type { GameControlsApi } from "../hooks/useGameControls";

export interface MobileControlsProps {
  controls: GameControlsApi;
  visible?: boolean;
}

type TouchKey = "steerLeft" | "steerRight" | "gas" | "brake";

export function MobileControls({ controls, visible = true }: MobileControlsProps) {
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const press = useCallback(
    (key: TouchKey, down: boolean) => {
      controls.setTouch({ [key]: down } as any);
    },
    [controls],
  );

  if (!visible) return null;

  const padBtn =
    "flex items-center justify-center select-none touch-none bg-[#000] border-[4px] border-[var(--zc-muted)] active:bg-[var(--zc-accent)] active:text-[#000] active:border-[var(--zc-accent)] text-[var(--zc-accent)] transition-colors duration-75";

  return (
    <>
      <AnimatePresence>
        {portrait && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sm:hidden fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0c0d0a]/95 px-6 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="text-[var(--zc-accent)]"
            >
              <RotateCcw size={56} strokeWidth={1.5} />
            </motion.div>
            <div className="font-display text-sm text-[var(--zc-accent)] leading-relaxed">
              ROTATE YOUR PHONE
            </div>
            <div className="font-body text-lg text-[var(--zc-text)] leading-snug max-w-xs">
              ZCRASH plays best in landscape. Turn sideways for the full-width track.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 pointer-events-none">
        <div className="flex items-end justify-between px-3 pb-4">
          {/* D-PAD bottom-left */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              aria-label="Steer left"
              className={`${padBtn} w-16 h-16`}
              onPointerDown={(e) => {
                e.preventDefault();
                press("steerLeft", true);
              }}
              onPointerUp={() => press("steerLeft", false)}
              onPointerLeave={() => press("steerLeft", false)}
              onPointerCancel={() => press("steerLeft", false)}
            >
              <ArrowLeft size={28} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Steer right"
              className={`${padBtn} w-16 h-16`}
              onPointerDown={(e) => {
                e.preventDefault();
                press("steerRight", true);
              }}
              onPointerUp={() => press("steerRight", false)}
              onPointerLeave={() => press("steerRight", false)}
              onPointerCancel={() => press("steerRight", false)}
            >
              <ArrowRight size={28} strokeWidth={2.5} />
            </button>
          </div>

          {/* GAS / BRAKE bottom-right */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              aria-label="Brake"
              className="flex items-center justify-center w-16 h-16 select-none touch-none bg-[#000] border-[4px] border-[var(--zc-accent2)] text-[var(--zc-accent2)] active:bg-[var(--zc-accent2)] active:text-[#000] font-display text-[9px] transition-colors duration-75"
              onPointerDown={(e) => {
                e.preventDefault();
                press("brake", true);
              }}
              onPointerUp={() => press("brake", false)}
              onPointerLeave={() => press("brake", false)}
              onPointerCancel={() => press("brake", false)}
            >
              BRAKE
            </button>
            <button
              type="button"
              aria-label="Gas"
              className="flex items-center justify-center w-20 h-20 select-none touch-none bg-[var(--zc-accent)] border-[4px] border-[#000] text-[#000] active:bg-[#ffff3a] active:translate-y-[2px] font-display text-xs transition-all duration-75"
              onPointerDown={(e) => {
                e.preventDefault();
                press("gas", true);
              }}
              onPointerUp={() => press("gas", false)}
              onPointerLeave={() => press("gas", false)}
              onPointerCancel={() => press("gas", false)}
            >
              GAS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileControls;
