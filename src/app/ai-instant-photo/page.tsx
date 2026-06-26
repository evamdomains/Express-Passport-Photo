import type { Metadata } from 'next';
import Link from 'next/link';
import HowItWorks from '@/components/HowItWorks';

export const metadata: Metadata = {
  title: 'AI Instant Photo',
  description:
    'Get a government-compliant passport photo in three steps, under 5 minutes. AI removes the background and checks compliance automatically.',
};

export default function AiInstantPhotoPage() {
  return (
    <>
      {/* The "Three steps, under 5 minutes" block from the homepage. */}
      <HowItWorks />

      <section className="px-4 py-12 text-center">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Start Instant AI
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </>
  );
}
