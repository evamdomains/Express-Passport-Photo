import type { Metadata } from 'next';
import { Suspense } from 'react';
import ReviewConfirm from '@/components/ReviewConfirm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Action',
  robots: { index: false, follow: false },
};

export default function ReviewConfirmPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Suspense fallback={null}>
        <ReviewConfirm />
      </Suspense>
    </div>
  );
}
