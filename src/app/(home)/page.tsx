"use client";

import Image from "next/image";
import { useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { Button } from "@/src/components/ui/button";

export default function Home() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: "character-section",
      start: "top top",
      // snap: 1,
    });

    return () => trigger.kill();
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#061022] text-[#eff4ff]">
      <section className="character-section relative mx-auto h-screen w-full items-end px-6 pb-10 sm:px-10 md:px-16 lg:px-34 lg:pb-0 bg-[url('/images/nayuta-bg.png')] bg-cover bg-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60" />
        <div className="max-w-[1520px] relative h-full">
          <div className="absolute inset-y-0 right-0 w-[49vw] bg-[var(--color-nayuta-secondary)]/70 [clip-path:polygon(35%_0,100%_0,62%_100%,0_100%)]" />

          <div
            data-animate="text"
            className="h-full flex flex-col justify-center"
          >
            <h1 className="text-5xl font-bold tracking-tight">나유타</h1>
            <p className="text-2xl font-medium mt-7 mb-10 text-[var(--color-nayuta-text)]">
              &quot;대협은 폭풍의 중심에 있는 자.
              <br /> 그러니 중심을 잃고 휩쓸려 가버리지 않게 조심하시구려.&quot;
            </p>
            <p className="text-lg mb-10 text-[var(--color-nayuta-text)]">
              - 파이오니아 스쿼드의 멤버 중 하나.
              <br />
              페어리 테일 모델이 아니기에 동화의 이름을 가지고 있진 않다.
              <br />
              세계 곳곳을 돌아다니며 우주에 있는 퀸의 위치,
              <br />
              이동 경로, 침입 시기 등을 조사하고 다니는 중. -
            </p>
            <Button>나유타와 시뮬레이션 시작하기</Button>
          </div>

          <div
            data-animate="image"
            className="z-10 lg:mt-0 absolute -bottom-60 -right-5"
          >
            <Image
              src="/images/nayuta.png"
              alt="나유타 일러스트"
              width={1200}
              height={1200}
              priority
              className="h-auto w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-x-[16%] bottom-3 h-14 bg-[#0f2340]/55 blur-2xl" />
          </div>
        </div>
      </section>
      <section className="character-section relative mx-auto h-screen w-full items-end px-6 pb-10 sm:px-10 md:px-16 lg:px-34 lg:pb-0 bg-[url('/images/guren-bg.png')] bg-cover bg-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60" />
        <div className="max-w-[1520px] relative h-full">
          <div className="absolute inset-y-0 right-0 w-[49vw] bg-[var(--color-guren-secondary)]/70 [clip-path:polygon(35%_0,100%_0,62%_100%,0_100%)]" />

          <div
            data-animate="text"
            className="h-full flex flex-col justify-center"
          >
            <h1 className="text-5xl font-bold tracking-tight">홍련 : 흑영</h1>
            <p className="text-2xl font-medium mt-7 mb-10 text-[var(--color-guren-text)]">
              &quot;싸움을 거는 거라면 언제든 환영일세.&quot;
            </p>
            <p className="text-lg mb-10 text-[var(--color-nayuta-text)]">
              접근전용 스쿼드 소속.
              <br />
              양산형으로 제작되었지만 강도 높은 커스터마이징을 받아
              <br />
              신체 능력은 양산형을 아득히 뛰어넘는다.
              <br />
              검의 천재라 불릴 정도로 압도적인 기량을 자랑한다.
            </p>
            <Button>홍련 : 흑영과 시뮬레이션 시작하기</Button>
          </div>

          <div
            data-animate="image"
            className="z-10 lg:mt-0 absolute -bottom-60 right-0"
          >
            <Image
              src="/images/guren.png"
              alt="홍련 : 흑영 일러스트"
              width={1200}
              height={1200}
              className="h-auto w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-x-[16%] bottom-3 h-14 bg-[#0f2340]/55 blur-2xl" />
          </div>
        </div>
      </section>
      <section className="character-section relative mx-auto h-screen w-full items-end px-6 pb-10 sm:px-10 md:px-16 lg:px-34 lg:pb-0 bg-[url('/images/siren-bg.png')] bg-cover bg-[position:18%_bottom] overflow-hidden">
        <div className="absolute inset-0 bg-black/60" />
        <div className="max-w-[1520px] relative h-full">
          <div className="absolute inset-y-0 right-0 w-[49vw] bg-[var(--color-siren-primary)]/70 [clip-path:polygon(35%_0,100%_0,62%_100%,0_100%)]" />

          <div
            data-animate="text"
            className="h-full flex flex-col justify-center"
          >
            <h1 className="text-5xl font-bold tracking-tight">리틀 머메이드</h1>
            <p className="text-2xl font-medium mt-7 mb-10 text-[var(--color-guren-text)]">
              &quot;아, 계속 말을 해줘야 해. 말하는 법을 까먹을지도 몰라.&quot;
            </p>
            <p className="text-lg mb-10 text-[var(--color-nayuta-text)]">
              2세대 페어리 테일 모델 중 하나인 니케.
              <br />
              이름이 길어, 주변 사람들은 보통 [세이렌]이라 부른다.
              <br />
              제어가 되지 않아 평소에 말을 하진 않지만,
              <br />
              옹알이 같은 소리로 감정을 또렷하게 표현한다.
            </p>
            <Button>리틀 머메이드와 시뮬레이션 시작하기</Button>
          </div>

          <div
            data-animate="image"
            className="z-10 lg:mt-0 absolute -bottom-70 right-0"
          >
            <Image
              src="/images/siren.png"
              alt="세이렌 일러스트"
              width={1200}
              height={1200}
              className="h-auto w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-x-[16%] bottom-3 h-14 bg-[#0f2340]/55 blur-2xl" />
          </div>
        </div>
      </section>
    </main>
  );
}
