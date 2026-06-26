'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import type { DocumentTypeId } from '@/types/document';

type Phase = 'working' | 'approved' | 'rejected' | 'reupload' | 'reupload_done' | 'error';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Reviewer-facing confirmation page (internal). Opened from the Approve /
 * Reject / "Re-uploaded photo accepted" links in the team notification email.
 * It posts the signed token to /api/review/[action], which performs the action
 * server-side, then shows the outcome.
 *
 * For "Re-uploaded photo accepted", the EXPERT uploads the corrected photo the
 * customer emailed them — right here. The upload generates the passport files
 * and flips the customer's order to "approved"; the customer just clicks
 * Continue to delivery & checkout afterwards.
 */
export default function ReviewConfirm() {
  const params = useSearchParams();
  const action = params.get('action');
  const token = params.get('token');

  const [phase, setPhase] = useState<Phase>('working');
  const [message, setMessage] = useState('');
  const [docType, setDocType] = useState<DocumentTypeId | null>(null);
  const ran = useRef(false);

  // Expert upload state (reupload-accept flow).
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validAction =
    action === 'approve' || action === 'reject' || action === 'reupload-accept';

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!action || !token || !validAction) {
      setPhase('error');
      setMessage('This link is missing or malformed.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/review/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          reviewStatus?: string;
          alreadyDecided?: boolean;
          error?: string;
          documentType?: DocumentTypeId;
        };

        if (!res.ok || !data.ok) {
          setPhase('error');
          setMessage(data.error ?? 'Something went wrong processing this action.');
          return;
        }

        if (data.documentType) setDocType(data.documentType);

        const status = data.reviewStatus;
        if (status === 'approved') {
          setPhase('approved');
          if (data.alreadyDecided) setMessage('This order was already approved.');
        } else if (status === 'reupload_approved') {
          // Expert now uploads the approved photo on this page.
          setPhase('reupload');
        } else {
          setPhase('rejected');
          if (data.alreadyDecided) setMessage('This order was already rejected.');
        }
      } catch {
        setPhase('error');
        setMessage('Network error — please try the link again.');
      }
    })();
  }, [action, token, validAction]);

  const setFileWithValidation = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type.toLowerCase())) {
      setUploadError('Please upload a JPEG, PNG, WEBP, or HEIC photo.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setUploadError('Photo must be under 10 MB.');
      return;
    }
    setUploadError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submitUpload = async () => {
    if (!file || !token) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Measure the photo with the SAME MediaPipe pipeline the AI path uses, so
      // generation scales the face via the identical computeCrop() rules.
      let bio;
      if (docType) {
        try {
          const cfg = getBiometricConfig(DOCUMENT_SPECS[docType]);
          const { analyzeImageFile } = await import('@/lib/face/FaceAnalysisService');
          bio = (await analyzeImageFile(file, cfg)).bio;
        } catch { /* measurement best-effort — server falls back to cover resize */ }
      }

      const form = new FormData();
      form.append('photo', file);
      form.append('token', token);
      if (bio) form.append('biometric', JSON.stringify(bio));
      const res = await fetch('/api/review/reupload', { method: 'POST', body: form });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Upload failed');
      setPhase('reupload_done');
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Something went wrong');
      setUploading(false);
    }
  };

  if (phase === 'working') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">
          {action === 'approve' ? 'Approving and generating files…' : 'Recording your decision…'}
        </p>
      </div>
    );
  }

  if (phase === 'approved') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Approved</h1>
        <p className="text-gray-600 mb-4">{message || 'The photo is approved and the print-ready files have been generated.'}</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left text-sm text-green-900">
          The customer can now download their JPEG and PDF directly from their status page, and we&apos;ve
          emailed the files to them as attachments. Nothing else needed from you.
        </div>
      </div>
    );
  }

  // ── EXPERT UPLOAD (reupload-accept) ─────────────────────────────────────────
  if (phase === 'reupload') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-800 mb-2">Upload the approved photo</h1>
        <p className="text-gray-600 mb-6">
          Upload the corrected photo the customer emailed you and approved. We&apos;ll generate their
          passport files and move their order to approved automatically.
        </p>

        <div
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFileWithValidation(f); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-brand-400 transition-colors"
        >
          {preview ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-52 mx-auto rounded-lg object-contain" />
              <p className="text-sm text-gray-500 truncate max-w-xs mx-auto">{file?.name}</p>
              <button onClick={() => { setFile(null); setPreview(null); }} className="text-sm text-brand-600 hover:underline">
                Use a different photo
              </button>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">📷</div>
              <p className="font-semibold text-gray-700 mb-1">Drop the approved photo here</p>
              <p className="text-sm text-gray-400 mb-5">or</p>
              <label className="cursor-pointer bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors font-semibold text-sm">
                Browse files
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileWithValidation(f); }}
                />
              </label>
              <p className="text-xs text-gray-400 mt-4">JPEG · PNG · WEBP · HEIC · max 10 MB</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{uploadError}</p>
          </div>
        )}

        <button
          disabled={!file || uploading}
          onClick={submitUpload}
          className="w-full mt-4 bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base transition-colors hover:bg-brand-700"
        >
          {uploading ? 'Generating the passport photo…' : 'Upload & generate passport photo'}
        </button>
      </div>
    );
  }

  if (phase === 'reupload_done') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Photo generated &amp; approved</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left text-sm text-green-900">
          The print-ready files are generated and the order is now approved. The customer can download
          their JPEG and PDF directly from their status page (we&apos;ve also emailed them) — nothing else
          needed from you.
        </div>
      </div>
    );
  }

  if (phase === 'rejected') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-amber-700 mb-2">Marked as rejected</h1>
        <p className="text-gray-600 mb-4">{message || 'The photo has been marked as needing changes.'}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm text-amber-900">
          Next step: email the customer the reasons and what to fix. When they reply with a
          corrected photo you&apos;re happy with, click <strong>&quot;Re-uploaded photo accepted&quot;</strong> in
          the original review email — you&apos;ll then upload that photo here to finish their order.
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-700 mb-2">Couldn&apos;t complete that</h1>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
