// Inserts a finished ZCRASH run into app_{projectId}_scores with optimistic UI
// and graceful error/offline handling. Returns submit state for GameOverPanel.

import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { sanitizeHandle } from "../lib/format";

export type SubmitStatus = "idle" | "submitting" | "success" | "error" | "offline";

export interface SubmitRunPayload {
  handle: string;
  score: number;
  biggest_crash?: number;
  crash_count?: number;
  max_multiplier?: number;
  duration_ms?: number;
}

function projectId(): string {
  return (window as any).__NULLSEC__?.projectId || "demo";
}
function tableName(): string {
  return `app_${projectId()}_scores`;
}

export interface UseSubmitScore {
  status: SubmitStatus;
  error: string | null;
  submittedId: string | null;
  submit: (payload: SubmitRunPayload) => Promise<boolean>;
  reset: () => void;
}

export function useSubmitScore(): UseSubmitScore {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const inFlight = useRef(false);

  const submit = useCallback<UseSubmitScore["submit"]>(async (payload) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setError(null);

    const handle = sanitizeHandle(payload.handle) || "AAA";

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      setError("PLAYING LOCAL — SCORES NOT SAVED");
      inFlight.current = false;
      return false;
    }

    setStatus("submitting");
    const row = {
      handle,
      score: Math.max(0, Math.round(payload.score)),
      biggest_crash: Math.max(0, Math.round(payload.biggest_crash ?? 0)),
      crash_count: Math.max(0, Math.round(payload.crash_count ?? 0)),
      max_multiplier: Math.max(1, Math.round(payload.max_multiplier ?? 1)),
      duration_ms: Math.max(0, Math.round(payload.duration_ms ?? 0)),
    };

    try {
      const { data, error: err } = await supabase
        .from(tableName())
        .insert(row)
        .select("id")
        .single();
      if (err) throw err;
      setSubmittedId((data as any)?.id ?? null);
      setStatus("success");
      inFlight.current = false;
      return true;
    } catch (e: any) {
      setStatus("error");
      setError("CONNECTION LOST — SCORE NOT SAVED");
      inFlight.current = false;
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setSubmittedId(null);
    inFlight.current = false;
  }, []);

  return { status, error, submittedId, submit, reset };
}
