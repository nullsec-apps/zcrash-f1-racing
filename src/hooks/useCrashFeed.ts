// Loads recent notable crashes from app_{projectId}_crash_feed, subscribes to
// realtime INSERTs for the marquee, and pushes the player's own big crashes.
// Degrades gracefully (offline / error) with clearly-marked example fallback.

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, subscribeToTable } from "../lib/supabase";

export interface CrashFeedRow {
  id: string;
  handle: string | null;
  crash_type: string;
  points: number;
  combo: number | null;
  created_at: string;
  example?: boolean;
}

export type FeedStatus = "loading" | "ready" | "empty" | "error" | "offline";

function projectId(): string {
  return (window as any).__NULLSEC__?.projectId || "demo";
}
function tableName(): string {
  return `app_${projectId()}_crash_feed`;
}

// Clearly-marked example entries shown ONLY while the real table is empty.
const EXAMPLE_FEED: CrashFeedRow[] = [
  {
    id: "ex-1",
    handle: "PSY",
    crash_type: "T-BONE",
    points: 3100,
    combo: 1,
    created_at: new Date(Date.now() - 60000).toISOString(),
    example: true,
  },
  {
    id: "ex-2",
    handle: "DEG",
    crash_type: "BARRIER SMASH",
    points: 5800,
    combo: 1,
    created_at: new Date(Date.now() - 120000).toISOString(),
    example: true,
  },
  {
    id: "ex-3",
    handle: "RKT",
    crash_type: "DEBRIS COMBO x3",
    points: 4200,
    combo: 3,
    created_at: new Date(Date.now() - 200000).toISOString(),
    example: true,
  },
];

export interface UseCrashFeed {
  feed: CrashFeedRow[];
  status: FeedStatus;
  isExample: boolean;
  reload: () => void;
  pushCrash: (entry: {
    handle?: string | null;
    crash_type: string;
    points: number;
    combo?: number;
  }) => Promise<void>;
}

export function useCrashFeed(): UseCrashFeed {
  const [feed, setFeed] = useState<CrashFeedRow[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setStatus("loading");
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (mounted.current) {
        setFeed(EXAMPLE_FEED);
        setStatus("offline");
      }
      return;
    }
    try {
      const { data, error } = await supabase
        .from(tableName())
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      if (!mounted.current) return;
      if (!data || data.length === 0) {
        setFeed(EXAMPLE_FEED);
        setStatus("empty");
      } else {
        setFeed(data as CrashFeedRow[]);
        setStatus("ready");
      }
    } catch {
      if (!mounted.current) return;
      setFeed(EXAMPLE_FEED);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToTable(
        "crash_feed",
        (payload: any) => {
          const row = payload.new as CrashFeedRow;
          if (!row) return;
          setFeed((prev) => {
            const cleaned = prev.filter((r) => !r.example);
            if (cleaned.some((r) => r.id === row.id)) return prev;
            return [row, ...cleaned].slice(0, 25);
          });
          setStatus((s) => (s === "ready" ? s : "ready"));
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

  const pushCrash = useCallback<UseCrashFeed["pushCrash"]>(
    async (entry) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      try {
        await supabase.from(tableName()).insert({
          handle: entry.handle ?? null,
          crash_type: entry.crash_type,
          points: Math.max(0, Math.round(entry.points)),
          combo: entry.combo ?? 1,
        });
      } catch {
        /* swallow — feed is best-effort */
      }
    },
    [],
  );

  const isExample = feed.length > 0 && feed.every((r) => r.example);

  return { feed, status, isExample, reload: load, pushCrash };
}
