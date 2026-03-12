import Image from "next/image";
import { forwardRef } from "react";

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
          <video
            key={mainVideoUrl}
            src={mainVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            disableRemotePlayback
            preload={videoPreload}
            className={videoClassName}
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
