import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, X, RefreshCw, Crown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "./StatusBanner";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { formatScore } from "../lib/format";

export interface LeaderboardCabinetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function rankColor(i: number): string {
  if (i === 0) return "#f3f315";
  if (i === 1) return "#ffae1a";
  if (i === 2) return "#ff7a1a";
  return "#7d8466";
}

export function LeaderboardCabinet({ open, onOpenChange }: LeaderboardCabinetProps) {
  const { rows, status, isExample, reload } = useLeaderboard();

  const banner = useMemo<"loading" | "error" | "offline" | null>(() => {
    if (status === "loading") return "loading";
    if (status === "error") return "error";
    if (status === "offline") return "offline";
    return null;
  }, [status]);

  const showEmpty = status === "empty" || (isExample && status !== "loading");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[var(--zc-bg)] border-l-[4px] border-[#000] p-0 text-[var(--zc-text)] [&>button]:hidden overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 bg-[var(--zc-surface)] border-b-[3px] border-[#000] space-y-0">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2 font-display text-xs sm:text-sm text-[var(--zc-accent)] leading-none">
                <Trophy size={18} strokeWidth={2} />
                HIGH SCORES
              </SheetTitle>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reload}
                  aria-label="Refresh"
                  className="flex items-center justify-center w-8 h-8 bg-[#000] border-[3px] border-[var(--zc-muted)] text-[var(--zc-accent)] hover:bg-[var(--zc-accent)] hover:text-[#000] transition-all duration-150 active:translate-y-[1px]"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="flex items-center justify-center w-8 h-8 bg-[#000] border-[3px] border-[var(--zc-muted)] text-[var(--zc-accent2)] hover:bg-[var(--zc-accent2)] hover:text-[#000] transition-all duration-150 active:translate-y-[1px]"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </SheetHeader>

          {banner && (
            <div className="px-4 pt-3">
              <StatusBanner kind={banner} />
            </div>
          )}

          {isExample && status !== "loading" && (
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#000] border-[3px] border-[var(--zc-muted)]">
                <span className="font-display text-[8px] text-[var(--zc-muted)] leading-none tracking-wider">
                  EXAMPLE RECORDS — SET A REAL ONE
                </span>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-4 py-3">
            {showEmpty && rows.every((r) => r.example) && rows.length === 0 ? (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex flex-col items-center justify-center text-center gap-2 py-16"
              >
                <Flame size={36} strokeWidth={1.5} className="text-[var(--zc-accent2)]" />
                <span className="font-display text-[10px] text-[var(--zc-accent)] leading-relaxed">
                  BE THE FIRST TO CRASH
                </span>
                <span className="font-body text-lg text-[var(--zc-muted)]">
                  NO RECORDS YET — SET ONE
                </span>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {rows.map((row, i) => {
                    const color = rankColor(i);
                    const top = i === 0;
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                        className="flex items-center gap-3 bg-[var(--zc-surface)] border-[3px] border-[#000] px-3 py-2.5 transition-colors duration-150 hover:bg-[#23261d]"
                        style={top ? { boxShadow: "4px 4px 0 #000" } : undefined}
                      >
                        <span
                          className="font-display text-sm leading-none w-7 shrink-0 text-center flex items-center justify-center"
                          style={{ color }}
                        >
                          {top ? <Crown size={16} strokeWidth={2} /> : i + 1}
                        </span>
                        <span
                          className="font-display text-sm leading-none tracking-widest shrink-0"
                          style={{ color: top ? "#f3f315" : "#f7f7ef" }}
                        >
                          {(row.handle || "???").toUpperCase().slice(0, 3)}
                        </span>
                        <div className="flex-1 flex flex-col items-end gap-0.5 min-w-0">
                          <span
                            className="font-display text-sm sm:text-base leading-none whitespace-nowrap"
                            style={{ color, textShadow: "2px 2px 0 #000" }}
                          >
                            {formatScore(Number(row.score))}
                          </span>
                          <span className="font-body text-sm text-[var(--zc-muted)] leading-none whitespace-nowrap">
                            BIG {formatScore(Number(row.biggest_crash || 0))}
                            {row.crash_count != null && (
                              <span className="ml-2">×{Number(row.crash_count)} HITS</span>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default LeaderboardCabinet;
