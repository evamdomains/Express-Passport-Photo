'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Homepage Order ID lookup. A customer who submitted an Expert Review can paste
 * the Order ID from their confirmation email and jump straight to their review
 * status page — handy while they wait for our specialist to reach out.
 */
export default function OrderStatusLookup() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) {
      setError('Please enter your Order ID.');
      return;
    }
    router.push(`/review-status?orderId=${encodeURIComponent(id)}`);
  };

  return (
    <section className="px-4 py-14 sm:py-16">
      <div className="max-w-2xl mx-auto rounded-3xl border border-gray-100 bg-gray-50 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">
          🔎
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Check your review status</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Submitted a photo for Expert Review? Enter the Order ID from your confirmation email to see
          where it stands. Our specialist will also reach out to you directly.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value); setError(null); }}
            placeholder="Paste your Order ID"
            aria-label="Order ID"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Check status
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </section>
  );
}
