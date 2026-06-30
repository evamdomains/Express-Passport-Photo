import Image from 'next/image';
import ExampleIllustration, { type ExampleVariant } from './ExampleIllustration';

export interface ExampleItem {
  /** Illustration to draw when no real photo is supplied. */
  variant: ExampleVariant;
  status: 'accepted' | 'rejected';
  label: string;
  reason: string;
  /** Optional real photo. When set, it renders instead of the illustration. */
  imageSrc?: string;
  alt?: string;
}

/**
 * A single example card: a framed passport-style image (illustration or real
 * photo), a status badge (green check / red cross), and a short reason. Green
 * border for accepted, red for rejected. Subtle lift on hover.
 */
export default function ExampleCard({ item }: { item: ExampleItem }) {
  const accepted = item.status === 'accepted';
  const ring = accepted ? 'border-green-200 hover:border-green-300' : 'border-red-200 hover:border-red-300';
  const badgeBg = accepted ? 'bg-green-500' : 'bg-red-500';
  const alt =
    item.alt ??
    `${accepted ? 'Accepted' : 'Rejected'} passport photo example: ${item.label}. ${item.reason}`;

  return (
    <figure
      className={`group rounded-2xl border-2 ${ring} bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="relative aspect-square bg-gray-50">
        {item.imageSrc ? (
          <Image
            src={item.imageSrc}
            alt={alt}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0" aria-label={alt} role="img">
            <ExampleIllustration variant={item.variant} />
          </div>
        )}

        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${badgeBg} text-white shadow`}
          aria-hidden="true"
        >
          {accepted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          )}
        </span>
      </div>

      <figcaption className="p-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${accepted ? 'text-green-700' : 'text-red-700'}`}>
            {accepted ? '✓' : '✗'} {item.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.reason}</p>
      </figcaption>
    </figure>
  );
}
