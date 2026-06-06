// Procedural scrolling-track generation for ZCRASH.
// Lanes, kerbs, barrier walls, grandstand backdrop, difficulty ramp over time.

import type { ObstacleKind } from "./crashScoring";

export interface TrackConfig {
  width: number;
  height: number;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number; // center x (world)
  y: number; // center y (world, scrolls down toward camera)
  w: number;
  h: number;
  mass: number;
  fragility: number; // 0..1, lower = harder = bigger crash
  vx: number; // lateral drift (rivals)
  vy: number; // forward speed relative to track
  destroyed: boolean;
  variant: number;
}

export interface TrackBounds {
  left: number; // playable inner-left edge x
  right: number; // playable inner-right edge x
  wallThickness: number;
}

// Track geometry: outer barriers hug the canvas edges, leaving a playable lane band.
export function getTrackBounds(width: number): TrackBounds {
  const wallThickness = Math.max(28, Math.round(width * 0.07));
  const margin = Math.round(width * 0.12);
  return {
    left: margin,
    right: width - margin,
    wallThickness,
  };
}

// Difficulty 0..1 ramping with elapsed seconds (caps ~90s).
export function difficultyAt(elapsedMs: number): number {
  const sec = elapsedMs / 1000;
  return Math.min(1, sec / 90);
}

// Scroll speed (world px per second) for the track based on difficulty.
export function scrollSpeedAt(difficulty: number): number {
  return 280 + difficulty * 360;
}

// Spawn interval (ms) between obstacles — tightens with difficulty.
export function spawnIntervalAt(difficulty: number): number {
  return Math.max(420, 1100 - difficulty * 620);
}

const KIND_DEFS: Record<
  ObstacleKind,
  { mass: number; fragility: number; w: [number, number]; h: [number, number] }
> = {
  barrier: { mass: 4, fragility: 0.55, w: [60, 120], h: [22, 30] },
  wall: { mass: 9, fragility: 0.2, w: [70, 140], h: [26, 34] },
  debris: { mass: 1.2, fragility: 0.9, w: [26, 46], h: [22, 38] },
  rival: { mass: 3, fragility: 0.65, w: [30, 38], h: [56, 70] },
};

// Weighted random kind selection; harder targets appear more as difficulty climbs.
export function pickKind(difficulty: number, rng: () => number): ObstacleKind {
  const r = rng();
  // base weights
  const debris = 0.34 - difficulty * 0.14;
  const barrier = 0.3;
  const rival = 0.18 + difficulty * 0.12;
  // wall fills remainder
  const tDebris = debris;
  const tBarrier = tDebris + barrier;
  const tRival = tBarrier + rival;
  if (r < tDebris) return "debris";
  if (r < tBarrier) return "barrier";
  if (r < tRival) return "rival";
  return "wall";
}

let seq = 1;

function randIn(rng: () => number, range: [number, number]): number {
  return range[0] + rng() * (range[1] - range[0]);
}

// Spawn one obstacle above the visible area (negative-ish y) within track bounds.
export function spawnObstacle(
  cfg: TrackConfig,
  difficulty: number,
  rng: () => number = Math.random,
): Obstacle {
  const bounds = getTrackBounds(cfg.width);
  const kind = pickKind(difficulty, rng);
  const def = KIND_DEFS[kind];
  const w = Math.round(randIn(rng, def.w));
  const h = Math.round(randIn(rng, def.h));
  const innerLeft = bounds.left + w / 2 + 6;
  const innerRight = bounds.right - w / 2 - 6;
  const x = innerLeft + rng() * (innerRight - innerLeft);
  const y = -h - 20 - rng() * 80;

  let vx = 0;
  let vy = 0;
  if (kind === "rival") {
    vx = (rng() < 0.5 ? -1 : 1) * (20 + rng() * 50 + difficulty * 40);
    vy = 40 + rng() * 60; // rivals move slightly forward (slower than track)
  }

  return {
    id: seq++,
    kind,
    x,
    y,
    w,
    h,
    mass: def.mass,
    fragility: def.fragility,
    vx,
    vy,
    destroyed: false,
    variant: Math.floor(rng() * 4),
  };
}

// Advance an obstacle one tick. trackScroll is downward world movement (px).
export function updateObstacle(
  o: Obstacle,
  dt: number,
  trackScroll: number,
  bounds: TrackBounds,
): void {
  o.y += trackScroll + o.vy * dt;
  o.x += o.vx * dt;
  // bounce rivals off inner walls
  const minX = bounds.left + o.w / 2;
  const maxX = bounds.right - o.w / 2;
  if (o.x < minX) {
    o.x = minX;
    o.vx = Math.abs(o.vx);
  } else if (o.x > maxX) {
    o.x = maxX;
    o.vx = -Math.abs(o.vx);
  }
}

// Kerb stripe phase for animated track scroll.
export function kerbPhase(scroll: number): number {
  return scroll % 32;
}

export function resetObstacleSeq(): void {
  seq = 1;
}
