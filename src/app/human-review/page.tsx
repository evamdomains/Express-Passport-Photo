import type { Metadata } from 'next';
import Link from 'next/link';
import HumanReviewTrust from '@/components/HumanReviewTrustBanner';
import HumanReviewHowItWorks from '@/components/HumanReviewHowItWorks';

export const metadata: Metadata = {
  title: 'Human Expert Review',
  description:
    'See how Human Expert Review works — a real passport photo specialist reviews your image and guides you to a compliant result.',
};

export default function HumanReviewPage() {
  return (
    <>
      {/* The animated HR.png trust banner from the homepage. */}
      <HumanReviewTrust />

      {/* The "How Human Expert Review works" block from the homepage. */}
      <HumanReviewHowItWorks />

      <section className="px-4 py-12 text-center">
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Request Human Review
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </>
  );
}
