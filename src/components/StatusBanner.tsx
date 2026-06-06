import { motion, AnimatePresence } from "framer-motion";
import { Loader2, WifiOff, AlertTriangle } from "lucide-react";

export type BannerKind = "loading" | "error" | "offline" | null;

export interface StatusBannerProps {
  kind: BannerKind;
  message?: string;
  className?: string;
}

const PRESETS: Record<
  Exclude<BannerKind, null>,
  { label: string; icon: React.ReactNode; border: string; text: string }
> = {
  loading: {
    label: "BOOTING CABINET...",
    icon: (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="inline-flex"
      >
        <Loader2 size={16} strokeWidth={2} />
      </motion.span>
    ),
    border: "border-[var(--zc-accent)]",
    text: "text-[var(--zc-accent)]",
  },
  error: {
    label: "CONNECTION LOST",
    icon: <AlertTriangle size={16} strokeWidth={2} />,
    border: "border-[var(--zc-accent2)]",
    text: "text-[var(--zc-accent2)]",
  },
  offline: {
    label: "PLAYING LOCAL — SCORES NOT SAVED",
    icon: <WifiOff size={16} strokeWidth={2} />,
    border: "border-[var(--zc-muted)]",
    text: "text-[var(--zc-muted)]",
  },
};

export function StatusBanner({ kind, message, className }: StatusBannerProps) {
  return (
    <AnimatePresence>
      {kind && (
        <motion.div
          key={kind}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {(() => {
            const p = PRESETS[kind];
            return (
              <div
                className={[
                  "flex items-center gap-2 px-3 py-2 bg-[#000] border-[3px]",
                  p.border,
                ].join(" ")}
              >
                <span className={p.text}>{p.icon}</span>
                <span
                  className={[
                    "font-display text-[9px] sm:text-[10px] leading-none tracking-wider",
                    p.text,
                  ].join(" ")}
                >
                  {message || p.label}
                </span>
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StatusBanner;
