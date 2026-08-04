"use client";

import { useEffect, useRef, useState } from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";

export function FlowingParticleEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isTransferring = Boolean(data?.isTransferring);
  const isCompleted = Boolean(data?.isCompleted);
  const [hasLanded, setHasLanded] = useState(false);

  const animRef = useRef<SVGAnimateMotionElement>(null);
  const onHandoffCompleteRef = useRef<(() => void) | undefined>(undefined);
  onHandoffCompleteRef.current = data?.onHandoffComplete as (() => void) | undefined;

  useEffect(() => {
    if (!isTransferring) {
      setHasLanded(false);
      return;
    }

    let isTriggered = false;
    const triggerComplete = () => {
      if (isTriggered) return;
      isTriggered = true;
      setHasLanded(true);
      if (onHandoffCompleteRef.current) {
        onHandoffCompleteRef.current();
      }
    };

    // Native SMIL endEvent listener for exact visual arrival timing
    const elem = animRef.current;
    if (elem) {
      elem.addEventListener("endEvent", triggerComplete);
    }

    // JS setTimeout fallback (450ms matching SMIL dur="0.45s")
    const fallbackTimer = setTimeout(() => {
      triggerComplete();
    }, 450);

    return () => {
      if (elem) {
        elem.removeEventListener("endEvent", triggerComplete);
      }
      clearTimeout(fallbackTimer);
    };
  }, [isTransferring]);

  return (
    <>
      {/* Base Connection Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isTransferring
            ? "#F5D56E"
            : isCompleted
            ? "#22c55e"
            : "var(--color-muted-foreground)",
          strokeWidth: isTransferring ? 2.5 : isCompleted ? 2 : 1.8,
          opacity: isTransferring ? 1 : isCompleted ? 0.75 : 0.4,
          strokeDasharray: isTransferring ? "8 6" : isCompleted ? "6 4" : "4 4",
          transition: "stroke 0.3s ease, opacity 0.3s ease, stroke-width 0.3s ease",
        }}
      />

      {/* Playful Single One-Shot Messenger Orb Traveling Handoff */}
      {isTransferring && (
        <g className="pointer-events-none">
          {/* Main Glowing Messenger Orb */}
          <circle r="6" fill="#F5D56E" className="filter drop-shadow-[0_0_12px_#F5D56E]">
            <animateMotion
              ref={animRef}
              path={edgePath}
              dur="0.45s"
              repeatCount="1"
              rotate="auto"
              fill="freeze"
            />
          </circle>

          {/* Micro Trailing Sparkle Fade */}
          <circle r="3.5" fill="#F5C542" opacity="0.75" className="filter drop-shadow-[0_0_6px_#F5C542]">
            <animateMotion
              path={edgePath}
              dur="0.45s"
              begin="0.06s"
              repeatCount="1"
              rotate="auto"
              fill="freeze"
            />
          </circle>
        </g>
      )}

      {/* Playful Knock / Arrival Ripple Effect at Target Node */}
      {hasLanded && (
        <g className="pointer-events-none" transform={`translate(${targetX}, ${targetY})`}>
          <circle r="12" fill="none" stroke="#F5D56E" strokeWidth="2" opacity="0.8" className="animate-ping" />
          <circle r="4" fill="#F5D56E" className="filter drop-shadow-[0_0_8px_#F5D56E]" />
        </g>
      )}
    </>
  );
}
