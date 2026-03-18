"use client";

import gsap from "gsap";
import { useCallback, useRef } from "react";

type PressAnimationOptions = {
  scale?: number;
  duration?: number;
  onComplete?: () => void;
};

export function usePressAnimation() {
  const isAnimatingRef = useRef(false);

  return useCallback(
    (
      target: HTMLElement,
      { scale = 1.06, duration = 0.12, onComplete }: PressAnimationOptions = {},
    ) => {
      if (isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;

      gsap.fromTo(
        target,
        { scale: 1 },
        {
          scale,
          duration,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          onComplete: () => {
            isAnimatingRef.current = false;
            onComplete?.();
          },
        },
      );
    },
    [],
  );
}
