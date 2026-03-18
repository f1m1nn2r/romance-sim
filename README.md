# Web Romance Sim

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Sanity](https://img.shields.io/badge/Sanity-CMS-f03e2f?logo=sanity)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-Animation-88ce02)

Next.js와 Sanity를 활용해 CMS 기반 분기형 대화 시스템을 구현한 웹 연애 시뮬레이션 프로젝트입니다.  
캐릭터 소개 화면에서 인물을 선택하고, 챕터를 선택한 뒤 대사와 선택지를 통해 스토리를 진행할 수 있습니다.

콘텐츠(캐릭터, 챕터, 대화 노드)는 Sanity CMS에서 관리하며, 프론트엔드는 해당 데이터를 기반으로 시뮬레이션 흐름을 동적으로 렌더링합니다.

---

## 주요 기능

### 캐릭터 선택 화면

- 캐릭터 소개 및 미디어 표시
- GSAP 기반 스크롤 전환 연출

### 챕터 선택

- 캐릭터별 챕터 목록 조회
- 챕터 선택 후 시뮬레이션 진입

### 시뮬레이션 대화

- 타이핑 효과 기반 대사 출력
- 선택지에 따른 분기형 대화 구조
- 캐릭터 표정 및 미디어 교체

### CMS 콘텐츠 관리

- Sanity Studio에서 콘텐츠 관리
- 코드 수정 없이 스토리/대화 구조 변경 가능

---

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Sanity
- GSAP

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 확인할 수 있습니다.

## 환경변수

아래 값이 필요합니다.

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
```

## 주요 경로

- `/` : 홈
- `/simulations/[slug]` : 캐릭터별 챕터 목록
- `/simulations/[slug]/chapters/[chapter-key]` : 실제 시뮬레이션 진행 화면
- `/studio` : Sanity Studio

## Sanity 콘텐츠 구조

- `character` : 캐릭터 기본 정보, 대표 이미지/영상, 배경, 표정 세트
- `chapter` : 캐릭터에 연결된 챕터 정보
- `dialogueNode` : 대사, 화자, 선택지, 다음 노드 연결
