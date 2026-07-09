'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/types/order';

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); setNotFound(true); return; }

    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data = (await res.json()) as Order;
        setOrder(data);
        if (data.status === 'fulfilled' || data.status === 'paid' || attempts >= 8) {
          setLoading(false);
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch {
        setLoading(false);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-spin">⏳</div>
        <p className="text-gray-500 font-medium mb-1">Confirming your order…</p>
        <p className="text-sm text-gray-400">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link href="/" className="text-brand-600 hover:underline">Return home</Link>
      </div>
    );
  }

  const isDigital = order.product_sku === 'digital_download';

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-3">
          {isDigital ? 'Your photos are ready!' : 'Order confirmed!'}
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          {isDigital
            ? 'Download your files below. We also sent them to your email.'
            : 'We\'re uploading your prints now. You\'ll get an email with pickup details in about 3 hours.'}
        </p>
      </div>

      {/* Digital download buttons */}
      {isDigital && (
        <div className="space-y-3 mb-8">
          {order.download_url ? (
            <>
              {/* Secure app routes — mint fresh signed URLs on click (storage is private). */}
              <a
                href={`/download/composite/${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
              >
                ↓ Download Print-Ready JPEG (4×6 print)
              </a>
              {order.photo_processed_url && (
                <a
                  href={`/download/jpeg/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-brand-50 text-brand-700 py-3.5 rounded-xl font-medium hover:bg-brand-100 transition-colors"
                >
                  ↓ Download JPEG
                </a>
              )}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
              <p className="text-amber-700 font-medium text-sm">
                Your files are being prepared — check your email in a minute.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-brand-600 hover:underline mt-2 block mx-auto"
              >
                Refresh to check
              </button>
            </div>
          )}
        </div>
      )}

      {/* Printed order — store details */}
      {!isDigital && order.store_name && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-8">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2">Your pickup store</p>
          <p className="font-semibold text-gray-900">{order.store_name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{order.store_address}</p>
          {order.store_maps_url && (
            <a
              href={order.store_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:underline mt-2 inline-block"
            >
              Get directions →
            </a>
          )}
          {order.pickup_time && (
            <div className="mt-3 pt-3 border-t border-brand-200">
              <p className="text-sm font-semibold text-green-700">Ready by: {order.pickup_time}</p>
              <p className="text-xs text-gray-500 mt-1">
                Say: "I have a photo order under {order.email}"
              </p>
            </div>
          )}
          {!order.pickup_time && (
            <p className="text-xs text-gray-500 mt-2">
              We'll email you with your exact pickup time once prints are ready.
            </p>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-2 mb-8">
        <div className="flex justify-between">
          <span className="text-gray-500">Order ID</span>
          <code className="text-gray-700 text-xs">{order.id.slice(0, 8)}…</code>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Document</span>
          <span className="text-gray-700 capitalize">{order.document_type.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Product</span>
          <span className="text-gray-700">{order.product_sku === 'digital_download' ? 'Digital Download' : 'Printed & Ready'}</span>
        </div>
        {order.email && (
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-700">{order.email}</span>
          </div>
        )}
      </div>

    </div>
  );
}
