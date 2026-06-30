'use client';

import { useRef, useState } from 'react';
import CameraCapture from './CameraCapture';

/**
 * Reusable photo acquisition UI used everywhere a photo is uploaded. Offers two
 * paths — Take Live Selfie and Upload Existing Photo (plus drag & drop) — and
 * both produce a standard `File` handed to `onSelect`. Downstream code is
 * unchanged and cannot tell which path the File came from.
 *
 * It does NOT validate, preview, or process the file — the parent's existing
 * handler (e.g. setFileWithValidation) keeps doing exactly that.
 */
const DEFAULT_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif';

export default function PhotoPicker({
  onSelect,
  accept = DEFAULT_ACCEPT,
}: {
  onSelect: (file: File) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onSelect(f);
  };

  const cardCls =
    'group flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 transition-colors ${
        dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
      }`}
    >
      <p className="mb-4 text-center text-sm font-medium text-gray-500">Choose one of the following options</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setCameraOpen(true)} className={cardCls} aria-label="Take a live selfie with your camera">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">📷</span>
          <span className="text-sm font-bold text-gray-900">Take Live Selfie</span>
          <span className="text-xs text-gray-500 leading-snug">Use your phone or webcam to capture a passport-quality photo instantly.</span>
        </button>

        <button type="button" onClick={() => inputRef.current?.click()} className={cardCls} aria-label="Upload an existing photo">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">🖼️</span>
          <span className="text-sm font-bold text-gray-900">Upload Existing Photo</span>
          <span className="text-xs text-gray-500 leading-snug">Select a photo from your gallery or computer.</span>
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        or drag &amp; drop here · Supported: JPEG, PNG, HEIC · max 10 MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label="Upload a photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => { setCameraOpen(false); onSelect(file); }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
