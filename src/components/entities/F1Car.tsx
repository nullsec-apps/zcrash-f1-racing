// Logical F1 car entity for ZCRASH.
// The car is actually drawn into the game canvas via drawF1Car (src/lib/sprites.ts);
// this module exposes the entity helpers + a small DOM badge used by the
// attract/preview surfaces so the ZCASH livery is consistent everywhere.

import { useEffect, useRef } from "react";
import { drawF1Car, disableSmoothing } from "../../lib/sprites";
import type { CarState } from "../../hooks/useCarPhysics";
import type { AABB } from "../../lib/collision";

// Render a car's current state into a canvas 2d context (called from GameCanvas).
export function renderF1Car(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  t: number,
) {
  drawF1Car(ctx, car.x, car.y, car.w, car.h, car.heading, car.damage, t);
}

// Bounding box for collision (mirrors useCarPhysics.getAABB).
export function carAABB(car: CarState): AABB {
  return { x: car.x, y: car.y, w: car.w, h: car.h };
}

export interface F1CarBadgeProps {
  size?: number;
  damage?: number;
  className?: string;
}

// Small standalone canvas badge rendering the ZCASH livery car (for previews).
export function F1CarBadge({ size = 64, damage = 0, className }: F1CarBadgeProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    disableSmoothing(ctx);

    let start = performance.now();
    const loop = (now: number) => {
      ctx.clearRect(0, 0, size, size);
      const w = size * 0.42;
      const h = w * 1.9;
      const t = now - start;
      // slight bob so the badge feels alive
      const bob = Math.sin(t * 0.004) * 2;
      drawF1Car(ctx, size / 2, size / 2 + bob, w, h, 0, damage, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, damage]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "block",
      }}
      aria-label="ZCASH F1 car"
    />
  );
}

export default F1CarBadge;
