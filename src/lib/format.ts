// Pixel number / handle / time formatting for ZCRASH.

export function formatScore(n: number): string {
  const v = Math.max(0, Math.floor(n));
  return v.toLocaleString("en-US");
}

// Pad score to fixed width for the arcade glyph readout (e.g. 0008420)
export function padScore(n: number, width = 7): string {
  const v = Math.max(0, Math.floor(n));
  return v.toString().padStart(width, "0");
}

export function formatPoints(n: number): string {
  const v = Math.floor(n);
  return (v >= 0 ? "+" : "") + v.toLocaleString("en-US");
}

// Sanitize a handle to up to 3 uppercase A-Z letters.
export function sanitizeHandle(raw: string): string {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

export function padHandle(handle: string): string {
  return sanitizeHandle(handle).padEnd(3, "_");
}

// Run duration in ms -> M:SS or SS.s
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, ms) / 1000;
  if (totalSec < 60) {
    return totalSec.toFixed(1) + "s";
  }
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMultiplier(m: number): string {
  return "x" + Math.max(1, Math.round(m));
}

// "3 minutes ago" style for the crash feed / leaderboard
export function timeAgo(iso: string | number | Date): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "NOW";
  if (sec < 60) return sec + "s";
  const min = Math.floor(sec / 60);
  if (min < 60) return min + "m";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h";
  const d = Math.floor(hr / 24);
  return d + "d";
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
