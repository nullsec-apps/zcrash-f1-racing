// Lightweight reactive game store for ZCRASH — a tiny observable singleton
// holding the live game session state. Hooks subscribe via useGameStore.

import type { CrashEvent } from "./crashScoring";

export type GamePhase = "attract" | "playing" | "crashing" | "gameover";

export interface CrashPopup {
  id: number;
  label: string;
  points: number;
  combo: number;
  intensity: number;
  bornAt: number;
}

export interface GameSnapshot {
  phase: GamePhase;
  score: number;
  multiplier: number;
  crashCount: number;
  biggestCrash: number;
  maxMultiplier: number;
  damage: number; // 0..1 CRASH-O-METER fill
  startedAt: number;
  durationMs: number;
  lastCrashAt: number;
  popups: CrashPopup[];
  scoreJolt: number; // increments to retrigger jolt animation
}

function freshSnapshot(): GameSnapshot {
  return {
    phase: "attract",
    score: 0,
    multiplier: 1,
    crashCount: 0,
    biggestCrash: 0,
    maxMultiplier: 1,
    damage: 0,
    startedAt: 0,
    durationMs: 0,
    lastCrashAt: 0,
    popups: [],
    scoreJolt: 0,
  };
}

type Listener = (s: GameSnapshot) => void;

class GameStore {
  private state: GameSnapshot = freshSnapshot();
  private listeners = new Set<Listener>();
  private popupSeq = 0;

  getState(): GameSnapshot {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(patch: Partial<GameSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l(this.state);
  }

  // --- lifecycle ---
  reset() {
    this.state = freshSnapshot();
    this.emit();
  }

  startGame() {
    const now = performance.now();
    this.state = {
      ...freshSnapshot(),
      phase: "playing",
      startedAt: now,
      lastCrashAt: now,
    };
    this.emit();
  }

  setPhase(phase: GamePhase) {
    this.set({ phase });
  }

  toAttract() {
    this.reset();
  }

  gameOver() {
    if (this.state.phase === "gameover") return;
    const dur = this.state.startedAt
      ? performance.now() - this.state.startedAt
      : 0;
    this.set({ phase: "gameover", durationMs: dur });
  }

  // tick the run timer (called from loop while playing)
  tickTime() {
    if (this.state.phase !== "playing" && this.state.phase !== "crashing") return;
    if (!this.state.startedAt) return;
    this.set({ durationMs: performance.now() - this.state.startedAt });
  }

  // --- crash application ---
  applyCrash(ev: CrashEvent) {
    const now = performance.now();
    const newScore = this.state.score + ev.points;
    const newDamage = Math.min(1, this.state.damage + ev.intensity * 0.5 + 0.08);
    const popup: CrashPopup = {
      id: ++this.popupSeq,
      label: ev.label,
      points: ev.points,
      combo: ev.combo,
      intensity: ev.intensity,
      bornAt: now,
    };
    const popups = [...this.state.popups, popup].slice(-6);
    this.set({
      score: newScore,
      multiplier: ev.combo,
      maxMultiplier: Math.max(this.state.maxMultiplier, ev.combo),
      crashCount: this.state.crashCount + 1,
      biggestCrash: Math.max(this.state.biggestCrash, ev.points),
      damage: newDamage,
      lastCrashAt: now,
      popups,
      scoreJolt: this.state.scoreJolt + 1,
    });
  }

  // gradually decay the damage meter & multiplier window over time
  decay(dt: number) {
    if (this.state.phase !== "playing") return;
    const now = performance.now();
    let damage = this.state.damage;
    let multiplier = this.state.multiplier;
    // damage slowly cools so player can keep crashing
    damage = Math.max(0, damage - dt * 0.04);
    // combo expires if no crash within window
    if (multiplier > 1 && now - this.state.lastCrashAt > 2600) {
      multiplier = 1;
    }
    if (damage !== this.state.damage || multiplier !== this.state.multiplier) {
      this.set({ damage, multiplier });
    }
  }

  // prune expired popups (called from render hooks)
  prunePopups() {
    const now = performance.now();
    const popups = this.state.popups.filter((p) => now - p.bornAt < 1400);
    if (popups.length !== this.state.popups.length) {
      this.set({ popups });
    }
  }

  msSinceLastCrash(): number {
    return performance.now() - this.state.lastCrashAt;
  }
}

export const gameStore = new GameStore();
