'use client';

import { isFreeCanadianDocument } from '@/config/features';
import type { DocumentTypeId } from '@/types/document';

/**
 * Client hook for the FREE Canadian flow. Decides whether a document uses the free
 * flow and, if so, submits to /api/free-process-photo and downloads the returned
 * JPEG directly — no order, no checkout, no editor navigation. When the
 * FREE_CANADIAN flag is off, `isFreeCanadian` returns false and callers fall back
 * to the untouched premium flow automatically.
 */

export interface FreeCanadianSubmitInput {
  file: File;
  documentTypeId: DocumentTypeId;
  biometric?: unknown;
  quality?: unknown;
  objects?: unknown;
  objectSharpness?: number | null;
  glasses?: unknown;
}

export type FreeCanadianSubmitResult = { ok: true } | { ok: false; errors: string[] };

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useFreeCanadianFlow() {
  const isFreeCanadian = (documentTypeId: DocumentTypeId | null): boolean =>
    !!documentTypeId && isFreeCanadianDocument(documentTypeId);

  /**
   * POST the photo + client-measured signals to the free route. On a compliance
   * PASS the server returns a JPEG, which we download immediately as
   * `passport-photo.jpeg`. On a FAIL we surface the same compliance error strings.
   */
  const generateAndDownload = async (input: FreeCanadianSubmitInput): Promise<FreeCanadianSubmitResult> => {
    const form = new FormData();
    form.append('photo', input.file);
    form.append('documentTypeId', input.documentTypeId);
    if (input.biometric) form.append('biometric', JSON.stringify(input.biometric));
    if (input.quality) form.append('quality', JSON.stringify(input.quality));
    if (input.objects) form.append('objects', JSON.stringify(input.objects));
    if (input.objectSharpness != null) form.append('objectSharpness', String(input.objectSharpness));
    if (input.glasses) form.append('glasses', JSON.stringify(input.glasses));

    const res = await fetch('/api/free-process-photo', { method: 'POST', body: form });
    const contentType = res.headers.get('content-type') ?? '';

    if (res.ok && contentType.includes('image/')) {
      triggerDownload(await res.blob(), 'passport-photo.jpeg');
      return { ok: true };
    }
    const data = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string };
    return { ok: false, errors: data.errors ?? [data.error ?? 'Could not generate your photo.'] };
  };

  return { isFreeCanadian, generateAndDownload };
}
