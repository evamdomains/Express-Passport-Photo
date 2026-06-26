'use client';

import type { ComplianceResult } from '@/types/order';
import type { AxisStatus, AxisResult } from '@/types/biometric';

interface Props {
  compliance: ComplianceResult;
}

const STATUS_STYLES: Record<AxisStatus, string> = {
  PASS: 'bg-green-100 text-green-700',
  WARNING: 'bg-amber-100 text-amber-700',
  FAIL: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<AxisStatus, string> = { PASS: 'PASS', WARNING: 'WARNING', FAIL: 'FAIL' };

function StatusPill({ status }: { status: AxisStatus }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function AxisRow({ label, axis }: { label: string; axis: AxisResult }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-black/5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{axis.message}</p>
      </div>
      <StatusPill status={axis.status} />
    </div>
  );
}

export default function ComplianceChecker({ compliance }: Props) {
  const { passed, issues, warnings, report } = compliance;

  // ── New multi-axis biometric report (MediaPipe) ──
  if (report) {
    const ok = report.overall !== 'NON_COMPLIANT';
    const isOptimal = report.overall === 'OPTIMAL';
    const tone = isOptimal ? 'green' : ok ? 'blue' : 'amber';
    const banner = { green: 'bg-green-50', blue: 'bg-blue-50', amber: 'bg-amber-50' }[tone];
    const pill = { green: 'bg-green-600 text-white', blue: 'bg-brand-600 text-white', amber: 'bg-amber-500 text-white' }[tone];
    const label = isOptimal ? 'OPTIMAL' : ok ? 'COMPLIANT' : 'NON-COMPLIANT';

    return (
      <div className={`rounded-xl p-5 ${banner}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isOptimal ? '⭐' : ok ? '✅' : '⚠️'}</span>
            <p className="font-semibold text-lg">
              {isOptimal ? 'Optimal passport photo' : ok ? 'Compliant' : 'Needs attention'}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${pill}`}>
            {label}
          </span>
        </div>

        {/* Face-size diagnostic vs target */}
        <p className="text-xs text-gray-500 mb-3">
          {report.country} · Face {Math.round(report.faceRatioValue * 100)}% of frame · target{' '}
          {Math.round(report.targetRatio * 100)}% · optimal {report.optimalRange}
        </p>

        <div className="bg-white/70 rounded-lg px-4 mb-3">
          <AxisRow label="Face Size" axis={report.faceRatio} />
          <AxisRow label="Eye Position" axis={report.eyeAlignment} />
          <AxisRow label="Mouth" axis={report.mouth} />
          <AxisRow label="Head Position" axis={report.headPosition} />
          {compliance.exposure && (
            <AxisRow label="Exposure" axis={{ status: compliance.exposure.status, message: compliance.exposure.reason }} />
          )}
          {compliance.blur && (
            <AxisRow label="Blur Quality" axis={{ status: compliance.blur.status, message: compliance.blur.reason }} />
          )}
        </div>

        {warnings.length > 0 && (
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-2 text-xs text-amber-700">
                <span className="mt-0.5">!</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Legacy fallback (Rekognition-only result) ──
  const { headHeightPercent, eyesOpen, mouthClosed, facingForward } = compliance;
  return (
    <div className={`rounded-xl p-5 ${passed ? 'bg-green-50' : 'bg-amber-50'}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{passed ? '✅' : '⚠️'}</span>
        <p className="font-semibold text-lg">
          {passed ? 'Photo passes compliance checks' : 'Compliance issues detected'}
        </p>
      </div>

      {issues.length > 0 && (
        <ul className="space-y-1 mb-4">
          {issues.map((issue) => (
            <li key={issue} className="flex items-start gap-2 text-sm text-red-700">
              <span className="mt-0.5">✗</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1 mb-4">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-sm text-amber-700">
              <span className="mt-0.5">!</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <CheckItem label="Eyes open" value={eyesOpen} />
        <CheckItem label="Mouth closed" value={mouthClosed} />
        <CheckItem label="Facing forward" value={facingForward} />
        {headHeightPercent !== null && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <span>↕</span>
            <span>Head: {headHeightPercent.toFixed(0)}% of frame</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ label, value }: { label: string; value: boolean | null }) {
  if (value === null) return null;
  return (
    <div className={`flex items-center gap-1.5 ${value ? 'text-green-700' : 'text-red-600'}`}>
      <span>{value ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}
