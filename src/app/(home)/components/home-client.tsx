"use client";

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import CharacterVisual from "@/src/components/common/character-visual";
import { Button } from "@/src/components/ui/button";
import { urlFor } from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

gsap.registerPlugin(ScrollTrigger);

// ─── 타입 정의 ────────────────────────────────────────────────

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

type HomeClientProps = { characters: Character[] };

type HomeStageItem = {
  _id: string;
  name: string;
  slug: { current: string };
  introQuote: string;
  description: string;
  ctaLabel: string;
  mainVideoUrl?: string;
  mainImageUrl: string;
  backgroundImageUrl: string;
  polygonColor: string;
};

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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 요소별 Ref
  const bgActiveRef = useRef<HTMLDivElement | null>(null);
  const bgPrevRef = useRef<HTMLDivElement | null>(null);
  const polygonRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  const currentIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const isNavigatingRef = useRef(false);

  // 1. 데이터 가공
  const items = useMemo<HomeStageItem[]>(
    () =>
      characters
        .filter((c) => c.slug?.current)
        .map((c) => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
          introQuote: c.introQuote,
          description: c.description,
          ctaLabel: c.ctaLabel,
          mainVideoUrl: c.mainVideoUrl,
          mainImageUrl: urlFor(c.mainImage).width(1200).url(),
          backgroundImageUrl: urlFor(c.backgroundImage).width(1920).url(),
          polygonColor: polygonColorBySlug[c.slug.current] ?? "#1a1a2e",
        })),
    [characters],
  );

  // 2. 캐릭터 전환 로직 (Outro -> State Change)
  const transitionToIndex = useCallback((nextIndex: number) => {
    if (isNavigatingRef.current || isTransitioningRef.current) return;
    if (nextIndex === currentIndexRef.current) return;

    isTransitioningRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        setPrevIndex(currentIndexRef.current);
        currentIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      },
    });

    // 기존 요소 퇴장 애니메이션
    tl.to([textRef.current, imageRef.current], {
      autoAlpha: 0,
      x: (i) => (i === 0 ? 30 : -50),
      duration: 0.3,
      ease: "power2.in",
    }).to(polygonRef.current, { scaleY: 0, duration: 0.3 }, 0);
  }, []);

  // 3. 메인 ScrollTrigger & MatchMedia (반응형 최적화)
  useLayoutEffect(() => {
    if (!wrapperRef.current || items.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)",
      },
      () => {
        // 초기 세팅
        gsap.set(polygonRef.current, {
          scaleY: 1,
          transformOrigin: "top center",
          autoAlpha: 0.7,
        });

        ScrollTrigger.create({
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          snap: {
            snapTo: 1 / (items.length - 1),
            duration: 0.5,
            delay: 0.1,
          },
          onUpdate: (self) => {
            const nextIndex = Math.round(self.progress * (items.length - 1));
            if (nextIndex !== currentIndexRef.current) {
              transitionToIndex(nextIndex);
            }
          },
        });
      },
    );

    return () => mm.revert();
  }, [items, transitionToIndex]);

  // 4. 캐릭터 등장 애니메이션 (State 변경 시 실행)
  useLayoutEffect(() => {
    if (isNavigatingRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        isTransitioningRef.current = false;
      },
    });

    // 새 배경은 fadeIn, 이전 배경 레이어는 뒤에서 대기
    tl.fromTo(
      bgActiveRef.current,
      { autoAlpha: 0, scale: 1.05 },
      { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" },
    )
      .fromTo(
        textRef.current,
        { autoAlpha: 0, x: -30 },
        { autoAlpha: 1, x: 0, duration: 0.5 },
        "-=0.4",
      )
      .fromTo(
        imageRef.current,
        { autoAlpha: 0, x: 60 },
        { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
        "-=0.5",
      )
      .to(
        polygonRef.current,
        { scaleY: 1, autoAlpha: 0.7, duration: 0.5, ease: "power2.out" },
        "-=0.7",
      );
  }, [activeIndex]);

  if (items.length === 0) return <div className="min-h-screen bg-[#061022]" />;

  const activeItem = items[activeIndex];
  const prevItem = prevIndex !== null ? items[prevIndex] : null;

  return (
    <div
      ref={wrapperRef}
      className="relative bg-[#061022]"
      style={{ height: `${items.length * 100}vh` }}
    >
      <main
        ref={containerRef}
        className="sticky top-0 h-screen overflow-hidden"
      >
        {/* 배경 레이어 (Flash 방지용 이중 구조) */}
        <div className="absolute inset-0">
          {/* 1. 이전 배경 (밑에 깔려 있음) */}
          {prevItem && (
            <div
              ref={bgPrevRef}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${prevItem.backgroundImageUrl}')`,
              }}
            />
          )}
          {/* 2. 현재 배경 (위에서 페이드인) */}
          <div
            ref={bgActiveRef}
            key={`bg-${activeItem._id}`}
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{
              backgroundImage: `url('${activeItem.backgroundImageUrl}')`,
            }}
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative mx-auto h-full w-full max-w-[1520px] px-6 md:px-20">
          {/* 폴리곤 데코 */}
          <div
            className="absolute inset-y-0 right-0 w-[52vw] max-w-[820px] overflow-hidden"
            style={{ clipPath: "polygon(35% 0, 100% 0, 62% 100%, 0 100%)" }}
          >
            <div
              ref={polygonRef}
              className="absolute inset-0 will-change-transform"
              style={{ backgroundColor: activeItem.polygonColor }}
            />
          </div>

          {/* 텍스트 정보 */}
          <div
            ref={textRef}
            className="relative z-11 flex h-full max-w-[520px] flex-col justify-center"
          >
            <h1 className="text-5xl font-bold">{activeItem.name}</h1>
            <p className="mt-7 mb-10 text-2xl font-medium leading-relaxed whitespace-pre-line">
              {activeItem.introQuote}
            </p>
            <p className="mb-10 text-lg leading-relaxed text-[#dbe5f7] whitespace-pre-line">
              {activeItem.description}
            </p>
            <Button
              as={Link}
              href={`/simulations/${activeItem.slug.current}`}
              onClick={() => {
                isNavigatingRef.current = true;
              }}
            >
              {activeItem.ctaLabel}
            </Button>
          </div>

          {/* 메인 비주얼 (비디오/이미지) */}
          <CharacterVisual
            ref={imageRef}
            mainVideoUrl={activeItem.mainVideoUrl}
            mainImageUrl={activeItem.mainImageUrl}
            alt={activeItem.name}
            wrapperClassName={`absolute z-10 will-change-transform ${
              imageClassBySlug[activeItem.slug.current] ?? "right-0 bottom-[-18%]"
            }`}
            imagePriority={activeIndex === 0}
            videoPreload={activeIndex === 0 ? "auto" : "metadata"}
          />
        </div>
      </main>
    </div>
  );
}
