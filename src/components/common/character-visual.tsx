"use client";

import Image from "next/image";
import { forwardRef, useState } from "react";

type CharacterVisualProps = {
  mainVideoUrl?: string;
  mainImageUrl: string;
  alt: string;
  wrapperClassName?: string;
  videoClassName?: string;
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
  imagePriority?: boolean;
  videoPreload?: "none" | "metadata" | "auto";
};

function VideoWithFallback({
  mainVideoUrl,
  mainImageUrl,
  alt,
  videoClassName,
  imageClassName,
  imageWidth,
  imageHeight,
  imagePriority,
  videoPreload,
}: Required<
  Pick<
    CharacterVisualProps,
    | "mainVideoUrl"
    | "mainImageUrl"
    | "alt"
    | "videoClassName"
    | "imageClassName"
    | "imageWidth"
    | "imageHeight"
    | "imagePriority"
    | "videoPreload"
  >
>) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  return (
    <div className="relative">
      <Image
        key={`${mainImageUrl}-fallback`}
        src={mainImageUrl}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        priority={imagePriority}
        className={`${imageClassName} transition-opacity duration-200 ${isVideoReady ? "opacity-0" : "opacity-100"}`}
      />
      <video
        key={mainVideoUrl}
        src={mainVideoUrl}
        autoPlay
        loop
        muted
        playsInline
        disableRemotePlayback
        preload={videoPreload}
        onLoadedData={() => {
          setIsVideoReady(true);
        }}
        onCanPlay={() => {
          setIsVideoReady(true);
        }}
        className={`${videoClassName} absolute inset-0 transition-opacity duration-200 ${isVideoReady ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

const CharacterVisual = forwardRef<HTMLDivElement, CharacterVisualProps>(
  (
    {
      mainVideoUrl,
      mainImageUrl,
      alt,
      wrapperClassName,
      videoClassName = "h-auto w-full object-contain [filter:drop-shadow(0_12px_40px_rgba(0,0,0,0.7))]",
      imageClassName = "h-auto w-full object-contain",
      imageWidth = 1200,
      imageHeight = 1200,
      imagePriority = false,
      videoPreload = "metadata",
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={wrapperClassName}>
        {mainVideoUrl ? (
          <VideoWithFallback
            key={mainVideoUrl}
            mainVideoUrl={mainVideoUrl}
            mainImageUrl={mainImageUrl}
            alt={alt}
            videoClassName={videoClassName}
            imageClassName={imageClassName}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            imagePriority={imagePriority}
            videoPreload={videoPreload}
          />
        ) : (
          <Image
            key={mainImageUrl}
            src={mainImageUrl}
            alt={alt}
            width={imageWidth}
            height={imageHeight}
            priority={imagePriority}
            className={imageClassName}
          />
        )}
      </div>
    );
  },
);

CharacterVisual.displayName = "CharacterVisual";

export default CharacterVisual;
