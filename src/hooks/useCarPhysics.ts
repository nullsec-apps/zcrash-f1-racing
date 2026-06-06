// Simulates the ZCASH F1 car: acceleration, top speed, steering with grip/drift,
// braking, momentum, and a bounding box for collisions. Mutable ref-based for
// per-frame game-loop integration (no React re-renders per tick).

import { useRef, useCallback } from "react";
import type { AABB } from "../lib/collision";
import { clamp } from "../lib/format";
import type { TrackBounds } from "../lib/track";

export interface ControlInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (left..right)
}

export interface CarState {
  x: number; // center x
  y: number; // center y (fixed near bottom)
  w: number;
  h: number;
  speed: number; // forward speed magnitude (world units/s)
  vx: number; // lateral velocity
  vy: number; // forward velocity (for crash relative-velocity math; positive = up the track)
  heading: number; // radians, 0 = facing up; slight tilt with steering
  damage: number; // 0..1
  mass: number;
}

const MAX_SPEED = 640;
const ACCEL = 520;
const BRAKE_DECEL = 900;
const DRAG = 180;
const LATERAL_ACCEL = 760;
const LATERAL_DAMP = 6.5;
const CAR_MASS = 5;

export interface CarPhysicsApi {
  car: React.MutableRefObject<CarState>;
  init: (width: number, height: number) => void;
  update: (dt: number, input: ControlInput, bounds: TrackBounds) => void;
  getAABB: () => AABB;
  applyImpact: (nx: number, ny: number, restitution: number) => void;
  addDamage: (amount: number) => void;
  speed01: () => number;
  reset: (width: number, height: number) => void;
}

function makeCar(width: number, height: number): CarState {
  const w = Math.max(26, Math.round(width * 0.05));
  const h = Math.round(w * 1.9);
  return {
    x: width / 2,
    y: height - h * 1.4,
    w,
    h,
    speed: 0,
    vx: 0,
    vy: 0,
    heading: 0,
    damage: 0,
    mass: CAR_MASS,
  };
}

export function useCarPhysics(): CarPhysicsApi {
  const car = useRef<CarState>(makeCar(800, 600));

  const init = useCallback((width: number, height: number) => {
    car.current = makeCar(width, height);
  }, []);

  const reset = useCallback((width: number, height: number) => {
    car.current = makeCar(width, height);
  }, []);

  const update = useCallback(
    (dt: number, input: ControlInput, bounds: TrackBounds) => {
      const c = car.current;
      const throttle = clamp(input.throttle, 0, 1);
      const brake = clamp(input.brake, 0, 1);
      const steer = clamp(input.steer, -1, 1);

      // forward speed integration
      if (throttle > 0) {
        c.speed += ACCEL * throttle * dt;
      }
      if (brake > 0) {
        c.speed -= BRAKE_DECEL * brake * dt;
      }
      // natural drag
      c.speed -= DRAG * dt;
      c.speed = clamp(c.speed, 0, MAX_SPEED);

      // forward velocity (up the track) — used for crash relative velocity
      c.vy = c.speed;

      // lateral movement scales with how fast you're going (more grip = sharper at speed)
      const speedFactor = 0.35 + (c.speed / MAX_SPEED) * 0.65;
      c.vx += steer * LATERAL_ACCEL * speedFactor * dt;
      // lateral damping (grip pulls car back to straight)
      c.vx -= c.vx * LATERAL_DAMP * dt;

      // integrate lateral position
      c.x += c.vx * dt;

      // clamp to track bounds, kill lateral velocity into the wall
      const minX = bounds.left + c.w / 2;
      const maxX = bounds.right - c.w / 2;
      if (c.x < minX) {
        c.x = minX;
        if (c.vx < 0) c.vx = 0;
      } else if (c.x > maxX) {
        c.x = maxX;
        if (c.vx > 0) c.vx = 0;
      }

      // heading tilt for visual feedback (lean into steering)
      const targetHeading = steer * 0.28 * speedFactor;
      c.heading += (targetHeading - c.heading) * Math.min(1, dt * 10);
    },
    [],
  );

  const getAABB = useCallback((): AABB => {
    const c = car.current;
    return { x: c.x, y: c.y, w: c.w, h: c.h };
  }, []);

  // Apply a collision impulse along surface normal (nx,ny). Bleeds speed.
  const applyImpact = useCallback(
    (nx: number, ny: number, restitution: number) => {
      const c = car.current;
      // kill forward momentum proportional to head-on-ness
      const headOn = Math.abs(ny);
      c.speed *= 1 - clamp(0.4 + headOn * 0.5, 0, 0.95) * (1 - restitution * 0.3);
      // bounce laterally
      if (nx !== 0) {
        c.vx = nx * Math.abs(c.vx + c.speed * 0.3) * restitution;
      }
      // small knockback so car doesn't stick
      c.x += nx * 6;
      c.y += ny * 4;
    },
    [],
  );

  const addDamage = useCallback((amount: number) => {
    const c = car.current;
    c.damage = clamp(c.damage + amount, 0, 1);
  }, []);

  const speed01 = useCallback(() => {
    return clamp(car.current.speed / MAX_SPEED, 0, 1);
  }, []);

  return { car, init, update, getAABB, applyImpact, addDamage, speed01, reset };
}
