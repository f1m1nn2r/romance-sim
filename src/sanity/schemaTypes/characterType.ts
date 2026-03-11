import { defineField, defineType } from "sanity";

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
