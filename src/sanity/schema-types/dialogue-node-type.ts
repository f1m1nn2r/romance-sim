import { defineArrayMember, defineField, defineType } from "sanity";
import type { PreviewValue } from "sanity";

export const dialogueNodeType = defineType({
  name: "dialogueNode",
  title: "Dialogue Node",
  type: "document",
  fields: [
    defineField({
      name: "nodeId",
      title: "노드 ID",
      type: "string",
      description:
        "콘텐츠 전용 안정 ID입니다. 나중에 choice를 분리할 때 기준 키로 사용됩니다. 예: hwm10h_001",
      validation: (rule) => rule.required().min(3).max(80),
    }),
    defineField({
      name: "chapterKey",
      title: "챕터 키",
      type: "string",
      description:
        "레거시/마이그레이션 호환용 보조 키입니다. 가능하면 chapter 참조를 우선 사용하세요.",
      validation: (rule) => rule.min(2).max(80),
    }),
    defineField({
      name: "chapter",
      title: "챕터",
      type: "reference",
      to: [{ type: "chapter" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stepOrder",
      title: "챕터 내 순서",
      type: "number",
      description: "편집 편의를 위한 정렬 값입니다.",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "speaker",
      title: "화자 캐릭터",
      type: "reference",
      to: [{ type: "character" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "line",
      title: "대사",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "expressionKey",
      title: "표정/상태 키",
      type: "string",
      description:
        "캐릭터 기본 에셋 맵을 사용할 때의 키입니다. 예: neutral, proud, sad",
    }),
    defineField({
      name: "mediaOverride",
      title: "대사 전용 미디어 오버라이드",
      type: "object",
      description:
        "특정 대사에서만 이미지/영상 교체가 필요할 때 사용합니다. 비어 있으면 캐릭터 기본값을 사용합니다.",
      fields: [
        defineField({
          name: "image",
          title: "오버라이드 이미지",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "video",
          title: "오버라이드 영상",
          type: "file",
          options: { accept: "video/mp4,video/webm" },
        }),
      ],
    }),
    defineField({
      name: "choices",
      title: "선택지",
      type: "array",
      validation: (rule) =>
        rule.custom((choices, context) => {
          const document = context.document as { isEnding?: boolean } | undefined;
          const choiceCount = Array.isArray(choices) ? choices.length : 0;

          if (document?.isEnding) {
            return true;
          }

          if (choiceCount < 1) {
            return "종료 노드가 아니면 선택지를 최소 1개 이상 입력하세요.";
          }

          if (choiceCount > 4) {
            return "선택지는 최대 4개까지 입력할 수 있습니다.";
          }

          return true;
        }),
      of: [
        defineArrayMember({
          name: "choice",
          title: "Choice",
          type: "object",
          fields: [
            defineField({
              name: "choiceId",
              title: "선택지 ID",
              type: "string",
              description:
                "선택지 전용 안정 ID입니다. choice 분리 마이그레이션 시 기준 키로 사용됩니다. 예: hwm10h_001_a",
              validation: (rule) => rule.required().min(3).max(80),
            }),
            defineField({
              name: "label",
              title: "선택지 문구",
              type: "string",
              validation: (rule) => rule.required().min(1).max(200),
            }),
            defineField({
              name: "isCorrect",
              title: "정답 여부",
              type: "boolean",
              initialValue: false,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "nextNode",
              title: "다음 노드",
              type: "reference",
              to: [{ type: "dialogueNode" }],
              weak: true,
              description:
                "다음 대화 노드를 직접 연결합니다. 아직 미작성 상태면 비워둘 수 있습니다.",
            }),
            defineField({
              name: "nextNodeIdFallback",
              title: "다음 노드 ID (fallback)",
              type: "string",
              description:
                "참조가 어려운 초기 입력/마이그레이션용 보조 키입니다. 운영 안정화 후 제거해도 됩니다.",
            }),
            defineField({
              name: "resultLine",
              title: "선택 직후 단문 반응 (선택)",
              type: "string",
              description:
                "다음 노드로 넘어가기 전에 짧은 반응 한 줄이 필요할 때만 사용합니다.",
            }),
          ],
          preview: {
            select: {
              title: "label",
              isCorrect: "isCorrect",
              target: "nextNode.nodeId",
            },
            prepare(selection) {
              const { title, isCorrect, target } = selection as {
                title?: string;
                isCorrect?: boolean;
                target?: string;
              };
              return {
                title: title ?? "(선택지)",
                subtitle: `${isCorrect ? "정답" : "오답"} | next: ${target ?? "-"}`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "isEnding",
      title: "종료 노드 여부",
      type: "boolean",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      nodeId: "nodeId",
      chapterKey: "chapterKey",
      chapterRefKey: "chapter.chapterKey",
      speakerName: "speaker.name",
      line: "line",
      media: "mediaOverride.image",
    },
    prepare(selection) {
      const { nodeId, chapterKey, chapterRefKey, speakerName, line, media } =
        selection as {
        nodeId?: string;
        chapterKey?: string;
        chapterRefKey?: string;
        speakerName?: string;
        line?: string;
        media?: PreviewValue["media"];
      };

      return {
        title: `${chapterRefKey ?? chapterKey ?? "chapter"} · ${nodeId ?? "node"}`,
        subtitle: `${speakerName ?? "Unknown"}: ${line ?? ""}`,
        media,
      };
    },
  },
});
