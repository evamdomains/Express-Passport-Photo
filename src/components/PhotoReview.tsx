'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ComplianceChecker from './ComplianceChecker';
import PassportPreview from './PassportPreview';
import type { Order } from '@/types/order';
import { DOCUMENT_SPECS } from '@/constants/document-specs';
import { getBiometricConfig, targetEyeLineFromTop } from '@/lib/face/biometric-config';

const EYE_FROM_CROWN = 0.46; // fraction of head height above the eyes (fallback)

/**
 * Country-aware overlay metadata. Labels use the achieved face ratio (single
 * source of truth = compliance engine). When the engine didn't persist exact
 * crown/chin positions, derive a sensible fallback from the document config.
 */
function previewMeta(documentType: Order['document_type'], ratioOverride?: number) {
  const spec = DOCUMENT_SPECS[documentType];
  const cfg = getBiometricConfig(spec);
  const target = cfg.targetRatio;
  const ratio = ratioOverride ?? target;
  const isUS = spec.country === 'US';
  const inch = (mm: number) => mm / 25.4;

  const eyeTarget = targetEyeLineFromTop(cfg);
  const fallbackTop = Math.max(0, eyeTarget - EYE_FROM_CROWN * target);

  return {
    aspectRatio: spec.widthPx / spec.heightPx,
    widthLabel: isUS ? `${inch(spec.widthMm).toFixed(0)} in` : `${spec.widthMm} mm`,
    heightLabel: isUS ? `${inch(spec.heightMm).toFixed(0)} in` : `${spec.heightMm} mm`,
    headLabel: isUS ? `${(ratio * inch(spec.heightMm)).toFixed(2)} in` : `${Math.round(ratio * spec.heightMm)} mm`,
    fallbackTop,
    fallbackBottom: Math.min(1, fallbackTop + target),
  };
}

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
      {/* Protected preview (watermark + measurement guides; clean image delivered after payment) */}
      <div className="space-y-4">
        {order.photo_processed_url && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Your photo
            </p>
            <div className="bg-gray-100 rounded-xl overflow-hidden py-4">
              {(() => {
                const m = order.compliance_data?.report?.measurements;
                const meta = previewMeta(order.document_type, m?.faceRatio);
                return (
                  <PassportPreview
                    imageUrl={`/api/preview/${order.id}`}
                    aspectRatio={meta.aspectRatio}
                    widthLabel={meta.widthLabel}
                    heightLabel={meta.heightLabel}
                    headLabel={meta.headLabel}
                    headTopFraction={m?.headTopFraction ?? meta.fallbackTop}
                    headBottomFraction={m?.headBottomFraction ?? meta.fallbackBottom}
                  />
                );
              })()}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Measurement guides are shown here only — your downloaded photo is clean and print-ready.
            </p>
          </div>
        )}
        {/* Print layout (4×6) is generated in the backend and delivered after
            payment — intentionally hidden from this pre-payment preview. */}
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
            href={`/upload?document=${order.document_type}`}
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
