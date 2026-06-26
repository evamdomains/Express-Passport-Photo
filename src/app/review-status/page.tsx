import type { Metadata } from 'next';
import { Suspense } from 'react';
import ReviewStatus from '@/components/ReviewStatus';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Photo Review Status' };

function StatusLoading() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <span className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full inline-block animate-spin" />
      </div>
      <h1 className="text-2xl font-bold text-brand-900 mb-2">Loading your review status…</h1>
      <p className="text-gray-500 text-sm">One moment while we fetch the latest update.</p>
    </div>
  );
}

export default function ReviewStatusPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Suspense fallback={<StatusLoading />}>
        <ReviewStatus />
      </Suspense>
    </div>
  );
}
