'use client';

import { DOCUMENT_SPEC_LIST } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import Flag from './Flag';

interface Props {
  selected: DocumentTypeId | null;
  onChange: (id: DocumentTypeId) => void;
  /** Restrict the choices to these ids (in spec order). Omit to show all. */
  allowed?: DocumentTypeId[];
}

// Short helper line shown under the spec (purely presentational).
const DESCRIPTIONS: Record<DocumentTypeId, string> = {
  us_passport: 'Most common',
  us_visa: 'For visa applications',
  baby_passport: 'For infants & children',
  canadian_passport: 'All Canadian passports',
  canadian_pr_card: 'Permanent resident card',
};

// Small document glyph shown at the bottom-left of each card.
function DocIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="2" />
      <circle cx="12" cy="9" r="2.2" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M8.5 16.5c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4" />
    </svg>
  );
}

export default function DocumentTypeSelector({ selected, onChange, allowed }: Props) {
  const specs = allowed
    ? DOCUMENT_SPEC_LIST.filter((s) => allowed.includes(s.id))
    : DOCUMENT_SPEC_LIST;

  return (
    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
      {specs.map((spec) => {
        const isActive = selected === spec.id;
        const countryCode = spec.country === 'US' ? 'US' : 'CA';
        return (
          <button
            key={spec.id}
            type="button"
            onClick={() => onChange(spec.id)}
            aria-pressed={isActive}
            className={`group relative text-left rounded-2xl border bg-white p-5 transition-all duration-200 ${
              isActive
                ? 'border-brand-600 ring-1 ring-brand-600 shadow-sm'
                : 'border-gray-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            {/* Selected check badge */}
            <span
              className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow transition-all duration-200 ${
                isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>

            {/* Country code */}
            <p className="text-xl font-extrabold tracking-tight text-gray-900">{countryCode}</p>

            {/* Flag + document name */}
            <p className="mt-2.5 flex items-center gap-2 font-bold text-gray-900">
              <Flag country={spec.country} className="h-3.5 w-5 shrink-0 align-[-2px]" />
              {spec.name}
            </p>

            {/* Spec */}
            <p className="mt-1 text-xs text-gray-400">
              {spec.widthMm}×{spec.heightMm}mm · {spec.widthPx}×{spec.heightPx}px
            </p>

            {/* Description */}
            <p className="mt-2 text-sm text-gray-500">{DESCRIPTIONS[spec.id]}</p>

            {/* Document glyph */}
            <span className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <DocIcon />
            </span>
          </button>
        );
      })}
    </div>
  );
}
