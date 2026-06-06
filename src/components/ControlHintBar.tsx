// Bottom desktop control-hint bar rendering pixel key glyphs:
// \u2190/\u2192 STEER, \u2191 GAS, \u2193/SPACE BRAKE. Pure pixel-bordered chips, no rounding.

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface KeyChipProps {
  label?: string;
  icon?: React.ReactNode;
  wide?: boolean;
}

function KeyChip({ label, icon, wide }: KeyChipProps) {
  return (
    <span
      className={
        "inline-flex items-center justify-center h-8 px-2 bg-[var(--zc-surface)] border-[3px] border-[#000] text-[var(--zc-accent)] transition-all duration-150 hover:bg-[var(--zc-accent)] hover:text-[#000] " +
        (wide ? "min-w-[64px]" : "min-w-[32px]")
      }
      style={{ boxShadow: "3px 3px 0 0 #000" }}
    >
      {icon}
      {label && (
        <span className="font-display text-[8px] leading-none">{label}</span>
      )}
    </span>
  );
}

export function ControlHintBar() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden sm:flex items-center justify-center gap-6 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <KeyChip icon={<ArrowLeft size={14} strokeWidth={2.5} />} />
        <KeyChip icon={<ArrowRight size={14} strokeWidth={2.5} />} />
        <span className="font-display text-[8px] text-[var(--zc-muted)] ml-1">
          STEER
        </span>
      </div>

      <span className="text-[var(--zc-muted)]">|</span>

      <div className="flex items-center gap-2">
        <KeyChip icon={<ArrowUp size={14} strokeWidth={2.5} />} />
        <span className="font-display text-[8px] text-[var(--zc-muted)] ml-1">
          GAS
        </span>
      </div>

      <span className="text-[var(--zc-muted)]">|</span>

      <div className="flex items-center gap-2">
        <KeyChip icon={<ArrowDown size={14} strokeWidth={2.5} />} />
        <KeyChip label="SPACE" wide />
        <span className="font-display text-[8px] text-[var(--zc-muted)] ml-1">
          BRAKE
        </span>
      </div>
    </motion.div>
  );
}

export default ControlHintBar;
