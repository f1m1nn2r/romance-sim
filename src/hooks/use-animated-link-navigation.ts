"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { usePressAnimation } from "@/src/hooks/use-press-animation";

type AnimatedLinkClickEvent = React.MouseEvent<HTMLAnchorElement>;

function shouldBypassAnimatedNavigation(event: AnimatedLinkClickEvent) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function useAnimatedLinkNavigation() {
  const router = useRouter();
  const runPressAnimation = usePressAnimation();
  const isNavigatingRef = useRef(false);

  const navigateWithAnimation = useCallback(
    (href: string) => (event: AnimatedLinkClickEvent) => {
      if (shouldBypassAnimatedNavigation(event)) {
        return;
      }

      event.preventDefault();

      if (isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;
      runPressAnimation(event.currentTarget, {
        onComplete: () => {
          router.push(href);
        },
      });
    },
    [router, runPressAnimation],
  );

  return {
    isNavigatingRef,
    navigateWithAnimation,
  };
}
