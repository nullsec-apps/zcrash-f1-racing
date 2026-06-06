// Unifies keyboard (arrows/WASD/space) and mobile touch inputs into a normalized
// control state (throttle, brake, steer) consumed by useCarPhysics. Ref-based so
// the game loop reads input without per-frame React re-renders.

import { useRef, useEffect, useCallback } from "react";
import type { ControlInput } from "./useCarPhysics";

export interface TouchControls {
  steerLeft: boolean;
  steerRight: boolean;
  gas: boolean;
  brake: boolean;
}

export interface GameControlsApi {
  input: React.MutableRefObject<ControlInput>;
  setTouch: (key: keyof TouchControls, on: boolean) => void;
  enabled: React.MutableRefObject<boolean>;
  setEnabled: (v: boolean) => void;
  reset: () => void;
}

export function useGameControls(): GameControlsApi {
  const input = useRef<ControlInput>({ throttle: 0, brake: 0, steer: 0 });
  const enabled = useRef(true);

  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  });
  const touch = useRef<TouchControls>({
    steerLeft: false,
    steerRight: false,
    gas: false,
    brake: false,
  });

  const recompute = useCallback(() => {
    if (!enabled.current) {
      input.current = { throttle: 0, brake: 0, steer: 0 };
      return;
    }
    const k = keys.current;
    const t = touch.current;
    const gas = k.up || t.gas;
    const brake = k.down || k.space || t.brake;
    const left = k.left || t.steerLeft;
    const right = k.right || t.steerRight;
    input.current = {
      throttle: gas ? 1 : 0,
      brake: brake ? 1 : 0,
      steer: (right ? 1 : 0) - (left ? 1 : 0),
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = keys.current;
      let hit = true;
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          k.up = true;
          break;
        case "ArrowDown":
        case "KeyS":
          k.down = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          k.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          k.right = true;
          break;
        case "Space":
          k.space = true;
          break;
        default:
          hit = false;
      }
      if (hit) {
        if (
          e.code === "Space" ||
          e.code.startsWith("Arrow")
        ) {
          e.preventDefault();
        }
        recompute();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = keys.current;
      let hit = true;
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          k.up = false;
          break;
        case "ArrowDown":
        case "KeyS":
          k.down = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          k.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          k.right = false;
          break;
        case "Space":
          k.space = false;
          break;
        default:
          hit = false;
      }
      if (hit) recompute();
    };
    const blur = () => {
      keys.current = { up: false, down: false, left: false, right: false, space: false };
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [recompute]);

  const setTouch = useCallback(
    (key: keyof TouchControls, on: boolean) => {
      touch.current[key] = on;
      recompute();
    },
    [recompute],
  );

  const setEnabled = useCallback(
    (v: boolean) => {
      enabled.current = v;
      recompute();
    },
    [recompute],
  );

  const reset = useCallback(() => {
    keys.current = { up: false, down: false, left: false, right: false, space: false };
    touch.current = { steerLeft: false, steerRight: false, gas: false, brake: false };
    input.current = { throttle: 0, brake: 0, steer: 0 };
  }, []);

  return { input, setTouch, enabled, setEnabled, reset };
}
