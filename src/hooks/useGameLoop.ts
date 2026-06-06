// Manages the requestAnimationFrame loop with fixed-timestep updates and delta
// interpolation; ticks physics, spawning, collision checks, particles and camera
// shake, and pauses/resumes on game state changes. Supports freeze-frame.

import { useRef, useEffect, useCallback } from "react";

export interface FrameContext {
  dt: number; // fixed step seconds
  now: number; // performance.now() ms
  alpha: number; // interpolation factor (unused for pixel game but provided)
}

export interface UseGameLoopOptions {
  // called once per fixed update step
  onUpdate: (ctx: FrameContext) => void;
  // called once per animation frame after updates (for rendering)
  onRender?: (interp: number, now: number) => void;
  running: boolean;
  fixedStep?: number; // seconds, default 1/60
}

export interface GameLoopApi {
  freeze: (ms: number) => void;
}

export function useGameLoop(opts: UseGameLoopOptions): GameLoopApi {
  const { onUpdate, onRender, running, fixedStep = 1 / 60 } = opts;

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const accRef = useRef(0);
  const freezeUntilRef = useRef(0);

  // keep latest callbacks without re-subscribing the loop
  const updateRef = useRef(onUpdate);
  const renderRef = useRef(onRender);
  const runningRef = useRef(running);
  updateRef.current = onUpdate;
  renderRef.current = onRender;
  runningRef.current = running;

  const freeze = useCallback((ms: number) => {
    if (ms <= 0) return;
    freezeUntilRef.current = performance.now() + ms;
  }, []);

  useEffect(() => {
    const MAX_STEPS = 5;
    let mounted = true;

    const frame = (time: number) => {
      if (!mounted) return;
      rafRef.current = requestAnimationFrame(frame);

      if (lastRef.current === 0) {
        lastRef.current = time;
        return;
      }
      let delta = (time - lastRef.current) / 1000;
      lastRef.current = time;
      // clamp big delta (tab switch)
      if (delta > 0.25) delta = 0.25;

      const frozen = time < freezeUntilRef.current;

      if (runningRef.current && !frozen) {
        accRef.current += delta;
        let steps = 0;
        while (accRef.current >= fixedStep && steps < MAX_STEPS) {
          updateRef.current({
            dt: fixedStep,
            now: time,
            alpha: 0,
          });
          accRef.current -= fixedStep;
          steps++;
        }
        if (steps >= MAX_STEPS) accRef.current = 0;
      } else {
        // not running or frozen — drain accumulator so we don't burst-update on resume
        accRef.current = 0;
      }

      // always render (so freeze-frame + shake decay still draw)
      if (renderRef.current) {
        const interp = fixedStep > 0 ? accRef.current / fixedStep : 0;
        renderRef.current(interp, time);
      }
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
      accRef.current = 0;
    };
  }, [fixedStep]);

  return { freeze };
}
