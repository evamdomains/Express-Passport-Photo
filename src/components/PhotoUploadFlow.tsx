'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DocumentTypeSelector from './DocumentTypeSelector';
import type { DocumentTypeId } from '@/types/document';
import type { ComplianceResult } from '@/types/order';

type Step = 'select-type' | 'upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024;

const PROCESSING_STEPS = [
  { label: 'Removing background…', pct: 35 },
  { label: 'Analyzing face & compliance…', pct: 70 },
  { label: 'Generating print-ready files…', pct: 95 },
];

function getComplianceBlocker(compliance: ComplianceResult): string | null {
  if (!compliance.faceDetected) return 'No face detected. Use a clear, front-facing photo in good light.';
  if (compliance.faceCount > 1) return 'Multiple faces detected. Only one person should be in the photo.';
  const extreme = compliance.issues.find((i) => i.toLowerCase().includes('looking directly'));
  if (extreme) return extreme;
  return null;
}

function ProcessingOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // Animate to the current step's percentage
    const target = PROCESSING_STEPS[stepIndex].pct;
    const timer = setInterval(() => {
      setPct((p) => {
        if (p >= target) {
          clearInterval(timer);
          return p;
        }
        return p + 1;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [stepIndex]);

  useEffect(() => {
    if (stepIndex >= PROCESSING_STEPS.length - 1) return;
    const delay = stepIndex === 0 ? 12000 : 18000;
    const t = setTimeout(() => setStepIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [stepIndex]);

  return (
    <div className="py-8 text-center space-y-6">
      <div className="text-5xl animate-pulse">⚡</div>
      <div>
        <p className="font-semibold text-gray-800 text-lg">{PROCESSING_STEPS[stepIndex].label}</p>
        <p className="text-sm text-gray-400 mt-1">Your photo will be ready in ~45 seconds</p>
      </div>
      {/* Progress bar */}
      <div className="mx-auto max-w-xs">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          {PROCESSING_STEPS.map((s, i) => (
            <span key={s.label} className={i <= stepIndex ? 'text-brand-600 font-medium' : ''}>
              {s.pct}%
            </span>
          ))}
        </div>
      </div>
      {/* Step checklist */}
      <ul className="text-sm space-y-2 inline-block text-left">
        {PROCESSING_STEPS.map((s, i) => (
          <li key={s.label} className={`flex items-center gap-2 ${i < stepIndex ? 'text-green-600' : i === stepIndex ? 'text-brand-600' : 'text-gray-300'}`}>
            {i < stepIndex ? (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            ) : i === stepIndex ? (
              <span className="w-4 h-4 border-2 border-brand-600 rounded-full shrink-0 inline-block animate-spin border-t-transparent"/>
            ) : (
              <span className="w-4 h-4 border-2 border-gray-200 rounded-full shrink-0 inline-block"/>
            )}
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PhotoUploadFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get('type') as DocumentTypeId | null;

  const [step, setStep] = useState<Step>(preselected ? 'upload' : 'select-type');
  const [docType, setDocType] = useState<DocumentTypeId | null>(preselected);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFileWithValidation = useCallback((f: File) => {
    if (!ALLOWED_TYPES.includes(f.type.toLowerCase())) {
      setError('Please upload a JPEG, PNG, WEBP, or HEIC photo.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('Photo must be under 10 MB.');
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setFileWithValidation(f);
    },
    [setFileWithValidation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) setFileWithValidation(f);
    },
    [setFileWithValidation]
  );

  const handleSubmit = async () => {
    if (!file || !docType) return;
    setUploading(true);
    setError(null);

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentTypeId: docType }),
      });
      if (!orderRes.ok) throw new Error('Could not create order');
      const { orderId } = (await orderRes.json()) as { orderId: string };

      const form = new FormData();
      form.append('photo', file);
      form.append('documentTypeId', docType);
      form.append('orderId', orderId);

      const processRes = await fetch('/api/process-photo', { method: 'POST', body: form });
      const processData = (await processRes.json()) as {
        error?: string;
        compliance?: ComplianceResult;
      };

      if (!processRes.ok) throw new Error(processData.error ?? 'Processing failed');

      if (processData.compliance) {
        const blocker = getComplianceBlocker(processData.compliance);
        if (blocker) throw new Error(blocker);
      }

      router.push(`/editor?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setUploading(false);
    }
  };

  const resetFile = () => { setFile(null); setPreview(null); setError(null); };

  if (uploading) {
    return <ProcessingOverlay />;
  }

  return (
    <div className="space-y-6">
      {step === 'select-type' && (
        <div>
          <h2 className="text-base font-semibold mb-4 text-gray-700">What document do you need a photo for?</h2>
          <DocumentTypeSelector selected={docType} onChange={setDocType} />
          <button
            disabled={!docType}
            onClick={() => setStep('upload')}
            className="mt-5 w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base transition-colors hover:bg-brand-700"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 'upload' && (
        <div>
          {!preselected && (
            <button onClick={() => setStep('select-type')} className="text-sm text-brand-600 hover:underline mb-4 block">
              ← Change document type
            </button>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-brand-400 transition-colors"
          >
            {preview ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="max-h-52 mx-auto rounded-lg object-contain" />
                <p className="text-sm text-gray-500 truncate max-w-xs mx-auto">{file?.name}</p>
                <button onClick={resetFile} className="text-sm text-brand-600 hover:underline">
                  Use a different photo
                </button>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-3">📷</div>
                <p className="font-semibold text-gray-700 mb-1">Drop your photo here</p>
                <p className="text-sm text-gray-400 mb-5">or</p>
                <label className="cursor-pointer bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors font-semibold text-sm">
                  Browse files
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-4">JPEG · PNG · WEBP · HEIC · max 10 MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-3">{error}</p>
              <button onClick={resetFile} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Try a different photo
              </button>
            </div>
          )}

          <button
            disabled={!file || !!error}
            onClick={handleSubmit}
            className="w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base transition-colors hover:bg-brand-700"
          >
            Process My Photo →
          </button>

          <ul className="space-y-1.5 text-sm text-gray-400">
            {['Look directly at the camera with a neutral expression', 'Good lighting — no shadows on your face', 'No glasses, hats, or heavy filters', 'Any background works — we replace it'].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
