'use client';

import { DOCUMENT_SPEC_LIST } from '@/constants/document-specs';
import type { DocumentTypeId } from '@/types/document';
import Flag from './Flag';

interface Props {
  /** Kept for API compatibility; selection is not persisted (click navigates). */
  selected?: DocumentTypeId | null;
  onChange: (id: DocumentTypeId) => void;
  /** Restrict the choices to these ids (in spec order). Omit to show all. */
  allowed?: DocumentTypeId[];
}

/** Short size label, matching the homepage cards (e.g. "2×2 in" / "50×70mm"). */
function sizeLabel(country: 'US' | 'Canada', widthMm: number, heightMm: number): string {
  return country === 'US' ? '2×2 in' : `${widthMm}×${heightMm}mm`;
}

export default function DocumentTypeSelector({ onChange, allowed }: Props) {
  const specs = allowed ? DOCUMENT_SPEC_LIST.filter((s) => allowed.includes(s.id)) : DOCUMENT_SPEC_LIST;

  return (
    // Centered, fixed-width cards (192px) — same dimensions whether 1, 2, or all 5 show.
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {specs.map((spec) => (
        <button
          key={spec.id}
          type="button"
          onClick={() => onChange(spec.id)}
          aria-label={`${spec.name} — choose this document`}
          className="group w-full sm:w-44 cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {/* Centered flag */}
          <div className="flex justify-center mb-3">
            <Flag country={spec.country} className="h-9 w-14" />
          </div>

          {/* Document name */}
          <p className="font-semibold text-sm sm:text-base text-gray-900 leading-snug transition-colors group-hover:text-brand-600">
            {spec.name}
          </p>

          {/* Size · background */}
          <p className="mt-1 text-xs text-gray-400">
            {sizeLabel(spec.country, spec.widthMm, spec.heightMm)} · White bg
          </p>

          {/* Hover affordance */}
          <div className="mt-3 text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
            Get started →
          </div>
        </button>
      ))}
    </div>
  );
}
