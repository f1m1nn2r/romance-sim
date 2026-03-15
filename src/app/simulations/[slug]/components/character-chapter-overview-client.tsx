"use client";

import gsap from "gsap";
import Link from "next/link";
import CharacterVisual from "@/src/components/common/character-visual";
import { useRouter } from "next/navigation";
import { getButtonClassName } from "@/src/components/ui/button";
import { usePressAnimation } from "@/src/hooks/use-press-animation";
import {
  createDefaultCharacterProgress,
  getChapterStatus,
  readCharacterProgress,
  subscribeSimulationProgress,
  type CharacterChapterProgress,
} from "@/src/lib/simulation-progress";
import {
  getBackgroundImageUrl,
  getCharacterImageUrl,
} from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type Chapter = {
  _id: string;
  title: string;
  chapterKey: string;
  displayOrder: number;
};

export type CharacterChapterOverviewItem = {
  _id: string;
  name: string;
  slug: { current: string };
  mainVideoUrl?: string;
  backgroundImage: SanityImageSource;
  mainImage: SanityImageSource;
  chapters: Chapter[];
};

type CharacterChapterOverviewClientProps = {
  character: CharacterChapterOverviewItem;
};

const imageClassBySlug: Record<string, string> = {
  nayuta: "max-w-[1000px]",
  guren: "max-w-[1100px]",
  siren: "max-w-[1200px]",
};

export default function CharacterChapterOverviewClient({
  character,
}: CharacterChapterOverviewClientProps) {
  const router = useRouter();
  const runPressAnimation = usePressAnimation();
  const characterSlug = character.slug.current;
  const backgroundImageUrl = getBackgroundImageUrl(character.backgroundImage);
  const mainImageUrl = getCharacterImageUrl(character.mainImage);

  const visualRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const chapterButtonsRef = useRef<HTMLElement[]>([]);
  const [progress, setProgress] = useState<CharacterChapterProgress>(() =>
    createDefaultCharacterProgress(character.chapters),
  );

  useEffect(() => {
    const updateProgress = () => {
      setProgress(readCharacterProgress(characterSlug, character.chapters));
    };

    updateProgress();

    return subscribeSimulationProgress(updateProgress);
  }, [character.chapters, characterSlug]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        visualRef.current,
        { autoAlpha: 0, x: -34 },
        { autoAlpha: 1, x: 0, duration: 1.2 },
      )
        .fromTo(
          panelRef.current,
          { autoAlpha: 0, x: 20 },
          { autoAlpha: 1, x: 0, duration: 0.5 },
          "-=0.7",
        )
        .fromTo(
          chapterButtonsRef.current,
          { autoAlpha: 0, x: 20 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.45,
            stagger: 0.09,
          },
          "-=0.6",
        );
    });

    return () => ctx.revert();
  }, [character._id]);

  return (
    <main className="relative h-screen overflow-hidden bg-[#050d1b] text-[#e6edf6]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(34,61,95,0.34),transparent_45%),linear-gradient(110deg,rgba(6,13,28,0.88)_5%,rgba(7,15,30,0.6)_44%,rgba(2,6,14,0.93)_100%)]" />

      <div className="relative mx-auto flex min-h-screen h-full w-full max-w-[1540px] items-center justify-center px-5 sm:px-10 lg:px-16">
        <div ref={visualRef}>
          <CharacterVisual
            mainVideoUrl={character.mainVideoUrl}
            mainImageUrl={mainImageUrl}
            alt={`${character.name} 일러스트`}
            wrapperClassName={imageClassBySlug[characterSlug]}
            imagePriority
            videoPreload="metadata"
          />
        </div>

        <section ref={panelRef} className="w-full max-w-[350px] -ml-[120px]">
          <Link
            href="/"
            className="text-xs text-[#afbfda] transition hover:text-white sm:text-sm text-right block mb-3"
          >
            홈으로
          </Link>

          <div className="space-y-3">
            {character.chapters.length > 0 ? (
              character.chapters.map((chapter, index) => (
                <div key={chapter._id} className="space-y-2">
                  {(() => {
                    const status = getChapterStatus(
                      progress,
                      chapter.chapterKey,
                    );
                    const href = `/simulations/${characterSlug}/chapters/${chapter.chapterKey}`;
                    const isAvailable = status !== "locked";

                    if (!isAvailable) {
                      return (
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) chapterButtonsRef.current[index] = el;
                          }}
                          className={getButtonClassName(
                            "sm",
                            "!cursor-not-allowed !opacity-50",
                          )}
                          disabled
                          aria-disabled="true"
                        >
                          {chapter.title}
                        </button>
                      );
                    }

                    return (
                      <Link
                        href={href}
                        ref={(el) => {
                          if (el) chapterButtonsRef.current[index] = el;
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          runPressAnimation(event.currentTarget, {
                            onComplete: () => {
                              router.push(href);
                            },
                          });
                        }}
                        className={getButtonClassName("sm", "opacity-100")}
                      >
                        {chapter.title}
                      </Link>
                    );
                  })()}
                </div>
              ))
            ) : (
              <div className="rounded border border-[#4a5568] bg-black/35 px-5 py-4 text-sm text-[#becbe0]">
                공개된 챕터가 아직 없습니다.
              </div>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#9fb0c8]">
            진행 상태는 이 브라우저에 저장됩니다. <br />
            브라우저 데이터를 삭제하면 해금 기록이 초기화될 수 있습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
