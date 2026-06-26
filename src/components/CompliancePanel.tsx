'use client';

import { useEffect, useRef, useState } from 'react';
import { GATE_STEP_LABELS, type GateCheck } from '@/lib/face/compliance-gate';

interface Props {
  /** Evaluated prefix of checks (stops at the first failure). */
  checks: GateCheck[];
  /** True once the gate passed and the server is generating the photo. */
  generating: boolean;
  /** Fires once after all rows have been revealed. */
  onResolved: (passed: boolean) => void;
  /** User chose to upload a new image after a failure. */
  onRetry: () => void;
  /** Ordered step labels for this document (defaults to the standard 6). */
  stepLabels?: { key: string; label: string }[];
}

const REVEAL_MS = 520;

function Spinner() {
  return <span className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full inline-block animate-spin shrink-0" />;
}
function Tick() {
  return (
    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
    </span>
  );
}
function Cross() {
  return (
    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
    </span>
  );
}
function WarnMark() {
  return (
    <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0 text-white text-xs font-bold">!</span>
  );
}
function Pending() {
  return <span className="w-5 h-5 rounded-full border-2 border-gray-200 inline-block shrink-0" />;
}

export default function CompliancePanel({ checks, generating, onResolved, onRetry, stepLabels = GATE_STEP_LABELS }: Props) {
  const [revealed, setRevealed] = useState(0);
  const resolvedRef = useRef(false);

  // Reveal one row at a time for the passport-photo.online "live check" feel.
  useEffect(() => {
    if (revealed >= checks.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), REVEAL_MS);
    return () => clearTimeout(t);
  }, [revealed, checks.length]);

  const done = revealed >= checks.length;
  const failed = checks.some((c) => c.status === 'FAIL');
  const passed = !failed;
  const failure = checks.find((c) => c.status === 'FAIL');
  const warnings = checks.filter((c) => c.status === 'WARNING').map((c) => c.message);

  // On FAILURE we resolve immediately (the parent does nothing on a fail — the
  // failure reason + retry render below). On PASS we intentionally do NOT
  // auto-proceed: the customer clicks "Generate Passport Photo" to start
  // PhotoRoom + generation. That click calls handleGenerate().
  useEffect(() => {
    if (done && failed && !resolvedRef.current) {
      resolvedRef.current = true;
      onResolved(false);
    }
  }, [done, failed, onResolved]);

  const handleGenerate = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onResolved(true);
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="text-center mb-6">
        {!done ? (
          <>
            <div className="text-4xl mb-3 animate-pulse">🔍</div>
            <p className="font-semibold text-gray-800 text-lg">Analyzing your photo…</p>
            <p className="text-sm text-gray-400 mt-1">Checking passport compliance before processing</p>
          </>
        ) : passed ? (
          <>
            <div className="text-4xl mb-3">{generating ? '⚡' : '✅'}</div>
            <p className="font-semibold text-gray-800 text-lg">Photo approved</p>
            <p className="text-sm text-gray-400 mt-1">
              {generating ? 'Generating your passport photo…' : 'All checks passed — generate your passport photo below'}
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <p className="font-semibold text-gray-800 text-lg">Photo not accepted</p>
            <p className="text-sm text-gray-400 mt-1">Please fix the issue below and upload a new photo</p>
          </>
        )}
      </div>

      {/* Checklist (all six steps; unreached rows stay pending) */}
      <ul className="max-w-sm mx-auto space-y-3">
        {stepLabels.map(({ key, label }, i) => {
          const check = checks[i];
          const isRevealed = i < revealed && !!check;
          const isAnalyzing = i === revealed && i < checks.length;
          const textTone = isRevealed
            ? check.status === 'FAIL'
              ? 'text-red-700 font-medium'
              : check.status === 'WARNING'
                ? 'text-amber-700'
                : 'text-gray-800'
            : 'text-gray-400';
          return (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className={`text-sm ${textTone}`}>{label}</span>
              {isRevealed ? (
                check.status === 'PASS' ? <Tick /> : check.status === 'WARNING' ? <WarnMark /> : <Cross />
              ) : isAnalyzing ? (
                <Spinner />
              ) : (
                <Pending />
              )}
            </li>
          );
        })}
      </ul>

      {/* Failure reason + retry */}
      {done && failed && failure && (
        <div className="mt-6 max-w-sm mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {failure.message}
          </div>
          <button
            onClick={onRetry}
            className="mt-4 w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
          >
            Upload a new image
          </button>
        </div>
      )}

      {/* Non-blocking warnings (e.g. uncertain baby-object detection) */}
      {done && passed && warnings.length > 0 && (
        <div className="mt-6 max-w-sm mx-auto p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1">
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {/* Passed: explicit "Generate" button — the customer triggers PhotoRoom. */}
      {done && passed && !generating && (
        <div className="mt-6 max-w-sm mx-auto">
          <button
            onClick={handleGenerate}
            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
          >
            Generate Passport Photo →
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            We&apos;ll remove the background and size your photo to spec.
          </p>
        </div>
      )}

      {/* Generating spinner (after the customer clicks Generate) */}
      {done && passed && generating && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
