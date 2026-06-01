'use client';

import { DOCUMENT_SPEC_LIST } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';

interface Props {
  selected: DocumentTypeId | null;
  onChange: (id: DocumentTypeId) => void;
}

export default function DocumentTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {DOCUMENT_SPEC_LIST.map((spec) => (
        <button
          key={spec.id}
          type="button"
          onClick={() => onChange(spec.id)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected === spec.id
              ? 'border-brand-600 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className="text-2xl">{spec.country === 'US' ? '🇺🇸' : '🇨🇦'}</span>
          <p className="font-semibold mt-2">{spec.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {spec.widthMm}×{spec.heightMm}mm · {spec.widthPx}×{spec.heightPx}px
          </p>
        </button>
      ))}
    </div>
  );
}
