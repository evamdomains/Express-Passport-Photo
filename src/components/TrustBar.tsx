const ITEMS = [
  'ICAO Compliant',
  'Accepted by Government',
  'Ready in 60 Seconds',
  '100% Money-Back Guarantee',
];

export default function TrustBar() {
  return (
    <div className="bg-brand-800 text-white text-xs font-semibold tracking-wide py-2.5 overflow-x-auto">
      <div className="flex items-center justify-start sm:justify-center gap-5 sm:gap-10 px-4 min-w-max mx-auto">
        {ITEMS.map((item) => (
          <span key={item} className="flex items-center gap-1.5 whitespace-nowrap">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
