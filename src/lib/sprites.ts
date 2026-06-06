// Procedural pixel sprite drawing for ZCRASH (no external assets).
// All draw helpers disable image smoothing and render the ZCASH yellow/black livery.

export const COLORS = {
  bg: "#0c0d0a",
  surface: "#1a1c15",
  text: "#f7f7ef",
  muted: "#7d8466",
  accent: "#f3f315",
  accent2: "#ff3b2e",
  carBody: "#0c0d0a",
  carAccent: "#f3f315",
  tyre: "#111111",
  rim: "#ff3b2e",
  asphalt: "#3a3d34",
  asphaltDark: "#2c2f27",
  kerbA: "#f3f315",
  kerbB: "#222218",
  barrier: "#9aa07a",
  concrete: "#6f7560",
  debris: "#b6915a",
  rival: "#ff3b2e",
  rival2: "#3aa0ff",
  grandstand: "#23261d",
  smoke: "#c9c9bf",
  spark: "#ffd23b",
};

export function disableSmoothing(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Draw the ZCASH livery F1 car. Car faces UP (-y) by default; rotation in radians.
 * damage 0..1 adds dents/sparks. carW/carH are full sizes in px.
 */
export function drawF1Car(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  damage: number,
  t: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  disableSmoothing(ctx);

  const hw = w / 2;
  const hh = h / 2;

  // tyres (black with red rim) — 4 corners
  const tw = w * 0.26;
  const th = h * 0.22;
  const tyrePositions = [
    [-hw, -hh * 0.5],
    [hw - tw, -hh * 0.5],
    [-hw, hh * 0.5 - th],
    [hw - tw, hh * 0.5 - th],
  ];
  for (const [tx, ty] of tyrePositions) {
    px(ctx, tx, ty, tw, th, COLORS.tyre);
    px(ctx, tx + tw * 0.3, ty + th * 0.3, tw * 0.4, th * 0.4, COLORS.rim);
  }

  // main chassis (black)
  px(ctx, -hw * 0.55, -hh, hw * 1.1, h, COLORS.carBody);
  // nose cone (yellow tip)
  px(ctx, -hw * 0.3, -hh, hw * 0.6, hh * 0.45, COLORS.carAccent);
  // front wing (yellow)
  px(ctx, -hw * 0.85, -hh - h * 0.06, hw * 1.7, h * 0.08, COLORS.carAccent);
  // side pods (yellow stripes)
  px(ctx, -hw * 0.55, -hh * 0.1, hw * 0.16, h * 0.4, COLORS.carAccent);
  px(ctx, hw * 0.39, -hh * 0.1, hw * 0.16, h * 0.4, COLORS.carAccent);
  // cockpit (dark)
  px(ctx, -hw * 0.18, -hh * 0.25, hw * 0.36, hh * 0.5, "#000");
  // halo / driver hint
  px(ctx, -hw * 0.08, -hh * 0.1, hw * 0.16, hh * 0.2, COLORS.muted);
  // rear wing (yellow)
  px(ctx, -hw * 0.7, hh - h * 0.04, hw * 1.4, h * 0.1, COLORS.carAccent);
  // central black accent strip
  px(ctx, -hw * 0.06, -hh, hw * 0.12, h, "#000");

  // damage dents (red bites along the body)
  if (damage > 0.15) {
    const dents = Math.floor(damage * 6);
    for (let i = 0; i < dents; i++) {
      const dx = -hw * 0.5 + ((i * 37) % (hw)) ;
      const dy = -hh * 0.6 + ((i * 53) % (h * 0.9));
      px(ctx, dx, dy, 3, 3, COLORS.accent2);
    }
  }
  // sparks when heavily damaged
  if (damage > 0.5) {
    for (let i = 0; i < 4; i++) {
      const flick = (Math.sin(t * 0.05 + i * 2) + 1) / 2;
      if (flick > 0.5) {
        px(ctx, -hw + Math.random() * w, hh - 2 + Math.random() * 4, 2, 2, COLORS.spark);
      }
    }
  }

  ctx.restore();
}

// Tyre-wall barrier block
export function drawBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  disableSmoothing(ctx);
  px(ctx, x, y, w, h, COLORS.kerbB);
  // alternating yellow/black tyre stack
  const seg = Math.max(6, Math.floor(w / 4));
  for (let i = 0; i * seg < w; i++) {
    px(ctx, x + i * seg, y, seg - 1, h, i % 2 === 0 ? COLORS.barrier : COLORS.accent);
  }
  px(ctx, x, y, w, 2, "#000");
  px(ctx, x, y + h - 2, w, 2, "#000");
}

// Concrete wall
export function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  disableSmoothing(ctx);
  px(ctx, x, y, w, h, COLORS.concrete);
  for (let i = 0; i * 10 < w; i++) {
    px(ctx, x + i * 10, y + (i % 2) * (h / 2), 1, h / 2, "#54584a");
  }
  px(ctx, x, y, w, 2, "#8a8f78");
  px(ctx, x, y + h - 2, w, 2, "#000");
}

// Debris pile
export function drawDebris(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  disableSmoothing(ctx);
  const cols = [COLORS.debris, COLORS.accent2, "#7a5e34", COLORS.muted];
  for (let i = 0; i < 6; i++) {
    const dx = x + ((i * 29) % w);
    const dy = y + ((i * 17) % h);
    px(ctx, dx, dy, 4 + (i % 3) * 2, 4 + (i % 2) * 3, cols[i % cols.length]);
  }
}

// AI rival car (faces UP). variant picks color.
export function drawRival(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number,
) {
  ctx.save();
  ctx.translate(x, y);
  disableSmoothing(ctx);
  const hw = w / 2;
  const hh = h / 2;
  const body = variant % 2 === 0 ? COLORS.rival : COLORS.rival2;
  const tw = w * 0.26;
  const th = h * 0.22;
  const tyrePositions = [
    [-hw, -hh * 0.5],
    [hw - tw, -hh * 0.5],
    [-hw, hh * 0.5 - th],
    [hw - tw, hh * 0.5 - th],
  ];
  for (const [tx, ty] of tyrePositions) {
    px(ctx, tx, ty, tw, th, COLORS.tyre);
  }
  px(ctx, -hw * 0.55, -hh, hw * 1.1, h, body);
  px(ctx, -hw * 0.85, -hh - h * 0.05, hw * 1.7, h * 0.07, "#000");
  px(ctx, -hw * 0.18, -hh * 0.25, hw * 0.36, hh * 0.5, "#000");
  px(ctx, -hw * 0.7, hh - h * 0.04, hw * 1.4, h * 0.09, "#000");
  ctx.restore();
}

// Grandstand backdrop strip (drawn at top of track)
export function drawGrandstand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, scroll: number) {
  disableSmoothing(ctx);
  px(ctx, x, y, w, h, COLORS.grandstand);
  // crowd specks
  const cols = [COLORS.accent2, COLORS.rival2, COLORS.text, COLORS.accent];
  const off = Math.floor(scroll * 0.3) % 8;
  for (let i = 0; i < w / 6; i++) {
    const cx = x + ((i * 6 + off) % w);
    const cy = y + 4 + ((i * 13) % (h - 6));
    px(ctx, cx, cy, 2, 2, cols[i % cols.length]);
  }
  px(ctx, x, y + h - 3, w, 3, "#000");
}

// A single particle (debris/spark) — draws a small square.
export function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  disableSmoothing(ctx);
  px(ctx, x - size / 2, y - size / 2, size, size, color);
  ctx.restore();
}
