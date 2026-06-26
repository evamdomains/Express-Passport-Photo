'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DocumentTypeSelector from './DocumentTypeSelector';
import CompliancePanel from './CompliancePanel';
import type { DocumentTypeId } from '@/types/document';
import type { BiometricData, ImageQualityMetrics } from '@/types/biometric';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { getBiometricConfig } from '@/lib/face/biometric-config';
import { buildGateChecks, gateStepLabels, type GateCheck } from '@/lib/face/compliance-gate';
import { evaluateObjects, type ObjectsAndObstruction, type Box } from '@/lib/face/object-compliance';

/** Approximate face bounding box (normalized) from the biometric, for object-overlap checks. */
function faceBoxFromBio(bio: BiometricData): Box {
  const W = bio.imageWidth || 1;
  const H = bio.imageHeight || 1;
  const chinYNorm = bio.chinY / H;
  const top = Math.max(0, chinYNorm - bio.faceHeightNorm);
  const widthNorm = Math.min(1, bio.faceWidth / W);
  const left = Math.max(0, bio.faceCenterXNorm - widthNorm / 2);
  return { x: left, y: top, width: widthNorm, height: Math.min(1 - top, bio.faceHeightNorm) };
}

/**
 * Object detection (YOLOv8 Nano via onnxruntime-web + MediaPipe Hands) — runs
 * for ALL document types before PhotoRoom. Best-effort: any failure returns
 * undefined so the gate still runs (geometric + quality checks still apply).
 */
async function detectObjects(
  file: File,
  bio: BiometricData,
  infant: boolean,
): Promise<{ objects: ObjectsAndObstruction; objectSharpness: number | null } | undefined> {
  try {
    const { detectObjectsFromFile } = await import('@/lib/face/ObjectDetectorYolo');
    const { detections, objectSharpness } = await detectObjectsFromFile(file);
    return { objects: evaluateObjects(detections, faceBoxFromBio(bio), { infant }), objectSharpness };
  } catch {
    return undefined;
  }
}

/**
 * Run MediaPipe measurement in the browser. Returns the biometric AND the
 * pixel-based image-quality metrics. `error` is true only when MediaPipe itself
 * couldn't run (model/decode failure) — a detected-no-face is returned as a
 * normal biometric with faceDetected:false.
 */
async function measureFace(
  file: File,
  docType: DocumentTypeId,
): Promise<{ bio?: BiometricData; quality?: ImageQualityMetrics; error?: boolean }> {
  try {
    const cfg = getBiometricConfig(DOCUMENT_SPECS[docType]);
    const { analyzeImageFile } = await import('@/lib/face/FaceAnalysisService');
    const { bio, quality } = await analyzeImageFile(file, cfg);
    return { bio, quality };
  } catch {
    return { error: true };
  }
}

type Step = 'select-type' | 'path-choice' | 'contact' | 'upload';
type ReviewType = 'ai' | 'human';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024;

const PROCESSING_STEPS = [
  { label: 'Removing background…', pct: 35 },
  { label: 'Analyzing face & compliance…', pct: 70 },
  { label: 'Generating print-ready files…', pct: 95 },
];

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

function PhotoUploadFlowInner({ allowedTypes }: { allowedTypes?: DocumentTypeId[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Document cards link to ?document=<id>; existing internal links use ?type=<id>.
  const preselected = (searchParams.get('document') ?? searchParams.get('type')) as DocumentTypeId | null;

  // When a page scopes the selector to a single document type, preselect it.
  const initialDocType = preselected ?? (allowedTypes?.length === 1 ? allowedTypes[0] : null);

  const [step, setStep] = useState<Step>(preselected ? 'path-choice' : 'select-type');
  const [docType, setDocType] = useState<DocumentTypeId | null>(initialDocType);
  const [reviewType, setReviewType] = useState<ReviewType>('ai');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // idle = upload UI · gate = compliance panel · generating = server fallback overlay
  // generating = AI server pipeline (PhotoRoom etc.) · submitting = human-review
  // upload (no PhotoRoom — just stores the photo, then goes to the $0 checkout).
  const [phase, setPhase] = useState<'idle' | 'gate' | 'generating' | 'submitting'>('idle');
  const [gateChecks, setGateChecks] = useState<GateCheck[] | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bioRef = useRef<BiometricData | null>(null);
  const qualityRef = useRef<ImageQualityMetrics | null>(null);
  const objectsRef = useRef<ObjectsAndObstruction | null>(null);
  const objectSharpnessRef = useRef<number | null>(null);

  // Keep the step in sync with the URL. Clicking a document card navigates to
  // ?document=<id> (same route, no remount), which flips this flow to the
  // upload step; clearing the param returns to the selection grid.
  useEffect(() => {
    if (preselected) {
      setDocType(preselected);
      setStep((s) => (s === 'select-type' ? 'path-choice' : s));
    } else if (!allowedTypes || allowedTypes.length !== 1) {
      setStep('select-type');
      setDocType(null);
    }
  }, [preselected, allowedTypes]);

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

  /**
   * Generate the passport photo. Called ONLY after the compliance gate passes
   * (or as a fallback when MediaPipe couldn't run) — this is the only path that
   * reaches /api/process-photo, so PhotoRoom never sees a non-compliant image.
   */
  const runServer = async () => {
    if (!file || !docType) return;
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
      if (bioRef.current) form.append('biometric', JSON.stringify(bioRef.current));
      // Send the pixel-quality + object-detection results so the server can
      // re-enforce the strict gate (it has no canvas / ObjectDetector of its own).
      if (qualityRef.current) form.append('quality', JSON.stringify(qualityRef.current));
      if (objectsRef.current) form.append('objects', JSON.stringify(objectsRef.current));
      if (objectSharpnessRef.current != null) form.append('objectSharpness', String(objectSharpnessRef.current));

      const processRes = await fetch('/api/process-photo', { method: 'POST', body: form });
      const data = (await processRes.json()) as { error?: string };
      if (!processRes.ok) throw new Error(data.error ?? 'Processing failed');

      router.push(`/editor?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('idle');
      setServerRunning(false);
      setGateChecks(null);
    }
  };

  /**
   * Human-review path. NO MediaPipe gate, NO PhotoRoom here — a specialist is
   * the compliance authority. We create a human order (with contact details),
   * store the original via /api/review/submit, then send the customer to the
   * $0 checkout. After checkout the Stripe webhook enters the review queue and
   * emails the team + the customer.
   */
  const runHumanSubmit = async () => {
    if (!file || !docType) return;
    // Expert review needs a valid email (so the specialist can reach the customer).
    // If we somehow got here without one, send them back to the contact step
    // instead of failing the order creation with a generic error.
    if (!emailValid) {
      setError('Please add your email so our specialist can reach you.');
      setStep('contact');
      return;
    }
    setError(null);
    setPhase('submitting'); // no PhotoRoom for human review — just uploading
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTypeId: docType,
          reviewType: 'human',
          customerName: contactName.trim() || undefined,
          email: contactEmail.trim(),
          customerPhone: contactPhone.trim() || undefined,
        }),
      });
      if (!orderRes.ok) {
        const data = (await orderRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not create order');
      }
      const { orderId } = (await orderRes.json()) as { orderId: string };

      // Measure the face with the SAME MediaPipe pipeline the AI path uses, so the
      // expert-approved photo is later scaled by the identical computeCrop() rules.
      const { bio } = await measureFace(file, docType);

      const form = new FormData();
      form.append('photo', file);
      form.append('orderId', orderId);
      if (bio) form.append('biometric', JSON.stringify(bio));
      const submitRes = await fetch('/api/review/submit', { method: 'POST', body: form });
      const submitData = (await submitRes.json()) as { error?: string };
      if (!submitRes.ok) throw new Error(submitData.error ?? 'Upload failed');

      // Proceed to the (currently $0) checkout. Same checkout route as the AI
      // path; payment completion triggers the review queue via the webhook.
      router.push(`/checkout?orderId=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('idle');
    }
  };

  // Step 1: run the compliance gate (MediaPipe) BEFORE any PhotoRoom call.
  const handleProcess = async () => {
    if (!file || !docType) return;
    setError(null);
    setServerRunning(false);
    setGateChecks(null);
    setPhase('gate'); // shows "Analyzing…" until the checks are ready

    const { bio, quality, error: mpError } = await measureFace(file, docType);
    bioRef.current = bio ?? null;
    qualityRef.current = quality ?? null;

    if (mpError || !bio) {
      // MediaPipe couldn't run → fall back to the server pipeline (which keeps
      // its own no-face / multiple-face safety net). App stays usable.
      setPhase('generating');
      await runServer();
      return;
    }

    // Object detection (YOLOv8 Nano + Hands) runs for ALL document types — after
    // face, before the geometric checks. Best-effort: skipped only if it can't load.
    const infant = !!getBiometricConfig(DOCUMENT_SPECS[docType]).infant;
    const detection = bio.faceDetected ? await detectObjects(file, bio, infant) : undefined;
    objectsRef.current = detection?.objects ?? null;
    objectSharpnessRef.current = detection?.objectSharpness ?? null;

    setGateChecks(
      buildGateChecks(bio, DOCUMENT_SPECS[docType], {
        quality,
        objects: detection?.objects,
        objectSharpness: detection?.objectSharpness ?? null,
      }).checks,
    );
  };

  // Step 2: the panel finished revealing every check.
  const handleGateResolved = (passed: boolean) => {
    if (passed) {
      setServerRunning(true);
      runServer(); // PhotoRoom + passport generation
    }
    // on failure the panel shows the reason + "Upload a new image" (handleRetry)
  };

  const handleRetry = () => {
    setPhase('idle');
    setGateChecks(null);
    setServerRunning(false);
    setError(null);
    setFile(null);
    setPreview(null);
    bioRef.current = null;
    qualityRef.current = null;
    objectsRef.current = null;
    objectSharpnessRef.current = null;
  };

  const resetFile = () => { setFile(null); setPreview(null); setError(null); };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

  // Compliance gate: analyzing spinner until checks are ready, then the panel.
  if (phase === 'gate') {
    if (!gateChecks) {
      return (
        <div className="py-10 text-center">
          <div className="text-4xl mb-3 animate-pulse">🔍</div>
          <p className="font-semibold text-gray-800 text-lg">Analyzing your photo…</p>
          <p className="text-sm text-gray-400 mt-1">Detecting your face and checking compliance</p>
        </div>
      );
    }
    return (
      <CompliancePanel
        checks={gateChecks}
        stepLabels={docType ? gateStepLabels(DOCUMENT_SPECS[docType]) : undefined}
        generating={serverRunning}
        onResolved={handleGateResolved}
        onRetry={handleRetry}
      />
    );
  }

  // Fallback (MediaPipe unavailable): the original server-processing overlay.
  if (phase === 'generating') {
    return <ProcessingOverlay />;
  }

  // Human review: just uploading the photo before the $0 checkout — NO
  // background removal / compliance generation runs on this path.
  if (phase === 'submitting') {
    return (
      <div className="py-16 text-center">
        <span className="w-10 h-10 mx-auto mb-4 border-4 border-brand-600 border-t-transparent rounded-full inline-block animate-spin" />
        <p className="font-semibold text-gray-800 text-lg">Submitting your photo for expert review…</p>
        <p className="text-sm text-gray-400 mt-1">Uploading securely — almost done.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'select-type' && (
        // Clicking a card navigates to ?document=<id>, which advances to the
        // path-choice step (instant AI vs expert human review).
        <DocumentTypeSelector
          selected={null}
          onChange={(id) => router.push(`/upload?document=${id}`)}
          allowed={allowedTypes}
        />
      )}

      {step === 'path-choice' && (
        <div>
          {(!allowedTypes || allowedTypes.length > 1) && (
            <button onClick={() => router.push('/upload#start')} className="text-sm text-brand-600 hover:underline mb-4 block">
              ← Change document type
            </button>
          )}

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-900">How do you want your photo checked?</h2>
            <p className="text-sm text-gray-500 mt-1">Choose the path that suits you.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl">⚡</div>
                <div>
                  <div className="font-semibold text-brand-900">Instant AI Check</div>
                  <div className="text-xs text-gray-400">Ready in ~45 seconds</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-600 mb-5">
                {['Automatic background removal', 'AI compliance & sizing checks', 'Edit & download immediately'].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setReviewType('ai'); setStep('upload'); }}
                className="mt-auto w-full bg-brand-50 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-100 transition-colors"
              >
                Choose Instant →
              </button>
            </div>

            <div className="bg-white rounded-2xl border-2 border-brand-600 p-5 flex flex-col relative">
              <span className="absolute -top-3 left-5 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most thorough</span>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl">🧑‍💼</div>
                <div>
                  <div className="font-semibold text-brand-900">Expert Human Review</div>
                  <div className="text-xs text-gray-400">A specialist checks it</div>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-600 mb-5">
                {['Reviewed by our team member', 'Live chat — pass/fail explained', 'Same print-ready files on approval'].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 mb-1">Recommended for</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Baby passport photos', 'Difficult lighting', 'Compliance concerns', 'Previous rejections'].map((t) => (
                    <span key={t} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-800 ring-1 ring-brand-100">{t}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setReviewType('human'); setStep('contact'); }}
                className="mt-auto w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
              >
                Choose Expert →
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">Money-back guarantee · photos deleted within 48h</p>
        </div>
      )}

      {step === 'contact' && (
        <div>
          <button onClick={() => setStep('path-choice')} className="text-sm text-brand-600 hover:underline mb-4 block">
            ← Back
          </button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-900">Your contact details</h2>
            <p className="text-sm text-gray-500 mt-1">So our specialist can reach you on live chat.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-start gap-2 bg-brand-50 rounded-xl p-3">
              <svg className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3m0 4h.01M5 11V7a7 7 0 0 1 14 0v4"/></svg>
              <span className="text-xs text-brand-800">Shared only with our review team via secure live chat. Deleted within 48h.</span>
            </div>
          </div>
          <button
            disabled={!emailValid}
            onClick={() => setStep('upload')}
            className="w-full mt-4 bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base transition-colors hover:bg-brand-700"
          >
            Continue →
          </button>
        </div>
      )}

      {step === 'upload' && (
        <div>
          <button
            onClick={() => setStep(reviewType === 'human' ? 'contact' : 'path-choice')}
            className="text-sm text-brand-600 hover:underline mb-4 block"
          >
            ← Back
          </button>

          {reviewType === 'human' && (
            <div className="mb-4 flex items-center gap-2 bg-brand-50 rounded-xl p-3">
              <span className="text-lg">🧑‍💼</span>
              <span className="text-xs text-brand-800">Expert human review — a specialist checks this after checkout, then confirms on live chat.</span>
            </div>
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
            onClick={reviewType === 'human' ? runHumanSubmit : handleProcess}
            className="w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base transition-colors hover:bg-brand-700"
          >
            {reviewType === 'human' ? 'Submit for Expert Review →' : 'Process My Photo →'}
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

export default function PhotoUploadFlow({ allowedTypes }: { allowedTypes?: DocumentTypeId[] } = {}) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-2xl" />}>
      <PhotoUploadFlowInner allowedTypes={allowedTypes} />
    </Suspense>
  );
}
