"use client";

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_CONCURRENCY = 2;
const preloadedImages = new Set<string>();
const preloadedVideos = new Set<string>();
const pendingTasks = new Map<string, Promise<void>>();

function uniqueUrls(urls: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      urls.filter(
        (url): url is string => typeof url === "string" && url.length > 0,
      ),
    ),
  );
}

function withTimeout(task: Promise<void>, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(resolve, timeoutMs);

    void task.finally(() => {
      window.clearTimeout(timeoutId);
      resolve();
    });
  });
}

function preloadImage(url: string) {
  return withTimeout(
    new Promise<void>((resolve) => {
      const image = new window.Image();

      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = url;
    }),
  );
}

function preloadVideo(url: string) {
  return withTimeout(
    new Promise<void>((resolve) => {
      const video = document.createElement("video");
      const finish = () => {
        video.onloadeddata = null;
        video.oncanplay = null;
        video.onerror = null;
        resolve();
      };

      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = finish;
      video.oncanplay = finish;
      video.onerror = finish;
      video.src = url;
      video.load();
    }),
  );
}

function getTaskKey(type: "image" | "video", url: string) {
  return `${type}:${url}`;
}

function getCache(type: "image" | "video") {
  return type === "image" ? preloadedImages : preloadedVideos;
}

function loadWithGlobalCache(
  type: "image" | "video",
  url: string,
  loader: (targetUrl: string) => Promise<void>,
) {
  const cache = getCache(type);

  if (cache.has(url)) {
    return Promise.resolve();
  }

  const taskKey = getTaskKey(type, url);
  const pendingTask = pendingTasks.get(taskKey);

  if (pendingTask) {
    return pendingTask;
  }

  const nextTask = loader(url)
    .then(() => {
      cache.add(url);
    })
    .catch(() => {})
    .finally(() => {
      pendingTasks.delete(taskKey);
    });

  pendingTasks.set(taskKey, nextTask);

  return nextTask;
}

async function runWithConcurrency(
  urls: string[],
  worker: (url: string) => Promise<void>,
  concurrency = DEFAULT_CONCURRENCY,
) {
  if (urls.length === 0) {
    return;
  }

  const queue = [...urls];
  const workerCount = Math.min(concurrency, queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const url = queue.shift();

        if (!url) {
          continue;
        }

        await worker(url);
      }
    }),
  );
}

export async function preloadImageUrls(urls: Array<string | undefined | null>) {
  await runWithConcurrency(uniqueUrls(urls), preloadImage, 4);
}

export async function preloadVideoUrls(urls: Array<string | undefined | null>) {
  await runWithConcurrency(uniqueUrls(urls), preloadVideo, 2);
}

export async function preloadMediaAssets({
  imageUrls,
  videoUrls,
  onProgress,
}: {
  imageUrls: Array<string | undefined | null>;
  videoUrls: Array<string | undefined | null>;
  onProgress?: (progress: { loaded: number; total: number }) => void;
}) {
  const uniqueImageUrls = uniqueUrls(imageUrls);
  const uniqueVideoUrls = uniqueUrls(videoUrls);
  const tasks = [
    ...uniqueImageUrls.map((url) => ({
      url,
      type: "image" as const,
      run: () => loadWithGlobalCache("image", url, preloadImage),
    })),
    ...uniqueVideoUrls.map((url) => ({
      url,
      type: "video" as const,
      run: () => loadWithGlobalCache("video", url, preloadVideo),
    })),
  ];
  const total = tasks.length;
  let loaded = 0;

  onProgress?.({ loaded, total });

  if (total === 0) {
    return;
  }

  const queue = [...tasks];
  const workerCount = Math.min(4, queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const task = queue.shift();

        if (!task) {
          continue;
        }

        await task.run();
        loaded += 1;
        onProgress?.({ loaded, total });
      }
    }),
  );
}
