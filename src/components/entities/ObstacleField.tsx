import { drawBarrier, drawWall, drawDebris, drawRival, disableSmoothing } from "../../lib/sprites";
import type { Obstacle } from "../../lib/track";
import type { AABB } from "../../lib/collision";

// Render a single obstacle onto the canvas. Pure draw helper used by GameCanvas.
export function renderObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  disableSmoothing(ctx);
  const x = o.x - o.w / 2;
  const y = o.y - o.h / 2;
  switch (o.kind) {
    case "barrier":
      drawBarrier(ctx, x, y, o.w, o.h);
      break;
    case "wall":
      drawWall(ctx, x, y, o.w, o.h);
      break;
    case "debris":
      drawDebris(ctx, x, y, o.w, o.h);
      break;
    case "rival":
      drawRival(ctx, o.x, o.y, o.w, o.h, o.id);
      break;
    default:
      drawWall(ctx, x, y, o.w, o.h);
  }
}

// Render the whole obstacle field.
export function renderObstacleField(ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) {
  for (const o of obstacles) renderObstacle(ctx, o);
}

// AABB for an obstacle (centered position -> box).
export function obstacleAABB(o: Obstacle): AABB {
  return { x: o.x, y: o.y, w: o.w, h: o.h };
}

// This module is canvas-rendered; no DOM component to mount.
export default renderObstacleField;
