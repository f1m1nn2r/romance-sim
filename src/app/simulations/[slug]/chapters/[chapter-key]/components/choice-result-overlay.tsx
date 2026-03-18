"use client";

import { useEffect, useState } from "react";

type ChoiceResultOverlayProps = {
  title: string;
  message: string;
  description: string;
  onClick: () => void;
};

const OVERLAY_FADE_DELAY_MS = 120;
const CONTENT_REVEAL_DELAY_MS = 360;

export default function ChoiceResultOverlay({
  title,
  message,
  description,
  onClick,
}: ChoiceResultOverlayProps) {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const overlayTimer = window.setTimeout(() => {
      setIsOverlayVisible(true);
    }, OVERLAY_FADE_DELAY_MS);
    const contentTimer = window.setTimeout(() => {
      setIsContentVisible(true);
    }, CONTENT_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(overlayTimer);
      window.clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-6 text-center text-white transition-colors duration-700 ${
        isOverlayVisible ? "cursor-pointer bg-black" : "bg-black/0"
      }`}
      onClick={() => {
        if (!isContentVisible) return;
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (!isContentVisible) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`space-y-4 transition-all duration-700 ${
          isContentVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <p className="text-xs font-semibold tracking-[0.28em] text-white/45">
          {title}
        </p>
        <p className="whitespace-pre-line text-2xl font-semibold leading-relaxed tracking-[0.02em] md:text-3xl">
          {message}
        </p>
        <p className="mx-auto max-w-[520px] text-sm leading-relaxed text-white/72 md:text-base">
          {description}
        </p>
        <p className="text-sm text-white/60 md:text-base">
          화면을 클릭하면 챕터 목록으로 이동합니다.
        </p>
      </div>
    </div>
  );
}
