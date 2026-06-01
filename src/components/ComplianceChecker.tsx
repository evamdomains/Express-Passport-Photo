'use client';

import type { ComplianceResult } from '@/types/order';

interface Props {
  compliance: ComplianceResult;
}

export default function ComplianceChecker({ compliance }: Props) {
  const { passed, issues, warnings, headHeightPercent, eyesOpen, mouthClosed, facingForward } =
    compliance;

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
