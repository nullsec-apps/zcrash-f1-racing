import { useEffect, useRef, useState } from "react";
import { useGameState } from "../hooks/useGameState";

export interface CRTOverlayProps {
  // 0..1 impact intensity to pulse chromatic-aberration harder
  impact?: number;
}

export function CRTOverlay({ impact }: CRTOverlayProps) {
  const { snapshot } = useGameState();
  const [jitter, setJitter] = useState(0);
  const prevJolt = useRef(snapshot.scoreJolt);
  const decayRef = useRef<number | null>(null);

  // pulse on score jolt (crash) or explicit impact prop
  useEffect(() => {
    if (snapshot.scoreJolt !== prevJolt.current) {
      prevJolt.current = snapshot.scoreJolt;
      setJitter(1);
    }
  }, [snapshot.scoreJolt]);

  useEffect(() => {
    if (typeof impact === "number" && impact > 0) {
      setJitter((j) => Math.max(j, impact));
    }
  }, [impact]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setJitter((j) => {
        const next = j - 0.06;
        return next < 0.001 ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  void decayRef;
  const chroma = jitter * 4;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {/* chromatic aberration tint layers on impact */}
      {jitter > 0.01 && (
        <>
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              backgroundColor: "rgba(255,59,46,0.18)",
              transform: `translate(${chroma}px,0)`,
              opacity: jitter,
            }}
          />
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              backgroundColor: "rgba(58,160,255,0.16)",
              transform: `translate(${-chroma}px,0)`,
              opacity: jitter,
            }}
          />
        </>
      )}

      {/* scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.0) 0px, rgba(0,0,0,0.0) 1px, rgba(0,0,0,0.32) 2px, rgba(0,0,0,0.32) 3px)",
          opacity: 0.55,
        }}
      />

      {/* subtle moving scan flicker bar */}
      <div
        className="absolute inset-x-0 h-24 opacity-[0.04]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(255,255,255,1), transparent)",
          animation: "crtScan 7s linear infinite",
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 120px 30px rgba(0,0,0,0.85), inset 0 0 40px 10px rgba(0,0,0,0.6)",
        }}
      />

      {/* RGB pixel grid (very subtle) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,0,0,0.03) 0px, rgba(0,255,0,0.03) 1px, rgba(0,0,255,0.03) 2px)",
          opacity: 0.4,
        }}
      />

      {/* flicker overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ animation: "crtFlicker 0.18s steps(2) infinite", opacity: 0.015 }}
      />

      <style>{`
        @keyframes crtScan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes crtFlicker {
          0% { opacity: 0.012; }
          50% { opacity: 0.025; }
          100% { opacity: 0.012; }
        }
      `}</style>
    </div>
  );
}

export default CRTOverlay;
