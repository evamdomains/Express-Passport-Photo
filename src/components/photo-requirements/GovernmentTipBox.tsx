/**
 * GovernmentTipBox — the "official recommendation" callout used at the foot of
 * each section. Blue, authoritative, government-compliant feel.
 */
export default function GovernmentTipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 flex gap-3.5">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-brand-800 mb-0.5">Official recommendation</p>
        <div className="text-sm leading-relaxed text-brand-900/80">{children}</div>
      </div>
    </div>
  );
}
