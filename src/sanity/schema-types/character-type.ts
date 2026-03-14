import { defineArrayMember, defineField, defineType } from "sanity";

export const characterType = defineType({
  name: "character", // sanity 내부 데이터에서 사용
  title: "Character", // studio에서 보여지는 이름
  type: "document", // 어떤 종류의 데이터인지 (현재는 하나의 문서)
  fields: [
    // 데이터 속성들
    defineField({
      // 필드 정의 함수
      name: "displayOrder",
      title: "메인 노출 순서",
      type: "number",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "name",
      title: "이름",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "슬러그",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "캐릭터 이미지",
      type: "image",
      options: { hotspot: true }, // 크롭 포인트 지정 가능
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainVideo",
      title: "캐릭터 영상 (선택)",
      type: "file",
      options: {
        accept: "video/mp4,video/webm",
      },
      description: "등록하면 메인 이미지 대신 자동 반복 재생됩니다.",
    }),
    defineField({
      name: "backgroundImage",
      title: "배경 이미지",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "expressions",
      title: "표정/상태 에셋 맵",
      type: "array",
      description:
        "dialogueNode.expressionKey와 연결되는 캐릭터 전용 이미지/영상 목록입니다.",
      of: [
        defineArrayMember({
          name: "expressionAsset",
          title: "Expression Asset",
          type: "object",
          fields: [
            defineField({
              name: "key",
              title: "표정/상태 키",
              type: "string",
              description: "예: neutral, proud, sad",
              validation: (rule) => rule.required().min(1).max(80),
            }),
            defineField({
              name: "label",
              title: "표시 이름",
              type: "string",
              description: "스튜디오에서 구분하기 위한 선택 항목입니다.",
            }),
            defineField({
              name: "image",
              title: "표정 이미지",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "video",
              title: "표정 영상",
              type: "file",
              options: {
                accept: "video/mp4,video/webm",
              },
            }),
          ],
          preview: {
            select: {
              title: "label",
              key: "key",
              media: "image",
            },
            prepare(selection) {
              const { title, key, media } = selection as {
                title?: string;
                key?: string;
                media?: unknown;
              };

              return {
                title: title ?? key ?? "(표정 에셋)",
                subtitle: key ? `key: ${key}` : undefined,
                media,
              };
            },
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          if (!Array.isArray(value)) {
            return true;
          }

          const seenKeys = new Set<string>();

          for (const item of value) {
            const key =
              typeof item === "object" &&
              item !== null &&
              "key" in item &&
              typeof item.key === "string"
                ? item.key.trim()
                : "";

            if (!key) {
              continue;
            }

            if (seenKeys.has(key)) {
              return `표정/상태 키 '${key}'가 중복되었습니다.`;
            }

            seenKeys.add(key);
          }

          return true;
        }),
    }),
    defineField({
      name: "introQuote",
      title: "인용문",
      type: "text",
      rows: 3, // text 입력창 높이
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "캐릭터 설명",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ctaLabel",
      title: "버튼 문구",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "slug.current", media: "mainImage" },
  },
});
