'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ComplianceChecker from './ComplianceChecker';
import type { Order } from '@/types/order';

export default function PhotoReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID found');
      setLoading(false);
      return;
    }

    fetch(`/api/orders?orderId=${orderId}`)
      .then((r) => r.json())
      .then((data: Order) => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load order');
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Loading your photo…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">{error ?? 'Something went wrong'}</p>
        <a href="/upload" className="text-brand-600 hover:underline">
          Start over
        </a>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Photo preview */}
      <div className="space-y-4">
        {order.photo_processed_url && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Your photo
            </p>
            <div className="bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center p-4">
              <Image
                src={order.photo_processed_url}
                alt="Processed passport photo"
                width={300}
                height={300}
                className="rounded-lg object-contain"
              />
            </div>
          </div>
        )}
        {order.photo_composite_url && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Print layout (4×6)
            </p>
            <div className="bg-gray-100 rounded-xl overflow-hidden p-4">
              <Image
                src={order.photo_composite_url}
                alt="4×6 print layout"
                width={400}
                height={600}
                className="rounded-lg object-contain w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Compliance & actions */}
      <div className="space-y-6">
        {order.compliance_data && (
          <ComplianceChecker compliance={order.compliance_data} />
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/checkout?orderId=${orderId}`)}
            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Continue to Checkout
          </button>
          <a
            href="/upload"
            className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Retake photo
          </a>
        </div>

        <p className="text-xs text-gray-400">
          {order.compliance_data?.passed
            ? 'Your photo meets all requirements. Proceed to checkout.'
            : 'You can still checkout, but consider retaking if there are critical issues.'}
        </p>
      </div>
    </div>
  );
}
