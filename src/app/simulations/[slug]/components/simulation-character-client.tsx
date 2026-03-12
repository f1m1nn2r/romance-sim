import Link from "next/link";
import CharacterVisual from "@/src/components/common/character-visual";
import { Button } from "@/src/components/ui/button";

export type Chapter = {
  _id: string;
  title: string;
  chapterKey: string;
  displayOrder: number;
};

export type SimulationCharacterItem = {
  _id: string;
  name: string;
  slug: { current: string };
  mainVideoUrl?: string;
  backgroundImageUrl: string;
  mainImageUrl: string;
  chapters: Chapter[];
};

type SimulationCharacterClientProps = {
  character: SimulationCharacterItem;
};

export default function SimulationCharacterClient({
  character,
}: SimulationCharacterClientProps) {
  console.log("데이터 확인:", character);
  return (
    <main className="relative h-screen overflow-hidden bg-[#050d1b] text-[#e6edf6]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${character.backgroundImageUrl}')` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(34,61,95,0.34),transparent_45%),linear-gradient(110deg,rgba(6,13,28,0.88)_5%,rgba(7,15,30,0.6)_44%,rgba(2,6,14,0.93)_100%)]" />

      <div className="relative mx-auto flex min-h-screen h-full w-full max-w-[1540px] items-center justify-center px-5 pb-10 sm:px-10 lg:px-16">
        <CharacterVisual
          mainVideoUrl={character.mainVideoUrl}
          mainImageUrl={character.mainImageUrl}
          alt={`${character.name} 일러스트`}
          wrapperClassName="pointer-events-none max-w-[1100px]"
          videoClassName="h-auto w-full object-contain [filter:drop-shadow(0_12px_40px_rgba(0,0,0,0.7))] -mb-35"
          imageClassName="h-auto w-full object-contain [filter:drop-shadow(0_12px_40px_rgba(0,0,0,0.75))]"
          imagePriority
          videoPreload="metadata"
        />

        <section className="w-full max-w-[350px] -ml-30">
          <Link
            href="/"
            className="text-xs text-[#afbfda] transition hover:text-white sm:text-sm text-right block mb-3"
          >
            홈으로
          </Link>

          <div className="space-y-3">
            {character.chapters.length > 0 ? (
              character.chapters.map((chapter, index) => (
                <Button
                  key={chapter._id}
                  as="a"
                  href={`/simulations/${character.slug.current}/chapters/${chapter.chapterKey}`}
                  className="border-[#5a6577] bg-[linear-gradient(90deg,rgba(44,58,79,0.72)_0%,rgba(0,0,0,0.75)_28%,rgba(0,0,0,0.7)_72%,rgba(44,58,79,0.72)_100%)] text-[15px] tracking-[0.01em] transition "
                  style={{
                    animation: `fade-in 0.35s ease-out ${index * 0.06}s both`,
                  }}
                >
                  {chapter.title}
                </Button>
              ))
            ) : (
              <div className="rounded border border-[#4a5568] bg-black/35 px-5 py-4 text-sm text-[#becbe0]">
                공개된 챕터가 아직 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
