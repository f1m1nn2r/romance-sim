"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CharacterVisual from "@/src/components/common/character-visual";
import { Button } from "@/src/components/ui/button";
import {
  getBackgroundImageUrl,
  getDialogueImageUrl,
} from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// ─── 타입 ────────────────────────────────────────────────────

type CharacterExpressionAsset = {
  key: string;
  label?: string;
  image?: SanityImageSource;
  videoUrl?: string;
};

type ChapterCharacter = {
  _id: string;
  name: string;
  slug: string;
  mainImage: SanityImageSource;
  mainVideoUrl?: string;
  backgroundImage: SanityImageSource;
  expressions?: CharacterExpressionAsset[];
};

type DialogueChoice = {
  choiceId: string;
  label: string;
  isCorrect: boolean;
  resultLine?: string;
  nextNodeId?: string;
};

type DialogueNode = {
  _id: string;
  nodeId: string;
  stepOrder: number;
  line: string;
  isEnding: boolean;
  expressionKey?: string;
  mediaOverrideImage?: SanityImageSource;
  mediaOverrideVideoUrl?: string;
  speaker: ChapterCharacter;
  choices?: DialogueChoice[];
};

export type SimulationChapterPageData = {
  _id: string;
  title: string;
  chapterKey: string;
  description?: string;
  entryNodeId?: string;
  character: ChapterCharacter;
  nodes: DialogueNode[];
};

type SimulationDialogueClientProps = {
  chapter: SimulationChapterPageData;
};

type DialoguePhase = "line" | "choices";

// ─── 상수 ────────────────────────────────────────────────────

const imageClassBySlug: Record<string, string> = {
  nayuta: "right-0 bottom-[-35%] max-w-[1100px]",
  guren: "right-20 bottom-[-12%] max-w-[1100px]",
  siren: "right-25 bottom-[-15%] max-w-[1050px]",
};

const TYPING_SOUND_PATH = "/sounds/Mewpot-typing.mp3";

// ─── 분리된 함수들 ────────────────────────────────────────────

/**
 * 현재 노드 기준으로 다음 nodeId를 결정
 * 단일 선택지가 있으면 그 nextNodeId를, 없으면 다음 순서 노드를 반환
 */
function resolveNextNodeId(
  nodes: DialogueNode[],
  currentIndex: number,
  choices: DialogueChoice[],
): string | undefined {
  const explicitNext =
    choices.length === 1 ? choices[0]?.nextNodeId : undefined;
  const sequentialNext = nodes[currentIndex + 1]?.nodeId;
  return explicitNext ?? sequentialNext;
}

/**
 * 현재 노드의 시각 에셋(영상/이미지/배경)을 결정
 */
function resolveVisualAssets(
  node: DialogueNode,
  fallbackCharacter: ChapterCharacter,
) {
  const speaker = node.speaker ?? fallbackCharacter;
  const expressionAsset = speaker.expressions?.find(
    (asset) => asset.key === node.expressionKey,
  );

  return {
    speaker,
    videoUrl:
      node.mediaOverrideVideoUrl ??
      expressionAsset?.videoUrl ??
      speaker.mainVideoUrl,
    imageSource:
      node.mediaOverrideImage ?? expressionAsset?.image ?? speaker.mainImage,
    backgroundSource:
      speaker.backgroundImage ?? fallbackCharacter.backgroundImage,
  };
}

// ─── 컴포넌트 ────────────────────────────────────────────────

export default function SimulationDialogueClient({
  chapter,
}: SimulationDialogueClientProps) {
  const router = useRouter();
  const [visibleLine, setVisibleLine] = useState("");
  const [currentNodeId, setCurrentNodeId] = useState(
    chapter.entryNodeId ?? chapter.nodes[0]?.nodeId,
  );
  const [phase, setPhase] = useState<DialoguePhase>("line");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);

  // 현재 노드 계산
  const nodeMap = useMemo(
    () => new Map(chapter.nodes.map((node) => [node.nodeId, node])),
    [chapter.nodes],
  );
  const currentIndex = chapter.nodes.findIndex(
    (n) => n.nodeId === currentNodeId,
  );
  const currentNode =
    currentIndex >= 0 ? chapter.nodes[currentIndex] : chapter.nodes[0];
  const isTyping =
    Boolean(currentNode) && visibleLine.length < currentNode.line.length;

  // 현재 노드 파생값
  const choices = currentNode?.choices ?? [];
  const hasMultipleChoices = choices.length > 1;
  const isLineComplete = visibleLine === currentNode?.line;
  const nextNodeId = currentNode
    ? resolveNextNodeId(chapter.nodes, currentIndex, choices)
    : undefined;
  const canAdvance =
    Boolean(currentNode) &&
    !currentNode.isEnding &&
    !hasMultipleChoices &&
    Boolean(nextNodeId);

  // 시각 에셋
  const { speaker, videoUrl, imageSource, backgroundSource } = currentNode
    ? resolveVisualAssets(currentNode, chapter.character)
    : {
        speaker: chapter.character,
        videoUrl: chapter.character.mainVideoUrl,
        imageSource: chapter.character.mainImage,
        backgroundSource: chapter.character.backgroundImage,
      };
  const imageUrl = getDialogueImageUrl(imageSource);
  const backgroundUrl = getBackgroundImageUrl(backgroundSource);

  // 핸들러
  const goToNode = (nodeId: string) => {
    if (!nodeMap.has(nodeId)) return;
    setVisibleLine("");
    setPhase("line");
    setCurrentNodeId(nodeId);
  };

  const handleStageClick = () => {
    setHasUserInteracted(true);

    if (!currentNode) return;

    if (!isLineComplete) {
      setVisibleLine(currentNode.line);
      return;
    }
    if (hasMultipleChoices) {
      setPhase("choices");
      return;
    }
    if (currentNode.isEnding) {
      router.push(`/simulations/${chapter.character.slug}`);
      return;
    }
    if (canAdvance && nextNodeId) {
      goToNode(nextNodeId);
    }
  };

  const handleSelectChoice = (nextNodeId?: string) => {
    setHasUserInteracted(true);
    if (nextNodeId) goToNode(nextNodeId);
  };

  useEffect(() => {
    const audio = new Audio(TYPING_SOUND_PATH);
    audio.loop = true;
    audio.volume = 0.18;
    typingAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      typingAudioRef.current = null;
    };
  }, []);

  // 타이핑 이펙트
  useEffect(() => {
    if (!currentNode?.line) return;

    const glyphs = Array.from(currentNode.line);
    let cursor = 0;

    const timer = window.setInterval(() => {
      cursor += 1;
      setVisibleLine(glyphs.slice(0, cursor).join(""));
      if (cursor >= glyphs.length) window.clearInterval(timer);
    }, 60); // 고정

    return () => window.clearInterval(timer);
  }, [currentNode]);

  useEffect(() => {
    const audio = typingAudioRef.current;

    if (!audio) {
      return;
    }

    if (!hasUserInteracted || !isTyping || phase !== "line") {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [hasUserInteracted, isTyping, phase]);

  // 렌더
  if (!currentNode) {
    return <main className="min-h-screen bg-[#050d1b]" />;
  }

  return (
    <main
      className="relative bg-[#020713] text-[#edf3fb] h-screen overflow-hidden"
      onClick={handleStageClick}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-500"
        style={{ backgroundImage: `url('${backgroundUrl}')` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(50,81,122,0.24),transparent_32%),linear-gradient(180deg,rgba(4,10,20,0.22)_0%,rgba(3,8,18,0.76)_54%,rgba(0,0,0,0.96)_100%)]" />

      {/* 캐릭터 + 대화 */}
      <div className="relative flex justify-center items-end">
        <div className="absolute z-10 inset-x-0 bottom-0 h-[80vh] bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.68)_25%,#000_100%)]" />

        <CharacterVisual
          mainVideoUrl={videoUrl}
          mainImageUrl={imageUrl}
          alt={`${speaker.name} 일러스트`}
          wrapperClassName={`relative z-0 ${imageClassBySlug[speaker.slug] ?? "w-[min(58vw,780px)]"}`}
          imagePriority
          videoPreload="auto"
        />

        <section className="z-10 w-full absolute bottom-80">
          <div className="max-w-[720px] mx-auto">
            {/* 대사 */}
            {!(hasMultipleChoices && phase === "choices") && (
              <>
                <h1 className="mb-4 border-l-4 border-white pl-3 text-2xl font-bold">
                  {speaker.name}
                </h1>
                <p className="text-base leading-relaxed whitespace-pre-line text-white/95">
                  {visibleLine}
                  {isTyping && (
                    <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-white/75 align-[-0.15em]" />
                  )}
                </p>
              </>
            )}

            {/* 선택지 */}
            {hasMultipleChoices && phase === "choices" && (
              <div className="space-y-3">
                {choices.map((choice) => (
                  <Button
                    key={choice.choiceId}
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectChoice(choice.nextNodeId);
                    }}
                    className="mx-auto"
                  >
                    {choice.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
