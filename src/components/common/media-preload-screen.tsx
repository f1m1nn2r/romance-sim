"use client";

type MediaPreloadScreenProps = {
  loaded: number;
  total: number;
};

export default function MediaPreloadScreen({
  loaded,
  total,
}: MediaPreloadScreenProps) {
  const completionRatio = total > 0 ? loaded / total : 0;
  const percentage = Math.min(100, Math.round(completionRatio * 100));

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <div className="w-full">
        <p className="text-[11px] tracking-[0.35em] text-white/45">LOADING</p>
        <div className="mt-5 h-[3px] overflow-hidden bg-white/12">
          <div
            className="h-full bg-white transition-[width] duration-200"
            style={{ width: `${completionRatio * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-white/55">
          {percentage}/100
        </p>
      </div>
    </main>
  );
}
