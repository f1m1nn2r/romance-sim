export type ChapterProgressStatus = "locked" | "unlocked" | "cleared";

export type ChapterProgressRecord = {
  status: ChapterProgressStatus;
  unlockedAt?: string;
  clearedAt?: string;
};

export type CharacterChapterProgress = Record<string, ChapterProgressRecord>;

export type SimulationProgressStore = {
  version: 1;
  characters: Record<string, CharacterChapterProgress>;
};

export type ProgressChapter = {
  chapterKey: string;
  displayOrder: number;
  title?: string;
};

// 캐릭터별 챕터 진행 상태를 브라우저 localStorage에 저장
// 첫 챕터는 기본 해금 상태이며, 정답 선택 시 다음 챕터를 해금
const STORAGE_KEY = "web-romance-sim:progress:v1";
const PROGRESS_UPDATED_EVENT = "simulation-progress-updated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidStatus(value: unknown): value is ChapterProgressStatus {
  return value === "locked" || value === "unlocked" || value === "cleared";
}

function createEmptyStore(): SimulationProgressStore {
  return {
    version: 1,
    characters: {},
  };
}

// 저장/해금 순서를 맞추기 위해 항상 displayOrder 기준으로 정렬
function getOrderedChapters(chapters: ProgressChapter[]) {
  return [...chapters].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function createDefaultCharacterProgress(
  chapters: ProgressChapter[],
): CharacterChapterProgress {
  const orderedChapters = getOrderedChapters(chapters);

  return orderedChapters.reduce<CharacterChapterProgress>(
    (accumulator, chapter, index) => {
      accumulator[chapter.chapterKey] = {
        status: index === 0 ? "unlocked" : "locked",
      };
      return accumulator;
    },
    {},
  );
}

// localStorage에 저장된 값이 깨졌거나 누락된 경우를 보정해
// 현재 챕터 목록 기준으로 안전한 진행 상태를 다시 생성
export function sanitizeCharacterProgress(
  chapters: ProgressChapter[],
  input: unknown,
): CharacterChapterProgress {
  const orderedChapters = getOrderedChapters(chapters);
  const fallback = createDefaultCharacterProgress(orderedChapters);

  if (!isRecord(input)) {
    return fallback;
  }

  const sanitized = orderedChapters.reduce<CharacterChapterProgress>(
    (accumulator, chapter) => {
      const rawEntry = input[chapter.chapterKey];

      if (!isRecord(rawEntry) || !isValidStatus(rawEntry.status)) {
        accumulator[chapter.chapterKey] = fallback[chapter.chapterKey];
        return accumulator;
      }

      accumulator[chapter.chapterKey] = {
        status: rawEntry.status,
        unlockedAt:
          typeof rawEntry.unlockedAt === "string"
            ? rawEntry.unlockedAt
            : undefined,
        clearedAt:
          typeof rawEntry.clearedAt === "string"
            ? rawEntry.clearedAt
            : undefined,
      };

      return accumulator;
    },
    {},
  );

  const hasAccessibleChapter = orderedChapters.some((chapter) => {
    const status = sanitized[chapter.chapterKey]?.status;
    return status === "unlocked" || status === "cleared";
  });

  if (!hasAccessibleChapter && orderedChapters[0]) {
    sanitized[orderedChapters[0].chapterKey] = {
      status: "unlocked",
      unlockedAt: sanitized[orderedChapters[0].chapterKey]?.unlockedAt,
    };
  }

  return sanitized;
}

// localStorage에서 전체 진행 스토어를 읽음
// 구조가 맞지 않으면 빈 스토어로 복구
export function loadSimulationProgressStore(): SimulationProgressStore {
  if (typeof window === "undefined") {
    return createEmptyStore();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyStore();
    }

    const parsed = JSON.parse(raw);

    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !isRecord(parsed.characters)
    ) {
      return createEmptyStore();
    }

    return {
      version: 1,
      characters: parsed.characters as Record<string, CharacterChapterProgress>,
    };
  } catch {
    return createEmptyStore();
  }
}

// 저장 후 커스텀 이벤트를 발생시켜 같은 탭 안의 구독자도 즉시 갱신
export function saveSimulationProgressStore(store: SimulationProgressStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
}

// 캐릭터 진행 상태를 읽고, sanitize된 최신 형태를 다시 저장해
// 오래된 구조나 누락 데이터를 정리
export function getCharacterProgress(
  characterSlug: string,
  chapters: ProgressChapter[],
): CharacterChapterProgress {
  const sanitized = readCharacterProgress(characterSlug, chapters);
  const store = loadSimulationProgressStore();

  store.characters[characterSlug] = sanitized;
  saveSimulationProgressStore(store);

  return sanitized;
}

export function readCharacterProgress(
  characterSlug: string,
  chapters: ProgressChapter[],
): CharacterChapterProgress {
  const store = loadSimulationProgressStore();
  return sanitizeCharacterProgress(chapters, store.characters[characterSlug]);
}

export function getChapterStatus(
  progress: CharacterChapterProgress,
  chapterKey: string,
): ChapterProgressStatus {
  return progress[chapterKey]?.status ?? "locked";
}

// 정답 엔딩일 때 현재 챕터를 cleared로 바꾸고 다음 챕터를 해금
export function persistChapterResult(params: {
  characterSlug: string;
  chapters: ProgressChapter[];
  chapterKey: string;
  isCorrect: boolean;
}) {
  const { characterSlug, chapters, chapterKey, isCorrect } = params;
  const orderedChapters = getOrderedChapters(chapters);
  const progress = getCharacterProgress(characterSlug, orderedChapters);

  if (!isCorrect) {
    return {
      progress,
      nextUnlockedChapter: undefined,
    };
  }

  const now = new Date().toISOString();
  const current = progress[chapterKey];

  if (current) {
    progress[chapterKey] = {
      ...current,
      status: "cleared",
      unlockedAt: current.unlockedAt ?? now,
      clearedAt: now,
    };
  }

  const currentIndex = orderedChapters.findIndex(
    (chapter) => chapter.chapterKey === chapterKey,
  );
  const nextChapter =
    currentIndex >= 0 ? orderedChapters[currentIndex + 1] : undefined;

  if (nextChapter) {
    const nextProgress = progress[nextChapter.chapterKey];

    if (!nextProgress || nextProgress.status === "locked") {
      progress[nextChapter.chapterKey] = {
        status: "unlocked",
        unlockedAt: nextProgress?.unlockedAt ?? now,
        clearedAt: nextProgress?.clearedAt,
      };
    }
  }

  const store = loadSimulationProgressStore();
  store.characters[characterSlug] = progress;
  saveSimulationProgressStore(store);

  return {
    progress,
    nextUnlockedChapter: nextChapter,
  };
}

// 다른 탭의 storage 이벤트와 현재 탭의 커스텀 이벤트를 모두 구독
export function subscribeSimulationProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PROGRESS_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PROGRESS_UPDATED_EVENT, onStoreChange);
  };
}
