'use client';

import { useState } from 'react';
import type { Review } from '@/types/review';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L8.4 2.93z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewModeration({ initialPending }: { initialPending: Review[] }) {
  const [pending, setPending] = useState<Review[]>(initialPending);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Action failed');
      }
      setPending((list) => list.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <p className="text-3xl mb-3">🌟</p>
        <p className="font-medium text-gray-700">No reviews awaiting moderation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {pending.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{r.name}</span>
                <Stars rating={r.rating} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {[r.location, r.document_type].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => moderate(r.id, 'approved')}
                disabled={busyId === r.id}
                className="rounded-lg bg-green-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => moderate(r.id, 'rejected')}
                disabled={busyId === r.id}
                className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}
