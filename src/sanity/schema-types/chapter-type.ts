import { defineField, defineType } from "sanity";

export const chapterType = defineType({
  name: "chapter",
  title: "Chapter",
  type: "document",
  fields: [
    defineField({
      name: "chapterKey",
      title: "챕터 고유 키",
      type: "string",
      description: "안정 식별자입니다. 예: flower-no-red-after-ten-days",
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: "title",
      title: "챕터/에피소드 이름",
      type: "string",
      description: "챕터/에피소드 이름",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "character",
      title: "캐릭터",
      type: "reference",
      to: [{ type: "character" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "displayOrder",
      title: "챕터/에피소드 순서",
      type: "number",
      description: "목록 노출 순서입니다.",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "description",
      title: "챕터 설명",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "entryNode",
      title: "시작 노드",
      type: "reference",
      to: [{ type: "dialogueNode" }],
      weak: true,
      description: "챕터 진입 시 첫 번째로 보여줄 대화 노드입니다.",
    }),
    defineField({
      name: "isPublished",
      title: "공개 여부",
      type: "boolean",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      chapterKey: "chapterKey",
      order: "displayOrder",
      characterName: "character.name",
    },
    prepare(selection) {
      const { title, chapterKey, order, characterName } = selection as {
        title?: string;
        chapterKey?: string;
        order?: number;
        characterName?: string;
      };

      return {
        title: title ?? "(Untitled chapter)",
        subtitle: `${characterName ?? "No Character"} · #${order ?? "-"} · ${chapterKey ?? "-"}`,
      };
    },
  },
});
