// Central game-state hook for ZCRASH. Subscribes to the reactive gameStore
// singleton and exposes its snapshot + lifecycle actions to React components.

import { useState, useEffect, useCallback } from "react";
import { gameStore, type GameSnapshot, type GamePhase } from "../lib/gameStore";
import type { CrashEvent } from "../lib/crashScoring";

export interface UseGameState {
  snapshot: GameSnapshot;
  phase: GamePhase;
  score: number;
  multiplier: number;
  crashCount: number;
  biggestCrash: number;
  maxMultiplier: number;
  damage: number;
  durationMs: number;
  scoreJolt: number;
  startGame: () => void;
  gameOver: () => void;
  toAttract: () => void;
  reset: () => void;
  setPhase: (p: GamePhase) => void;
  applyCrash: (ev: CrashEvent) => void;
}

export function useGameState(): UseGameState {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => gameStore.getState());

  useEffect(() => {
    setSnapshot(gameStore.getState());
    const unsub = gameStore.subscribe((s) => setSnapshot(s));
    return unsub;
  }, []);

  const startGame = useCallback(() => gameStore.startGame(), []);
  const gameOver = useCallback(() => gameStore.gameOver(), []);
  const toAttract = useCallback(() => gameStore.toAttract(), []);
  const reset = useCallback(() => gameStore.reset(), []);
  const setPhase = useCallback((p: GamePhase) => gameStore.setPhase(p), []);
  const applyCrash = useCallback((ev: CrashEvent) => gameStore.applyCrash(ev), []);

  return {
    snapshot,
    phase: snapshot.phase,
    score: snapshot.score,
    multiplier: snapshot.multiplier,
    crashCount: snapshot.crashCount,
    biggestCrash: snapshot.biggestCrash,
    maxMultiplier: snapshot.maxMultiplier,
    damage: snapshot.damage,
    durationMs: snapshot.durationMs,
    scoreJolt: snapshot.scoreJolt,
    startGame,
    gameOver,
    toAttract,
    reset,
    setPhase,
    applyCrash,
  };
}
