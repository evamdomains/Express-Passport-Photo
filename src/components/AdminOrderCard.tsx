'use client';

import { useState } from 'react';
import type { Order } from '@/types/order';

interface Props {
  order: Order;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminOrderCard({ order }: Props) {
  const [pickupTime, setPickupTime] = useState('');
  const [notifying, setNotifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNotify = async () => {
    if (!pickupTime.trim()) return;
    setNotifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setNotifying(false);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-green-700 font-semibold">✓ Customer notified — order marked as uploaded</p>
        <p className="text-sm text-green-600 mt-1">{order.email} · pickup: {pickupTime}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Order info */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {order.document_type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
          </div>
          <p className="font-semibold text-gray-900">{order.email ?? 'No email'}</p>
          {order.store_name && (
            <div>
              <p className="text-sm text-gray-700 font-medium">{order.store_name}</p>
              <p className="text-sm text-gray-500">{order.store_address}</p>
              {order.store_maps_url && (
                <a
                  href={order.store_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline"
                >
                  View on maps →
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 font-mono">{order.id.slice(0, 8)}…</p>
        </div>

        {/* Actions */}
        <div className="space-y-2 shrink-0 sm:min-w-56">
          {order.pdf_url && (
            <a
              href={order.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ↓ Download PDF
            </a>
          )}
          {order.photo_processed_url && (
            <a
              href={order.photo_processed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ↓ Download JPEG
            </a>
          )}

          {/* Mark as uploaded */}
          <div className="pt-1 border-t border-gray-100 space-y-2">
            <input
              type="text"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              placeholder='e.g. "Ready by 3:00 PM today"'
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              disabled={!pickupTime.trim() || notifying}
              onClick={handleNotify}
              className="w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              {notifying ? 'Sending…' : 'Mark as Uploaded & Notify Customer'}
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
