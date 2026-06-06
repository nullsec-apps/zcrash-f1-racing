// Pure crash scoring functions for ZCRASH.
// Computes points from impact intensity, classifies crash type, resolves combo + popup text.

import { clamp } from "./format";

export type CrashTier = "TAP" | "T-BONE" | "BARRIER SMASH" | "MEGA" | "CATASTROPHE";

export interface CrashEvent {
  id: number;
  intensity: number; // 0..1
  speed: number;
  basePoints: number;
  points: number; // after multiplier
  multiplier: number;
  tier: CrashTier;
  label: string; // popup label e.g. "MEGA CRASH"
  obstacleKind: ObstacleKind;
  combo: number;
  isBig: boolean; // triggers freeze-frame
}

export type ObstacleKind = "barrier" | "wall" | "debris" | "rival";

// Base point pool per obstacle kind — multiplied by intensity.
const KIND_BASE: Record<ObstacleKind, number> = {
  barrier: 4200,
  wall: 5200,
  debris: 1800,
  rival: 3600,
};

const KIND_LABEL: Record<ObstacleKind, string> = {
  barrier: "BARRIER SMASH",
  wall: "WALL WRECK",
  debris: "DEBRIS HIT",
  rival: "T-BONE",
};

// Classify an impact intensity (0..1) into a crash tier.
export function classifyTier(intensity: number): CrashTier {
  const i = clamp(intensity, 0, 1);
  if (i < 0.18) return "TAP";
  if (i < 0.42) return "T-BONE";
  if (i < 0.66) return "BARRIER SMASH";
  if (i < 0.86) return "MEGA";
  return "CATASTROPHE";
}

// Popup headline for a tier.
export function tierLabel(tier: CrashTier, kind: ObstacleKind): string {
  switch (tier) {
    case "TAP":
      return "NUDGE";
    case "T-BONE":
      return kind === "rival" ? "T-BONE" : KIND_LABEL[kind];
    case "BARRIER SMASH":
      return KIND_LABEL[kind];
    case "MEGA":
      return "MEGA CRASH";
    case "CATASTROPHE":
      return "CATASTROPHE";
  }
}

// Base points before multiplier.
export function computeBasePoints(intensity: number, kind: ObstacleKind): number {
  const i = clamp(intensity, 0, 1);
  const pool = KIND_BASE[kind];
  // quadratic ramp so big hits pay disproportionately more
  const ramped = Math.pow(i, 1.4);
  return Math.max(50, Math.round(pool * ramped));
}

// Resolve the next combo multiplier given time since last crash (ms).
// Quick consecutive crashes build combo up to a cap.
export function resolveCombo(prevCombo: number, msSinceLast: number): number {
  const COMBO_WINDOW = 2600; // ms
  const MAX = 5;
  if (msSinceLast <= COMBO_WINDOW) {
    return Math.min(MAX, prevCombo + 1);
  }
  return 1;
}

export interface ScoreCrashParams {
  id: number;
  intensity: number;
  speed: number;
  kind: ObstacleKind;
  prevCombo: number;
  msSinceLast: number;
}

// Main entry — produce a full CrashEvent from a collision.
export function scoreCrash(params: ScoreCrashParams): CrashEvent {
  const { id, intensity, speed, kind, prevCombo, msSinceLast } = params;
  const tier = classifyTier(intensity);
  const combo = resolveCombo(prevCombo, msSinceLast);
  const basePoints = computeBasePoints(intensity, kind);
  const points = Math.round(basePoints * combo);
  const isBig = tier === "MEGA" || tier === "CATASTROPHE";
  return {
    id,
    intensity: clamp(intensity, 0, 1),
    speed,
    basePoints,
    points,
    multiplier: combo,
    tier,
    label: tierLabel(tier, kind),
    obstacleKind: kind,
    combo,
    isBig,
  };
}

// Crash feed type string for DB / marquee (short, all-caps).
export function crashFeedType(ev: CrashEvent): string {
  if (ev.combo >= 3) return `${ev.label} x${ev.combo}`;
  return ev.label;
}

// Color for the popup / damage gauge based on intensity (yellow -> red).
export function intensityColor(intensity: number): string {
  const i = clamp(intensity, 0, 1);
  if (i < 0.4) return "#f3f315";
  if (i < 0.7) return "#ffae1a";
  return "#ff3b2e";
}

// Screen-shake trauma to inject for a given crash (0..1).
export function crashTrauma(ev: CrashEvent): number {
  return clamp(0.25 + ev.intensity * 0.75, 0, 1);
}

// Freeze-frame duration in ms for a crash (0 for small hits).
export function freezeFrameMs(ev: CrashEvent): number {
  if (!ev.isBig) return 0;
  return ev.tier === "CATASTROPHE" ? 150 : 110;
}

// Number of debris particles to spawn.
export function crashParticleCount(ev: CrashEvent): number {
  return Math.round(8 + ev.intensity * 34);
}
