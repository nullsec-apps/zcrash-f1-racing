// Fetches top scores from app_{projectId}_scores ordered by score DESC,
// subscribes to realtime INSERTs, and exposes loading/empty/error/offline states.
// Degrades gracefully with clearly-marked example rows while the table is empty.

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, subscribeToTable } from "../lib/supabase";

export interface LeaderboardRow {
  id: string;
  handle: string;
  score: number;
  biggest_crash: number | null;
  crash_count: number | null;
  max_multiplier: number | null;
  duration_ms: number | null;
  created_at: string;
  example?: boolean;
}

export type LeaderboardStatus = "loading" | "ready" | "empty" | "error" | "offline";

function projectId(): string {
  return (window as any).__NULLSEC__?.projectId || "demo";
}
function tableName(): string {
  return `app_${projectId()}_scores`;
}

// Clearly-marked example rows shown ONLY while the real table is empty.
const EXAMPLE_ROWS: LeaderboardRow[] = [
  {
    id: "ex-1",
    handle: "PSY",
    score: 48920,
    biggest_crash: 9200,
    crash_count: 14,
    max_multiplier: 5,
    duration_ms: 64000,
    created_at: new Date(Date.now() - 300000).toISOString(),
    example: true,
  },
  {
    id: "ex-2",
    handle: "DEG",
    score: 31400,
    biggest_crash: 6100,
    crash_count: 11,
    max_multiplier: 4,
    duration_ms: 52000,
    created_at: new Date(Date.now() - 600000).toISOString(),
    example: true,
  },
  {
    id: "ex-3",
    handle: "RKT",
    score: 22750,
    biggest_crash: 5400,
    crash_count: 9,
    max_multiplier: 3,
    duration_ms: 41000,
    created_at: new Date(Date.now() - 900000).toISOString(),
    example: true,
  },
  {
    id: "ex-4",
    handle: "VRM",
    score: 15300,
    biggest_crash: 4200,
    crash_count: 7,
    max_multiplier: 3,
    duration_ms: 33000,
    created_at: new Date(Date.now() - 1200000).toISOString(),
    example: true,
  },
  {
    id: "ex-5",
    handle: "BNZ",
    score: 9840,
    biggest_crash: 3100,
    crash_count: 5,
    max_multiplier: 2,
    duration_ms: 26000,
    created_at: new Date(Date.now() - 1500000).toISOString(),
    example: true,
  },
];

export interface UseLeaderboard {
  rows: LeaderboardRow[];
  status: LeaderboardStatus;
  isExample: boolean;
  topScore: number;
  topHandle: string;
  reload: () => void;
}

export function useLeaderboard(): UseLeaderboard {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>("loading");
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setStatus("loading");
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (mounted.current) {
        setRows(EXAMPLE_ROWS);
        setStatus("offline");
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from(tableName())
        .select("*")
        .order("score", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (!mounted.current) return;
      if (!data || data.length === 0) {
        setRows(EXAMPLE_ROWS);
        setStatus("empty");
      } else {
        setRows(data as LeaderboardRow[]);
        setStatus("ready");
      }
    } catch {
      if (!mounted.current) return;
      setRows(EXAMPLE_ROWS);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToTable(
        "scores",
        (payload: any) => {
          const row = payload.new as LeaderboardRow;
          if (!row) return;
          setRows((prev) => {
            const cleaned = prev.filter((r) => !r.example);
            if (cleaned.some((r) => r.id === row.id)) return prev;
            const merged = [...cleaned, row].sort(
              (a, b) => Number(b.score) - Number(a.score),
            );
            return merged.slice(0, 50);
          });
          setStatus((s) => (s === "loading" ? s : "ready"));
        },
        { event: "INSERT" },
      );
    } catch {
      /* realtime optional */
    }
    return () => {
      mounted.current = false;
      if (unsub) unsub();
    };
  }, [load]);

  const isExample = rows.length > 0 && rows.every((r) => r.example);
  const topScore = rows.length > 0 ? Number(rows[0].score) : 0;
  const topHandle = rows.length > 0 ? rows[0].handle : "---";

  return { rows, status, isExample, topScore, topHandle, reload: load };
}
