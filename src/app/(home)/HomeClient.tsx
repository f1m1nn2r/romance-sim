"use client";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { urlFor } from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

gsap.registerPlugin(ScrollTrigger);

export type Character = {
  _id: string;
  name: string;
  slug: { current: string };
  mainImage: SanityImageSource;
  mainVideoUrl?: string;
  backgroundImage: SanityImageSource;
  introQuote: string;
  description: string;
  ctaLabel: string;
};

type HomeClientProps = {
  characters: Character[];
};

// ─── 분리된 타입 ───────────────────────────────────────────────

type SceneElements = {
  bg: HTMLElement;
  overlay: HTMLElement;
  polygon: HTMLElement;
  image: HTMLElement;
  text: HTMLElement;
};

// ─── 분리된 함수들 ────────────────────────────────────────────

/**
 * 각 씬 요소의 초기 상태를 세팅
 * 첫 번째 씬만 보이고, 나머지는 모두 숨긴 상태로 시작
 */
function initSceneElements(
  backgrounds: HTMLElement[],
  overlays: HTMLElement[],
  polygons: HTMLElement[],
  images: HTMLElement[],
  texts: HTMLElement[],
) {
  gsap.set(backgrounds, { autoAlpha: 0, scale: 1.08 });
  gsap.set(backgrounds[0], { autoAlpha: 1, scale: 1 });

  gsap.set(overlays, { autoAlpha: 0 });
  gsap.set(overlays[0], { autoAlpha: 1 });

  gsap.set(polygons, {
    scaleY: 0,
    transformOrigin: "top center",
    autoAlpha: 0,
  });
  gsap.set(polygons[0], { scaleY: 1, autoAlpha: 0.7 });

  gsap.set(images, { x: 120, autoAlpha: 0 });
  gsap.set(images[0], { x: 0, autoAlpha: 1 });

  gsap.set(texts, { x: -32, autoAlpha: 0 });
  gsap.set(texts[0], { x: 0, autoAlpha: 1 });
}

/**
 * 씬 전환 시 나가는 씬의 트윈을 타임라인에 추가
 */
function addOutroTweens(
  tl: gsap.core.Timeline,
  step: number,
  prev: SceneElements,
) {
  tl.to(prev.text, { x: 24, autoAlpha: 0, duration: 0.35 }, step - 1);
  tl.to(prev.image, { x: -40, autoAlpha: 0, duration: 0.45 }, step - 1);
  tl.to(
    prev.polygon,
    {
      scaleY: 0,
      autoAlpha: 0,
      duration: 0.35,
      ease: "power2.in",
    },
    step - 1,
  );
  tl.to(prev.overlay, { autoAlpha: 0, duration: 0.8, ease: "none" }, step - 1);
  tl.to(
    prev.bg,
    { scale: 0.985, autoAlpha: 0, duration: 0.8, ease: "none" },
    step - 1,
  );
}

/**
 * 씬 전환 시 들어오는 씬의 트윈을 타임라인에 추가
 */
function addIntroTweens(
  tl: gsap.core.Timeline,
  step: number,
  next: SceneElements,
) {
  tl.to(next.text, { x: 0, autoAlpha: 1, duration: 0.45 }, step - 0.7);
  tl.to(next.image, { x: 0, autoAlpha: 1, duration: 0.55 }, step - 0.72);
  tl.to(
    next.polygon,
    {
      scaleY: 1,
      autoAlpha: 0.7,
      duration: 0.7,
      ease: "power3.out",
    },
    step - 0.82,
  );
  tl.to(next.overlay, { autoAlpha: 1, duration: 0.8, ease: "none" }, step - 1);
  tl.to(
    next.bg,
    { scale: 1, autoAlpha: 1, duration: 0.8, ease: "none" },
    step - 1,
  );
}

/**
 * ScrollTrigger가 붙은 메인 타임라인을 생성
 */
function createScrollTimeline(
  trigger: HTMLElement,
  totalSteps: number,
): gsap.core.Timeline {
  return gsap.timeline({
    defaults: { ease: "power2.out" },
    scrollTrigger: {
      trigger,
      start: "top",
      end: () => `+=${window.innerHeight * Math.max(totalSteps, 1)}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      snap:
        totalSteps > 0
          ? {
              snapTo: 1 / totalSteps,
              duration: { min: 0.2, max: 0.45 },
              ease: "power1.inOut",
            }
          : undefined,
    },
  });
}

// ─── 상수 ────────────────────────────────────────────────────

const polygonColorBySlug: Record<string, string> = {
  nayuta: "#2c3a4f",
  guren: "#3a090f",
  siren: "#162a30",
};

const imageClassBySlug: Record<string, string> = {
  nayuta: "right-0 bottom-[-15%] max-w-[1100px]",
  guren: "right-20 bottom-[-12%] max-w-[1100px]",
  siren: "right-25 bottom-[-15%] max-w-[1050px]",
};

// ─── 컴포넌트 ────────────────────────────────────────────────

export default function HomeClient({ characters }: HomeClientProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  const items = useMemo(
    () =>
      characters
        .filter((c) => c.slug?.current)
        .map((c) => ({
          ...c,
          mainImageUrl: urlFor(c.mainImage).width(1200).quality(90).url(),
          backgroundImageUrl: urlFor(c.backgroundImage)
            .width(1920)
            .quality(85)
            .url(),
          polygonColor: polygonColorBySlug[c.slug.current],
        })),
    [characters],
  );

  useEffect(() => {
    if (!rootRef.current || items.length === 0) return;

    const ctx = gsap.context(() => {
      const backgrounds = gsap.utils.toArray<HTMLElement>("[data-bg]");
      const overlays = gsap.utils.toArray<HTMLElement>("[data-overlay]");
      const polygons = gsap.utils.toArray<HTMLElement>("[data-polygon]");
      const images = gsap.utils.toArray<HTMLElement>("[data-image]");
      const texts = gsap.utils.toArray<HTMLElement>("[data-text]");
      const sections = gsap.utils.toArray<HTMLElement>("[data-scene]");

      if (sections.length === 0) return;

      // 초기 상태 세팅
      initSceneElements(backgrounds, overlays, polygons, images, texts);

      // 타임라인 생성
      const totalSteps = sections.length - 1;
      const tl = createScrollTimeline(rootRef.current!, totalSteps);

      // 씬 전환 트윈 추가
      for (let i = 1; i < sections.length; i++) {
        const prev: SceneElements = {
          bg: backgrounds[i - 1],
          overlay: overlays[i - 1],
          polygon: polygons[i - 1],
          image: images[i - 1],
          text: texts[i - 1],
        };
        const next: SceneElements = {
          bg: backgrounds[i],
          overlay: overlays[i],
          polygon: polygons[i],
          image: images[i],
          text: texts[i],
        };

        addOutroTweens(tl, i, prev);
        addIntroTweens(tl, i, next);
      }
    }, rootRef);

    return () => ctx.revert();
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="relative min-h-screen bg-[#061022] text-[#eff4ff]" />
    );
  }

  return (
    <main
      ref={rootRef}
      className="relative h-screen overflow-hidden bg-[#061022] bg-black/55"
    >
      {items.map((c, i) => (
        <section
          key={c._id}
          data-scene
          className="absolute inset-0 overflow-hidden "
        >
          <div
            data-bg
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{ backgroundImage: `url('${c.backgroundImageUrl}')` }}
          />
          <div data-overlay className="absolute inset-0 bg-black/55" />

          <div className="relative mx-auto h-full w-full max-w-[1520px] px-6 sm:px-10 md:px-16 lg:px-20">
            <div
              className="absolute inset-y-0 right-0 w-[52vw] max-w-[820px] overflow-hidden"
              style={{
                clipPath: "polygon(35% 0, 100% 0, 62% 100%, 0 100%)",
              }}
            >
              <div
                data-polygon
                className="absolute inset-0 will-change-transform"
                style={{ backgroundColor: c.polygonColor }}
              />
            </div>

            <div
              data-text
              className="relative z-10 flex h-full max-w-[520px] flex-col justify-center"
            >
              <h1 className="text-5xl font-bold">{c.name}</h1>
              <p className="mt-7 mb-10 whitespace-pre-line text-2xl font-medium leading-relaxed">
                {c.introQuote}
              </p>
              <p className="mb-10 whitespace-pre-line text-lg leading-relaxed text-[#dbe5f7]">
                {c.description}
              </p>
              <div>
                <Button as="a" href={`/simulations/${c.slug.current}`}>
                  {c.ctaLabel}
                </Button>
              </div>
            </div>

            <div
              data-image
              className={`absolute z-10 will-change-transform ${imageClassBySlug[c.slug.current] ?? "right-0 bottom-[-18%]"}`}
            >
              {c.mainVideoUrl ? (
                <video
                  src={c.mainVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload={i === 0 ? "auto" : "metadata"}
                  aria-label={`${c.name} 영상`}
                  className="h-auto w-full object-contain"
                />
              ) : (
                <Image
                  src={c.mainImageUrl}
                  alt={`${c.name} 일러스트`}
                  width={1200}
                  height={1200}
                  priority={i === 0}
                  className="h-auto w-full object-contain"
                />
              )}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
