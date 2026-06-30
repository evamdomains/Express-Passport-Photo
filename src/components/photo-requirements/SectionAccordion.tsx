'use client';

import { useId, useRef, useState } from 'react';

/**
 * SectionAccordion — a smoothly expandable section. Animates open/close via a
 * grid-rows trick (0fr → 1fr) so it works for any content height without JS
 * measurement. Fully keyboard accessible: the header is a button that toggles
 * aria-expanded and controls the panel.
 */
export default function SectionAccordion({
  index,
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const btnId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <h3 className="m-0">
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 px-5 sm:px-7 py-5 text-left transition-colors hover:bg-brand-50/40"
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 shrink-0">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-brand-500">
                SECTION {index}
              </span>
            </span>
            <span className="block text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              {title}
            </span>
            <span className="block text-sm text-gray-500 mt-0.5">{subtitle}</span>
          </span>
          <svg
            className={`w-6 h-6 text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div ref={panelRef} className="px-5 sm:px-7 pb-7 pt-1 space-y-7">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
