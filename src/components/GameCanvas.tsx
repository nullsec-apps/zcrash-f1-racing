import { useEffect, useRef, useCallback } from "react";
import { useGameState } from "../hooks/useGameState";
import { useCarPhysics } from "../hooks/useCarPhysics";
import { useGameControls } from "../hooks/useGameControls";
import { useParticles } from "../hooks/useParticles";
import { useScreenShake } from "../hooks/useScreenShake";
import { useCrashPhysics } from "../hooks/useCrashPhysics";
import { useGameLoop } from "../hooks/useGameLoop";
import { useCrashFeed } from "../hooks/useCrashFeed";
import { gameStore } from "../lib/gameStore";
import {
  COLORS,
  disableSmoothing,
  drawGrandstand,
  drawParticle,
} from "../lib/sprites";
import { renderF1Car } from "./entities/F1Car";
import { renderObstacle, obstacleAABB } from "./entities/ObstacleField";
import {
  getTrackBounds,
  difficultyAt,
  scrollSpeedAt,
  spawnIntervalAt,
  spawnObstacle,
  updateObstacle,
  resetObstacleSeq,
  type Obstacle,
  type TrackBounds,
  type TrackConfig,
} from "../lib/track";
import { aabbOverlap } from "../lib/collision";
import { startEngine, updateEngine, stopEngine } from "../lib/audio";
import { crashFeedType, type CrashEvent } from "../lib/crashScoring";

export interface GameCanvasProps {
  controls: ReturnType<typeof useGameControls>;
  ghostMode?: boolean;
}

export function GameCanvas({ controls, ghostMode = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ w: 800, h: 600, dpr: 1 });
  const scrollRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const boundsRef = useRef<TrackBounds>(getTrackBounds(800));
  const ghostTimerRef = useRef(0);
  const ghostInputRef = useRef({ steer: 0, throttle: 1, brake: 0 });
  const initializedPhase = useRef<string>("");

  const { snapshot, gameOver } = useGameState();
  const car = useCarPhysics();
  const particles = useParticles();
  const shake = useScreenShake();
  const crash = useCrashPhysics();
  const { pushCrash } = useCrashFeed();

  const phaseRef = useRef(snapshot.phase);
  phaseRef.current = snapshot.phase;

  // --- resize / DPR setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      sizeRef.current = { w, h, dpr };
      boundsRef.current = getTrackBounds(w);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, []);

  // --- engine audio lifecycle ---
  useEffect(() => {
    if (snapshot.phase === "playing") {
      startEngine();
    } else {
      stopEngine();
    }
    return () => stopEngine();
  }, [snapshot.phase]);

  // --- init/reset on phase transitions ---
  useEffect(() => {
    const { w, h } = sizeRef.current;
    if (snapshot.phase === "playing" && initializedPhase.current !== "playing") {
      car.init(w, h);
      car.reset(w, h);
      obstaclesRef.current = [];
      resetObstacleSeq();
      scrollRef.current = 0;
      lastSpawnRef.current = 0;
      particles.clear();
      shake.reset();
      crash.reset();
      initializedPhase.current = "playing";
    } else if (snapshot.phase === "attract") {
      car.init(w, h);
      car.reset(w, h);
      obstaclesRef.current = [];
      resetObstacleSeq();
      scrollRef.current = 0;
      ghostTimerRef.current = 0;
      initializedPhase.current = "attract";
    } else if (snapshot.phase === "gameover") {
      initializedPhase.current = "gameover";
    }
  }, [snapshot.phase, car, particles, shake, crash]);

  const onBigCrash = useCallback(
    (ev: CrashEvent) => {
      if (ghostMode) return;
      if (ev.points < 3000) return;
      pushCrash({
        handle: null,
        crash_type: crashFeedType(ev),
        points: ev.points,
        combo: ev.combo,
      });
    },
    [ghostMode, pushCrash],
  );

  // --- fixed-step update ---
  const onUpdate = useCallback(
    (ctx: { dt: number; now: number }) => {
      const { dt, now } = ctx;
      const { w, h } = sizeRef.current;
      const phase = phaseRef.current;
      const bounds = boundsRef.current;
      const cfg: TrackConfig = { width: w, height: h };

      // attract ghost car loop
      if (phase === "attract" || ghostMode) {
        ghostTimerRef.current += dt;
        const gt = ghostTimerRef.current;
        // weave then crash and respawn
        ghostInputRef.current.steer = Math.sin(gt * 1.4) * 0.8;
        ghostInputRef.current.throttle = 1;
        ghostInputRef.current.brake = 0;
        const difficulty = 0.3;
        const scroll = scrollSpeedAt(difficulty) * dt;
        scrollRef.current += scroll;
        car.update(ghostInputRef.current, dt, bounds);
        // spawn a few obstacles
        lastSpawnRef.current += dt * 1000;
        if (lastSpawnRef.current >= 900) {
          lastSpawnRef.current = 0;
          obstaclesRef.current.push(spawnObstacle(cfg, difficulty));
        }
        const list = obstaclesRef.current;
        for (const o of list) updateObstacle(o, dt, scroll, bounds);
        // collisions -> ghost self-destruct visual
        const carBox = car.getAABB();
        for (const o of list) {
          if (o.destroyed) continue;
          if (aabbOverlap(carBox, obstacleAABB(o))) {
            const c = car.car.current;
            particles.spawn({
              x: c.x,
              y: c.y,
              count: 18,
              intensity: 0.6,
              baseColor: COLORS.accent,
            });
            shake.add(0.6);
            o.destroyed = true;
            car.addDamage(0.5);
          }
        }
        obstaclesRef.current = list.filter((o) => o.y < h + 80 && !o.destroyed);
        // respawn ghost when destroyed
        if (car.car.current.damage >= 1 || gt > 6) {
          ghostTimerRef.current = 0;
          car.reset(w, h);
          obstaclesRef.current = [];
        }
        particles.update(dt);
        return;
      }

      if (phase !== "playing") {
        particles.update(dt);
        return;
      }

      // --- playing ---
      gameStore.tickTime();
      gameStore.decay(dt);
      gameStore.prunePopups();

      const elapsed = snapshot.startedAt ? performance.now() - snapshot.startedAt : 0;
      const difficulty = difficultyAt(elapsed);
      const scroll = scrollSpeedAt(difficulty) * dt;
      scrollRef.current += scroll;

      const input = ghostMode ? ghostInputRef.current : controls.input.current;
      car.update(input, dt, bounds);
      updateEngine(car.speed01());

      // spawn obstacles
      lastSpawnRef.current += dt * 1000;
      const interval = spawnIntervalAt(difficulty);
      if (lastSpawnRef.current >= interval) {
        lastSpawnRef.current = 0;
        obstaclesRef.current.push(spawnObstacle(cfg, difficulty));
      }

      const list = obstaclesRef.current;
      for (const o of list) updateObstacle(o, dt, scroll, bounds);

      // collisions
      const carState = car.car.current;
      const carBox = car.getAABB();
      for (const o of list) {
        if (o.destroyed) continue;
        if (!aabbOverlap(carBox, obstacleAABB(o))) continue;
        const result = crash.resolve({
          car: carState,
          obstacle: o,
          scroll: scrollSpeedAt(difficulty),
          shake,
          particles,
          now,
        });
        if (result && result.event) {
          const ev = result.event;
          car.applyImpact(result.normal, ev.intensity);
          car.addDamage(ev.intensity * 0.4 + 0.05);
          gameStore.applyCrash(ev);
          if (ev.isBig) onBigCrash(ev);
          if (o.kind === "debris") o.destroyed = true;
        }
      }

      obstaclesRef.current = list.filter(
        (o) => o.y < h + 120 && !o.destroyed,
      );

      particles.update(dt);

      // game over when fully wrecked
      if (carState.damage >= 1) {
        updateEngine(0);
        gameOver();
      }
    },
    [car, controls, crash, particles, shake, snapshot.startedAt, ghostMode, gameOver, onBigCrash],
  );

  // --- render ---
  const onRender = useCallback(
    (_interp: number, now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { w, h, dpr } = sizeRef.current;
      const bounds = boundsRef.current;

      const off = shake.update(1 / 60);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      disableSmoothing(ctx);

      // apply shake transform
      ctx.translate(w / 2 + off.x, h / 2 + off.y);
      ctx.rotate(off.rot);
      ctx.translate(-w / 2, -h / 2);

      // background asphalt
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // grandstand at top
      drawGrandstand(ctx, 0, 0, w, 34, scrollRef.current);

      // asphalt band
      ctx.fillStyle = COLORS.asphalt;
      ctx.fillRect(bounds.left, 34, bounds.right - bounds.left, h - 34);

      // outer concrete walls
      ctx.fillStyle = COLORS.concrete;
      ctx.fillRect(0, 34, bounds.left, h - 34);
      ctx.fillRect(bounds.right, 34, w - bounds.right, h - 34);

      // kerb stripes along inner edges (scrolling)
      const kerbW = 8;
      const phase = Math.floor(scrollRef.current) % 32;
      for (let y = 34 - phase; y < h; y += 16) {
        const on = Math.floor((y + phase) / 16) % 2 === 0;
        ctx.fillStyle = on ? COLORS.kerbA : COLORS.kerbB;
        ctx.fillRect(bounds.left - kerbW, y, kerbW, 16);
        ctx.fillRect(bounds.right, y, kerbW, 16);
      }

      // dashed center lane lines
      ctx.fillStyle = "#54584a";
      const laneCount = 2;
      for (let l = 1; l <= laneCount; l++) {
        const lx = bounds.left + ((bounds.right - bounds.left) / (laneCount + 1)) * l;
        for (let y = 34 - phase; y < h; y += 32) {
          ctx.fillRect(lx - 2, y, 4, 16);
        }
      }

      // obstacles
      for (const o of obstaclesRef.current) {
        renderObstacle(ctx, o);
      }

      // car
      const phaseNow = phaseRef.current;
      if (phaseNow === "playing" || phaseNow === "attract" || ghostMode || phaseNow === "crashing") {
        renderF1Car(ctx, car.car.current, now);
      }

      // particles
      const pool = particles.pool.current;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        const alpha = p.life / p.maxLife;
        drawParticle(ctx, p.x, p.y, p.size * p.scaleZ, p.color, alpha);
      }

      ctx.restore();
    },
    [car, particles, shake, ghostMode],
  );

  const running = snapshot.phase === "playing" || snapshot.phase === "attract" || ghostMode;

  const loop = useGameLoop({ onUpdate, onRender, running });
  const freezeRef = useRef(loop.freeze);
  freezeRef.current = loop.freeze;

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ imageRendering: "pixelated" }}
        aria-label="ZCRASH game canvas"
      />
    </div>
  );
}

export default GameCanvas;
