"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { preloadMediaAssets } from "@/src/lib/media-preload";

type MediaPreloadOptions = {
  imageUrls: Array<string | undefined | null>;
  videoUrls: Array<string | undefined | null>;
};

type MediaPreloadState = {
  isReady: boolean;
  progress: {
    loaded: number;
    total: number;
  };
};

export function useMediaPreload({
  imageUrls,
  videoUrls,
}: MediaPreloadOptions): MediaPreloadState {
  const manifestKey = useMemo(
    () => JSON.stringify([imageUrls, videoUrls]),
    [imageUrls, videoUrls],
  );
  const requestIdRef = useRef(0);
  const [state, setState] = useState<MediaPreloadState>({
    isReady: false,
    progress: { loaded: 0, total: 0 },
  });

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const [nextImageUrls, nextVideoUrls] = JSON.parse(manifestKey) as [
      Array<string | undefined | null>,
      Array<string | undefined | null>,
    ];

    const warmUpMedia = async () => {
      await preloadMediaAssets({
        imageUrls: nextImageUrls,
        videoUrls: nextVideoUrls,
        onProgress: (nextProgress) => {
          if (requestIdRef.current === requestId) {
            setState((currentState) => ({
              isReady: false,
              progress:
                currentState.progress.loaded === nextProgress.loaded &&
                currentState.progress.total === nextProgress.total
                  ? currentState.progress
                  : nextProgress,
            }));
          }
        },
      });

      if (requestIdRef.current === requestId) {
        setState((currentState) => ({
          isReady: true,
          progress: currentState.progress,
        }));
      }
    };

    void warmUpMedia();

    return () => {
      requestIdRef.current += 1;
    };
  }, [manifestKey]);

  return state;
}
