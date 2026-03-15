"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import CharacterVisual from "@/src/components/common/character-visual";
import MediaPreloadScreen from "@/src/components/common/media-preload-screen";
import { Button } from "@/src/components/ui/button";
import { useMediaPreload } from "@/src/hooks/use-media-preload";
import { usePressAnimation } from "@/src/hooks/use-press-animation";
import {
  getChapterStatus,
  persistChapterResult,
  readCharacterProgress,
  subscribeSimulationProgress,
  type ProgressChapter,
} from "@/src/lib/simulation-progress";
import {
  getBackgroundImageUrl,
  getDialogueImageUrl,
} from "@/src/sanity/lib/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import ChoiceResultOverlay from "./choice-result-overlay";

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
  chapters?: ProgressChapter[];
};

type DialogueChoice = {
  choiceId?: string;
  label?: string;
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
  displayOrder: number;
  description?: string;
  entryNodeId?: string;
  character: ChapterCharacter;
  nodes: DialogueNode[];
};

type SimulationDialogueClientProps = {
  chapter: SimulationChapterPageData;
};

type DialoguePhase = "line" | "choices";
type ChapterAccessState = "loading" | "ready" | "blocked";

type ChoiceResultState = {
  isCorrect: boolean;
  title: string;
  message: string;
  description: string;
};

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
  const runPressAnimation = usePressAnimation();
  const [visibleLine, setVisibleLine] = useState("");
  const [currentNodeId, setCurrentNodeId] = useState(
    chapter.entryNodeId ?? chapter.nodes[0]?.nodeId,
  );
  const [phase, setPhase] = useState<DialoguePhase>("line");
  const [chapterAccessState, setChapterAccessState] =
    useState<ChapterAccessState>("loading");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [pendingChoiceResult, setPendingChoiceResult] =
    useState<ChoiceResultState | null>(null);
  const [choiceResult, setChoiceResult] = useState<ChoiceResultState | null>(
    null,
  );
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const chapterSequence = useMemo(
    () =>
      chapter.character.chapters && chapter.character.chapters.length > 0
        ? chapter.character.chapters
        : [
            {
              chapterKey: chapter.chapterKey,
              displayOrder: chapter.displayOrder,
              title: chapter.title,
            },
          ],
    [
      chapter.character.chapters,
      chapter.chapterKey,
      chapter.displayOrder,
      chapter.title,
    ],
  );
  useEffect(() => {
    const updateAccessState = () => {
      const progress = readCharacterProgress(
        chapter.character.slug,
        chapterSequence,
      );
      const status = getChapterStatus(progress, chapter.chapterKey);

      setChapterAccessState(status === "locked" ? "blocked" : "ready");
    };

    updateAccessState();

    return subscribeSimulationProgress(updateAccessState);
  }, [chapter.character.slug, chapter.chapterKey, chapterSequence]);

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
  const preloadImageUrls = useMemo(
    () =>
      chapter.nodes.flatMap((node) => {
        const {
          speaker,
          imageSource: nodeImageSource,
          backgroundSource,
        } = resolveVisualAssets(node, chapter.character);
        const expressionImageUrls =
          speaker.expressions?.map((asset) =>
            asset.image ? getDialogueImageUrl(asset.image) : undefined,
          ) ?? [];

        return [
          getDialogueImageUrl(nodeImageSource),
          getBackgroundImageUrl(backgroundSource),
          getDialogueImageUrl(speaker.mainImage),
          ...expressionImageUrls,
        ];
      }),
    [chapter],
  );
  const preloadVideoUrls = useMemo(
    () =>
      chapter.nodes.flatMap((node) => {
        const { speaker, videoUrl: resolvedVideoUrl } = resolveVisualAssets(
          node,
          chapter.character,
        );

        return [
          resolvedVideoUrl,
          speaker.mainVideoUrl,
          ...(speaker.expressions?.map((asset) => asset.videoUrl) ?? []),
        ];
      }),
    [chapter],
  );
  const { isReady: isMediaReady, progress: preloadProgress } = useMediaPreload({
    imageUrls: preloadImageUrls,
    videoUrls: preloadVideoUrls,
  });

  // 핸들러
  const goToNode = (nodeId: string) => {
    if (!nodeMap.has(nodeId)) return;
    setVisibleLine("");
    setPhase("line");
    setCurrentNodeId(nodeId);
  };

  const handleStageClick = () => {
    if (chapterAccessState !== "ready") {
      return;
    }

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
      if (pendingChoiceResult) {
        if (pendingChoiceResult.isCorrect) {
          const { nextUnlockedChapter } = persistChapterResult({
            characterSlug: chapter.character.slug,
            chapters: chapterSequence,
            chapterKey: chapter.chapterKey,
            isCorrect: true,
          });

          setChoiceResult({
            ...pendingChoiceResult,
            description: nextUnlockedChapter
              ? `다음 챕터 "${nextUnlockedChapter.title ?? nextUnlockedChapter.chapterKey}"가 해금되었습니다.`
              : "마지막 공개 챕터까지 모두 완료했습니다.",
          });

          return;
        }

        setChoiceResult(pendingChoiceResult);
        return;
      }
      router.push(`/simulations/${chapter.character.slug}`);
      return;
    }
    if (canAdvance && nextNodeId) {
      goToNode(nextNodeId);
    }
  };

  const handleSelectChoice = (choice: DialogueChoice) => {
    setHasUserInteracted(true);
    setPendingChoiceResult(
      choice.isCorrect
        ? {
            isCorrect: true,
            title: "챕터 클리어",
            message: `${speaker.name}과 의미 있는 대화를 나눴다.`,
            description: "",
          }
        : {
            isCorrect: false,
            title: "",
            message: `${speaker.name}과 아쉬운 상태로 대화를 마무리했다.\n다음에는 더 좋은 선택을 해보자.`,
            description: "",
          },
    );

    if (choice.nextNodeId) {
      goToNode(choice.nextNodeId);
    }
  };

  const handleResultOverlayClick = () => {
    router.push(`/simulations/${chapter.character.slug}`);
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

  useEffect(() => {
    if (chapterAccessState !== "blocked") {
      return;
    }

    router.replace(`/simulations/${chapter.character.slug}`);
  }, [chapter.character.slug, chapterAccessState, router]);

  // 렌더
  if (!currentNode) {
    return <main className="min-h-screen bg-[#050d1b]" />;
  }

  if (chapterAccessState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#000] px-6 text-center text-[#d9e5f4]">
        <p className="text-sm tracking-[0.18em] text-white/70">
          챕터 진행 상태를 확인하고 있습니다.
        </p>
      </main>
    );
  }

  if (chapterAccessState === "blocked") {
    return <main className="min-h-screen bg-[#020713]" />;
  }

  if (!isMediaReady) {
    return (
      <MediaPreloadScreen
        loaded={preloadProgress.loaded}
        total={preloadProgress.total}
      />
    );
  }

  return (
    <main
      className="relative bg-[#020713] text-[#edf3fb] h-screen overflow-hidden"
      onClick={handleStageClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleStageClick();
        }
      }}
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
                <p className="text-base leading-relaxed whitespace-pre-line text-white/95 min-h-[52px]">
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
                {choices.map((choice, index) => (
                  <Button
                    key={choice.choiceId ?? `choice-${index}`}
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      runPressAnimation(e.currentTarget, {
                        onComplete: () => {
                          handleSelectChoice(choice);
                        },
                      });
                    }}
                    className="mx-auto"
                  >
                    {choice.label ?? "선택지"}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {choiceResult ? (
        <ChoiceResultOverlay
          title={choiceResult.title}
          message={choiceResult.message}
          description={choiceResult.description}
          onClick={handleResultOverlayClick}
        />
      ) : null}
    </main>
  );
}
