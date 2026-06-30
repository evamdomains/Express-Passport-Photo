/**
 * RequirementCard — a checklist of do / don't rules. `tone` colours the markers:
 * 'do' = green checks, 'dont' = red crosses, 'tip' = neutral blue dots.
 */
export interface RequirementRule {
  text: string;
}

export default function RequirementCard({
  title,
  tone,
  rules,
}: {
  title: string;
  tone: 'do' | 'dont' | 'tip';
  rules: RequirementRule[];
}) {
  const head =
    tone === 'do' ? 'text-green-700' : tone === 'dont' ? 'text-red-700' : 'text-brand-700';

  const marker = (
    <span
      className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
        tone === 'do'
          ? 'bg-green-100 text-green-700'
          : tone === 'dont'
            ? 'bg-red-100 text-red-700'
            : 'bg-brand-100 text-brand-700'
      }`}
      aria-hidden="true"
    >
      {tone === 'do' ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : tone === 'dont' ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
    </span>
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h4 className={`text-sm font-semibold mb-3 ${head}`}>{title}</h4>
      <ul className="space-y-2">
        {rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
            {marker}
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
