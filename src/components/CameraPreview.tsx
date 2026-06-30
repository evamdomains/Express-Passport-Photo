'use client';

/**
 * Still-image confirm step shown after a live capture. Purely presentational —
 * "Use Photo" hands the already-created File back up; nothing is reprocessed here.
 */
export default function CameraPreview({
  src,
  onRetake,
  onUse,
}: {
  src: string;
  onRetake: () => void;
  onUse: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Captured selfie preview" className="max-h-[60vh] w-auto rounded-2xl object-contain" />
      <div className="flex w-full max-w-sm gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="flex-1 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/25"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onUse}
          autoFocus
          className="flex-1 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        >
          Use Photo
        </button>
      </div>
    </div>
  );
}
