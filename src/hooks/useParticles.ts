// Pooled debris/spark particle system for ZCRASH crash feedback.
// Spawns particles on impact with velocity, gravity, lifespan and fade,
// updated per-frame and rendered toward the camera. Ref-based (no re-renders).

import { useRef, useCallback } from "react";
import { COLORS } from "../lib/sprites";

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number; // remaining seconds
  maxLife: number;
  color: string;
  grav: number;
  scaleZ: number; // grows as it flies toward camera
}

export interface SpawnOptions {
  x: number;
  y: number;
  count: number;
  intensity: number; // 0..1
  spread?: number; // radians, default full
  baseColor?: string;
  towardCamera?: boolean; // bias velocity downward (toward viewer)
}

const POOL_SIZE = 600;

function makeParticle(): Particle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 3,
    life: 0,
    maxLife: 1,
    color: COLORS.spark,
    grav: 0,
    scaleZ: 1,
  };
}

const CRASH_COLORS = [
  COLORS.spark,
  COLORS.accent,
  COLORS.accent2,
  COLORS.debris,
  "#ffae1a",
  "#ffffff",
];

export interface ParticlesApi {
  pool: React.MutableRefObject<Particle[]>;
  spawn: (opts: SpawnOptions) => void;
  update: (dt: number) => void;
  clear: () => void;
  activeCount: () => number;
}

export function useParticles(): ParticlesApi {
  const pool = useRef<Particle[]>(
    Array.from({ length: POOL_SIZE }, makeParticle),
  );
  const cursor = useRef(0);

  const acquire = useCallback((): Particle | null => {
    const arr = pool.current;
    for (let i = 0; i < arr.length; i++) {
      const idx = (cursor.current + i) % arr.length;
      if (!arr[idx].active) {
        cursor.current = (idx + 1) % arr.length;
        return arr[idx];
      }
    }
    // pool exhausted — recycle oldest at cursor
    const p = arr[cursor.current];
    cursor.current = (cursor.current + 1) % arr.length;
    return p;
  }, []);

  const spawn = useCallback(
    (opts: SpawnOptions) => {
      const {
        x,
        y,
        count,
        intensity,
        spread = Math.PI * 2,
        baseColor,
        towardCamera = true,
      } = opts;
      const i01 = Math.max(0, Math.min(1, intensity));
      const speedBase = 90 + i01 * 360;
      for (let n = 0; n < count; n++) {
        const p = acquire();
        if (!p) continue;
        let angle: number;
        if (towardCamera) {
          // bias downward-ish toward the viewer with some lateral spread
          angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        } else {
          angle = (Math.random() - 0.5) * spread - Math.PI / 2;
        }
        const speed = speedBase * (0.4 + Math.random() * 0.6);
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 8;
        p.y = y + (Math.random() - 0.5) * 8;
        p.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 80;
        p.vy = Math.sin(angle) * speed - (towardCamera ? 30 : 0);
        p.size = 2 + Math.floor(Math.random() * (3 + i01 * 4));
        p.maxLife = 0.4 + Math.random() * (0.6 + i01 * 0.7);
        p.life = p.maxLife;
        p.grav = 420 + Math.random() * 280;
        p.scaleZ = 1;
        p.color =
          baseColor && Math.random() < 0.4
            ? baseColor
            : CRASH_COLORS[Math.floor(Math.random() * CRASH_COLORS.length)];
      }
    },
    [acquire],
  );

  const update = useCallback((dt: number) => {
    const arr = pool.current;
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // particles flying toward camera (downward) grow slightly
      if (p.vy > 0) {
        p.scaleZ += dt * 1.2;
      }
      // air drag
      p.vx *= 1 - dt * 1.2;
    }
  }, []);

  const clear = useCallback(() => {
    const arr = pool.current;
    for (let i = 0; i < arr.length; i++) arr[i].active = false;
  }, []);

  const activeCount = useCallback(() => {
    return pool.current.reduce((acc, p) => acc + (p.active ? 1 : 0), 0);
  }, []);

  return { pool, spawn, update, clear, activeCount };
}
