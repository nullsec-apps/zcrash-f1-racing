// Trauma-based camera shake + chromatic-jitter for ZCRASH.
// Trauma is added on impact (0..1), decays over time, and shake magnitude
// scales with trauma^2 so big hits feel disproportionately violent.
// Ref-based so the game loop can read offsets without React re-renders.

import { useRef, useCallback } from "react";

export interface ShakeOffset {
  x: number;
  y: number;
  rot: number;
  chroma: number; // chromatic-aberration magnitude in px (0..)
  trauma: number; // current trauma 0..1
}

export interface ScreenShakeApi {
  trauma: React.MutableRefObject<number>;
  offset: React.MutableRefObject<ShakeOffset>;
  add: (amount: number) => void;
  update: (dt: number) => ShakeOffset;
  reset: () => void;
}

const MAX_SHAKE_PX = 22;
const MAX_ROT = 0.05; // radians
const MAX_CHROMA = 6;
const DECAY_PER_SEC = 1.6;

// cheap value-noise for smooth shake instead of pure random jitter
function noise(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

export function useScreenShake(): ScreenShakeApi {
  const trauma = useRef(0);
  const tRef = useRef(0);
  const offset = useRef<ShakeOffset>({
    x: 0,
    y: 0,
    rot: 0,
    chroma: 0,
    trauma: 0,
  });

  const add = useCallback((amount: number) => {
    trauma.current = Math.min(1, trauma.current + Math.max(0, amount));
  }, []);

  const update = useCallback((dt: number): ShakeOffset => {
    tRef.current += dt;
    // decay trauma
    trauma.current = Math.max(0, trauma.current - DECAY_PER_SEC * dt);
    const shake = trauma.current * trauma.current; // quadratic feel
    const t = tRef.current * 60;
    const o = offset.current;
    if (shake <= 0.0005) {
      o.x = 0;
      o.y = 0;
      o.rot = 0;
      o.chroma = 0;
      o.trauma = 0;
      return o;
    }
    o.x = noise(t * 0.9 + 1.3) * MAX_SHAKE_PX * shake;
    o.y = noise(t * 1.1 + 7.7) * MAX_SHAKE_PX * shake;
    o.rot = noise(t * 0.7 + 3.3) * MAX_ROT * shake;
    o.chroma = MAX_CHROMA * shake;
    o.trauma = trauma.current;
    return o;
  }, []);

  const reset = useCallback(() => {
    trauma.current = 0;
    tRef.current = 0;
    offset.current = { x: 0, y: 0, rot: 0, chroma: 0, trauma: 0 };
  }, []);

  return { trauma, offset, add, update, reset };
}
