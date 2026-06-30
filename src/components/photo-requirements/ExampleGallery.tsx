import ExampleCard, { type ExampleItem } from './ExampleCard';

/**
 * Two-column comparison gallery: accepted on the left, rejected on the right.
 * Stacks to a single column on mobile. Pure presentation — accepts the items
 * for each side.
 */
export default function ExampleGallery({
  accepted,
  rejected,
}: {
  accepted: ExampleItem[];
  rejected: ExampleItem[];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-5 md:gap-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h4 className="text-base font-semibold text-green-700">Accepted</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {accepted.map((item, i) => (
            <ExampleCard key={`a-${i}`} item={item} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </span>
          <h4 className="text-base font-semibold text-red-700">Rejected</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {rejected.map((item, i) => (
            <ExampleCard key={`r-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
