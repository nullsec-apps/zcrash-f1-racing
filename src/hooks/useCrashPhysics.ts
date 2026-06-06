// The scoring engine — on collision computes impact intensity from relative
// velocity, mass and angle, classifies crash type, applies the combo multiplier,
// awards points, triggers shake/freeze-frame/particles and emits crash events.

import { useRef, useCallback } from "react";
import {
  computeImpact,
  type Vec2,
  type AABB,
} from "../lib/collision";
import {
  scoreCrash,
  crashTrauma,
  freezeFrameMs,
  crashParticleCount,
  crashFeedType,
  type CrashEvent,
  type ObstacleKind,
} from "../lib/crashScoring";
import { gameStore } from "../lib/gameStore";
import type { CarState } from "./useCarPhysics";
import type { Obstacle } from "../lib/track";
import type { ScreenShakeApi } from "./useScreenShake";
import type { ParticlesApi } from "./useParticles";
import { playCrash } from "../lib/audio";

export interface CrashDeps {
  shake: ScreenShakeApi;
  particles: ParticlesApi;
  applyImpact: (nx: number, ny: number, restitution: number) => void;
  addDamage: (amount: number) => void;
  onCrash?: (ev: CrashEvent) => void;
  pushFeed?: (entry: {
    handle?: string | null;
    crash_type: string;
    points: number;
    combo?: number;
  }) => void;
}

export interface CrashResult {
  event: CrashEvent;
  freezeMs: number;
}

export interface CrashPhysicsApi {
  // Resolve a collision between the player car and an obstacle.
  resolve: (
    car: CarState,
    carBox: AABB,
    obstacle: Obstacle,
    normal: Vec2,
    deps: CrashDeps,
  ) => CrashResult | null;
  reset: () => void;
}

// minimum intensity that counts as a scoring crash (filters gentle scrapes)
const MIN_INTENSITY = 0.05;
// cooldown per obstacle to avoid multi-frame double counting
const HIT_COOLDOWN_MS = 120;

export function useCrashPhysics(): CrashPhysicsApi {
  const eventSeq = useRef(0);
  const lastHitAt = useRef<Map<number, number>>(new Map());
  const lastFeedPush = useRef(0);

  const resolve = useCallback<CrashPhysicsApi["resolve"]>(
    (car, carBox, obstacle, normal, deps) => {
      const now = performance.now();
      const prevHit = lastHitAt.current.get(obstacle.id) ?? 0;
      if (now - prevHit < HIT_COOLDOWN_MS) return null;

      // relative velocity: player moving up the track (+vy) into obstacle which
      // also drifts. Track-relative we model player vy as forward speed.
      const relVel: Vec2 = {
        x: car.vx - obstacle.vx,
        // player closes on obstacle from below; combine forward speed + obstacle drift
        y: -(car.speed) - obstacle.vy,
      };

      const { intensity, speed, normalSpeed } = computeImpact({
        relVel,
        normal,
        playerMass: car.mass,
        obstacleMass: obstacle.mass,
        fragility: obstacle.fragility,
      });

      if (intensity < MIN_INTENSITY) {
        // tiny scrape — still nudge car out, no score
        deps.applyImpact(normal.x, normal.y, 0.2);
        return null;
      }

      lastHitAt.current.set(obstacle.id, now);

      const kind: ObstacleKind = obstacle.kind;
      const prevCombo = gameStore.getState().multiplier;
      const msSinceLast = gameStore.msSinceLastCrash();

      const event = scoreCrash({
        id: ++eventSeq.current,
        intensity,
        speed,
        kind,
        prevCombo,
        msSinceLast,
      });

      // physics response — bounce / bleed speed
      const restitution = obstacle.kind === "debris" ? 0.5 : 0.25;
      deps.applyImpact(normal.x, normal.y, restitution);

      // damage to the car
      deps.addDamage(event.intensity * 0.45 + 0.06);

      // feedback
      deps.shake.add(crashTrauma(event));
      deps.particles.spawn({
        x: car.x + normal.x * car.w * 0.4,
        y: car.y + normal.y * car.h * 0.4,
        count: crashParticleCount(event),
        intensity: event.intensity,
        towardCamera: true,
      });
      playCrash(event.intensity);

      // apply to game store (score / multiplier / popups)
      gameStore.applyCrash(event);
      deps.onCrash?.(event);

      // push notable crashes to the live feed (throttled)
      if (event.points >= 2500 && now - lastFeedPush.current > 1500) {
        lastFeedPush.current = now;
        deps.pushFeed?.({
          crash_type: crashFeedType(event),
          points: event.points,
          combo: event.combo,
        });
      }

      return { event, freezeMs: freezeFrameMs(event) };
    },
    [],
  );

  const reset = useCallback(() => {
    eventSeq.current = 0;
    lastHitAt.current.clear();
    lastFeedPush.current = 0;
  }, []);

  return { resolve, reset };
}
