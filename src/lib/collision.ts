// AABB collision detection + impact math helpers for ZCRASH.

export interface AABB {
  x: number; // center x
  y: number; // center y
  w: number; // half-extent handled internally; here w/h are full size
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h
  );
}

// How much two boxes overlap on each axis (penetration depth). Negative = no overlap.
export function overlapDepth(a: AABB, b: AABB): Vec2 {
  const dx = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
  const dy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
  return { x: dx, y: dy };
}

export function vecLength(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function vecNormalize(v: Vec2): Vec2 {
  const l = vecLength(v);
  if (l === 0) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

export function vecSub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vecDot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

// Resolve a player AABB out of an obstacle AABB along the minimum-penetration axis.
// Returns the corrected position + the surface normal of the contact.
export function resolveAABB(
  player: AABB,
  obstacle: AABB,
): { x: number; y: number; normal: Vec2 } {
  const depth = overlapDepth(player, obstacle);
  let nx = 0;
  let ny = 0;
  let x = player.x;
  let y = player.y;

  if (depth.x < depth.y) {
    // push along x
    if (player.x < obstacle.x) {
      x = obstacle.x - (player.w + obstacle.w) / 2;
      nx = -1;
    } else {
      x = obstacle.x + (player.w + obstacle.w) / 2;
      nx = 1;
    }
  } else {
    // push along y
    if (player.y < obstacle.y) {
      y = obstacle.y - (player.h + obstacle.h) / 2;
      ny = -1;
    } else {
      y = obstacle.y + (player.h + obstacle.h) / 2;
      ny = 1;
    }
  }
  return { x, y, normal: { x: nx, y: ny } };
}

// Impact intensity from relative velocity, masses and contact angle.
// Returns 0..1 normalized intensity plus the raw impact speed.
export function computeImpact(params: {
  relVel: Vec2; // player velocity relative to obstacle
  normal: Vec2; // contact surface normal (points toward player)
  playerMass: number;
  obstacleMass: number;
  fragility: number; // 0..1, how easily obstacle breaks (lower = harder = bigger crash)
}): { intensity: number; speed: number; normalSpeed: number } {
  const { relVel, normal, playerMass, obstacleMass, fragility } = params;
  const speed = vecLength(relVel);
  // velocity component along the contact normal = how head-on the hit is
  const normalSpeed = Math.abs(vecDot(relVel, vecNormalize(normal)));
  const massFactor = (playerMass + obstacleMass) / (playerMass * 2);
  // harder obstacles (low fragility) and head-on hits feel bigger
  const angleBoost = 0.5 + (normalSpeed / Math.max(1, speed)) * 0.5;
  const hardness = 1.2 - fragility * 0.8;
  const raw = normalSpeed * massFactor * angleBoost * hardness;
  const intensity = Math.max(0, Math.min(1, raw / 14));
  return { intensity, speed, normalSpeed };
}
