'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CameraPreview from './CameraPreview';
import { detectGlasses } from '@/lib/face/GlassesDetector';

/**
 * Full-screen live camera capture. Its ONLY job is to produce a standard `File`
 * (Camera → Canvas → Blob → File) identical to a file-picker selection, then
 * hand it to `onCapture`. No image processing happens here — the downstream
 * pipeline (MediaPipe, compliance, PhotoRoom, etc.) is unchanged and unaware
 * the photo came from the camera.
 */
type FacingMode = 'user' | 'environment';

const friendlyError = (err: unknown): string => {
  const name = err instanceof Error ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was denied. Please allow camera access in your browser settings, or upload a photo instead.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera detected. Please upload a photo instead.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your camera is in use by another app. Close it and try again, or upload a photo instead.';
    default:
      return 'Could not start the camera. Please upload a photo instead.';
  }
};

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [captured, setCaptured] = useState<{ url: string; file: File } | null>(null);
  const [glassesWarn, setGlassesWarn] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: FacingMode) => {
      setStarting(true);
      setError(null);
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('unsupported'), { name: 'NotFoundError' });
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        // Detect a second camera so we can offer "Switch camera".
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
        } catch {
          /* enumerateDevices is best-effort */
        }
      } catch (err) {
        console.error('[camera] getUserMedia failed', err);
        setError(friendlyError(err));
      } finally {
        setStarting(false);
      }
    },
    [stopStream],
  );

  // Start on mount; stop on unmount.
  useEffect(() => {
    startCamera('user');
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Throttled live eyeglasses check — keeps Capture disabled while glasses are on.
  // Reuses the same detector the upload gate uses (no duplicate logic).
  useEffect(() => {
    if (captured || error) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const video = videoRef.current;
      if (!cancelled && video && video.videoWidth) {
        try {
          const bmp = await createImageBitmap(video);
          const res = await detectGlasses(bmp);
          bmp.close?.();
          if (!cancelled) setGlassesWarn(res.detected);
        } catch {
          /* ignore transient frame errors */
        }
      }
      if (!cancelled) timer = setTimeout(tick, 800);
    };
    timer = setTimeout(tick, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [captured, error]);

  const handleSwitch = () => {
    const next: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('Could not capture the photo. Please try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not capture the photo. Please try again.');
      return;
    }
    // Draw the TRUE (un-mirrored) frame — the preview is only mirrored via CSS.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture the photo. Please try again.');
          return;
        }
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopStream(); // free the camera while previewing
        setCaptured({ url: URL.createObjectURL(blob), file });
      },
      'image/jpeg',
      0.95,
    );
  };

  const handleRetake = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    startCamera(facingMode);
  };

  const handleUse = () => {
    if (!captured) return;
    const { file, url } = captured;
    URL.revokeObjectURL(url);
    onCapture(file); // → identical to a file-picker selection
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a live selfie"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <div className="absolute right-4 top-4">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error ? (
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">📷</div>
          <p className="text-sm font-medium text-gray-800">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            Upload a photo instead
          </button>
        </div>
      ) : captured ? (
        <CameraPreview src={captured.url} onRetake={handleRetake} onUse={handleUse} />
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '3 / 4' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
            />
            {/* Face-guide oval */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[70%] w-[58%] rounded-[50%] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting camera…</div>
            )}
          </div>

          {glassesWarn ? (
            <p role="alert" className="rounded-lg bg-amber-500/90 px-4 py-2 text-center text-sm font-semibold text-white">
              ⚠ Remove your glasses before capturing your passport photo.
            </p>
          ) : (
            <p className="text-center text-sm text-white/80">Center your face in the oval, look straight at the camera.</p>
          )}

          <div className="flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/25"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={starting || glassesWarn}
              aria-label="Capture photo"
              title={glassesWarn ? 'Remove your glasses to enable capture' : undefined}
              className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              Capture
            </button>
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleSwitch}
                aria-label="Switch camera"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14-3m2 8a8 8 0 0 1-14 3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
