'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ReviewStatus as ReviewStatusValue } from '@/types/order';
import type { DocumentTypeId } from '@/types/document';
import { DOCUMENT_SPECS } from '@/constants/document-specs';

interface OrderShape {
  id: string;
  review_type: 'ai' | 'human';
  review_status: ReviewStatusValue | null;
  status: string;
  product_sku: 'digital_download' | 'printed_ready';
  email: string | null;
  download_url: string | null;
  photo_processed_url: string | null;
  document_type: DocumentTypeId;
  created_at: string;
}

const FILE_RETENTION_MS = 48 * 60 * 60 * 1000;

/**
 * Customer-facing status page for the human-review path. Everything is driven
 * by the order's review_status, read fresh from the DB on every load and polled
 * while pending — so the page survives refresh, tab close, and device switch
 * (the customer returns via the link in their email).
 *
 * States:
 *   awaiting_review   → "being reviewed", waits + polls
 *   approved          → "approved" + Continue to delivery & checkout
 *   rejected          → "rejected, reasons sent by email", waits (no button)
 *   reupload_approved → the expert is uploading the corrected photo they
 *                       approved by email; the customer just waits + polls until
 *                       it flips to approved. No customer upload here.
 */
const TIMELINE = [
  { key: 'submitted', label: 'Review request submitted' },
  { key: 'awaiting', label: 'Awaiting expert review' },
  { key: 'decision', label: 'Review decision' },
  { key: 'continue', label: 'Continue processing' },
] as const;

/** Vertical progress timeline (stacks naturally on all screen sizes). */
function ReviewTimeline({ status }: { status: ReviewStatusValue | null }) {
  const activeIndex =
    status === 'approved' || status === 'reupload_approved' ? 3 : status === 'rejected' ? 2 : 1;
  return (
    <ol className="mx-auto mt-8 max-w-xs text-left">
      {TIMELINE.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={s.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
            {i < TIMELINE.length - 1 && <span aria-hidden className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />}
            <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
              {done ? '✓' : active ? '⏳' : ''}
            </span>
            <span className={`text-sm ${done ? 'text-gray-700' : active ? 'font-semibold text-brand-900' : 'text-gray-400'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Small "reviewed by a specialist" chip used on the decision screens. */
function ReviewerChip() {
  return (
    <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
      <span className="text-base">🧑‍💼</span> Reviewed by an Express Passport Photo specialist
    </div>
  );
}

/** The two download buttons (print-ready PDF + JPEG), shared across views. */
function DownloadButtons({ orderId, hasJpeg }: { orderId: string; hasJpeg: boolean }) {
  return (
    <div className="space-y-3 max-w-sm mx-auto mb-3">
      <a
        href={`/download/pdf/${orderId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
      >
        ↓ Download Print-Ready PDF (4×6)
      </a>
      {hasJpeg && (
        <a
          href={`/download/jpeg/${orderId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-brand-50 text-brand-700 py-3.5 rounded-xl font-medium hover:bg-brand-100 transition-colors"
        >
          ↓ Download JPEG
        </a>
      )}
    </div>
  );
}

/**
 * Shown for any DELIVERED order (instant-AI or human-approved, every document
 * type). While the files are still within the 48-hour retention window the
 * customer can re-download them; once our cleanup job deletes them (48h after
 * the order) the page clearly explains that the photos are no longer available
 * and reminds them their emailed attachments are theirs to keep.
 *
 * Printed orders show the prints-uploading message AND (within 48h) the digital
 * downloads — the human-review fee already covers the digital files.
 */
function DeliveredView({
  order,
  orderId,
  reviewed,
  offerPrinted = false,
}: {
  order: OrderShape;
  orderId: string;
  reviewed: boolean;
  /** Show a "order printed copies" upsell (human-review digital deliveries). */
  offerPrinted?: boolean;
}) {
  const isDigital = order.product_sku === 'digital_download';
  // Files are wiped 48h after the order (cleanup job nulls the URL columns).
  const past48h = Date.now() - new Date(order.created_at).getTime() > FILE_RETENTION_MS;
  const downloadsAvailable = !!order.download_url && !past48h;
  const docName = DOCUMENT_SPECS[order.document_type]?.name ?? order.document_type;
  const toEmail = order.email ? ` to ${order.email}` : '';

  const expiryNote = (
    <p className="text-xs text-gray-400">
      Heads up: these downloads expire 48 hours after your order — your emailed copies are permanent.
    </p>
  );

  const deletedNotice = (
    <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
      <p className="font-semibold mb-1">Your photos are no longer available here</p>
      <p className="leading-relaxed">
        As we noted at checkout and in your email, all photos are automatically deleted from our
        servers <strong>48 hours after your order</strong> to protect your privacy. The JPEG and
        print-ready PDF were attached to your confirmation email{toEmail}, so they&apos;re yours to keep —
        please check your inbox (and spam folder).
      </p>
    </div>
  );

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {reviewed && <ReviewerChip />}

      {isDigital ? (
        downloadsAvailable ? (
          <>
            <h1 className="text-2xl font-bold text-brand-900 mb-2">Your passport photos are ready</h1>
            <p className="text-gray-600 mb-6">
              This order is complete — we emailed your passport photos{toEmail} with the files attached.
              You can also download them again below.
            </p>
            <div className="mb-6">
              <DownloadButtons orderId={orderId} hasJpeg={!!order.photo_processed_url} />
              {expiryNote}
            </div>

            {offerPrinted && (
              <div className="mx-auto mt-6 max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
                <p className="text-sm font-semibold text-gray-900">Want printed copies delivered?</p>
                <p className="mt-1 text-sm text-gray-600">
                  Order professional prints for pickup at a CVS or Walgreens near you — just enter your
                  zip code and choose a store.
                </p>
                <Link
                  href={`/checkout?orderId=${orderId}&sku=printed_ready`}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  Order Print &amp; Ready →
                </Link>
              </div>
            )}
          </>
        ) : past48h ? (
          <>
            <h1 className="text-2xl font-bold text-brand-900 mb-2">Your order is complete</h1>
            <p className="text-gray-600 mb-6">
              Your passport photos were emailed{toEmail} with the files attached.
            </p>
            {deletedNotice}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-900 mb-2">Your photos are being prepared</h1>
            <p className="text-gray-600 mb-2">
              Your passport photos are being finalized{toEmail ? ` and emailed${toEmail}` : ''}. Your
              download buttons will appear here shortly.
            </p>
            <p className="text-gray-500 text-sm mb-2">This page updates on its own.</p>
          </>
        )
      ) : (
        <>
          <h1 className="text-2xl font-bold text-brand-900 mb-2">Your order is complete</h1>
          <p className="text-gray-600 mb-6">
            We&apos;ve received your order for a {docName} photo. We&apos;re uploading your prints to the
            store now — you&apos;ll get another email with your pickup details once they&apos;re ready
            (usually within 3 hours).
          </p>

          {downloadsAvailable ? (
            <>
              <p className="text-sm text-gray-500 mb-3">Your digital copies are included — download them below:</p>
              <DownloadButtons orderId={orderId} hasJpeg={!!order.photo_processed_url} />
              {expiryNote}
            </>
          ) : past48h ? (
            <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
              For your privacy, the digital copies of your photo were automatically deleted from our
              servers <strong>48 hours after your order</strong>, exactly as noted at checkout. Your
              physical prints are unaffected.
            </div>
          ) : null}
        </>
      )}

      <p className="text-xs text-gray-400 mt-6">Order ID: {orderId}</p>
    </div>
  );
}

export default function ReviewStatus() {
  const params = useSearchParams();
  const orderId = params.get('orderId');

  const [order, setOrder] = useState<OrderShape | null>(null);
  const [notFound, setNotFound] = useState(false);
  const polling = useRef(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders?orderId=${orderId}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = (await res.json()) as OrderShape;
      setOrder(data);
    } catch {
      /* transient — keep polling */
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll until the order reaches a terminal state, or not found.
  // - Human review: terminal once approved AND delivered (fulfilled/paid). While
  //   approved-but-still-finalizing, or rejected / reupload_approved, keep polling.
  // - Instant AI: terminal once delivered (fulfilled/paid) or failed.
  useEffect(() => {
    const reviewStatus = order?.review_status;
    const ordStatus = order?.status;
    const delivered = ordStatus === 'fulfilled' || ordStatus === 'paid';
    const humanTerminal = order?.review_type === 'human' && reviewStatus === 'approved' && delivered;
    const aiTerminal = order?.review_type === 'ai' && (delivered || ordStatus === 'failed');
    const stop = humanTerminal || aiTerminal || notFound;
    polling.current = !stop;
    if (stop) return;
    const id = setInterval(fetchOrder, 8000);
    return () => clearInterval(id);
  }, [order?.review_status, order?.review_type, order?.status, notFound, fetchOrder]);

  if (!orderId || notFound) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Order not found</h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find this review. Check the link in your email, or start a new photo.
        </p>
        <Link href="/upload" className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg">
          Start a new photo
        </Link>
      </div>
    );
  }

  // Still loading the order — avoid flashing the human "being reviewed" screen
  // before we know the order type/status.
  if (!order) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <span className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full inline-block animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Loading your order…</h1>
        <p className="text-gray-500 text-sm">One moment while we fetch the latest status.</p>
      </div>
    );
  }

  // ── INSTANT-AI ORDERS ──────────────────────────────────────────────────────
  // AI orders never enter human review (review_status stays null), so they must
  // NOT show the "being reviewed" screen. Show their real delivery status.
  if (order.review_type === 'ai') {
    const delivered = order.status === 'fulfilled' || order.status === 'paid';

    if (delivered) {
      return <DeliveredView order={order} orderId={orderId} reviewed={false} />;
    }

    if (order.status === 'failed') {
      return (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-900 mb-2">This order didn&apos;t complete</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t finish processing this order. Please start a new photo — you won&apos;t be charged twice.
          </p>
          <Link href="/upload" className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg">
            Start a new photo
          </Link>
          <p className="text-xs text-gray-400 mt-6">Order ID: {orderId}</p>
        </div>
      );
    }

    // pending / processing — files still being prepared
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <span className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full inline-block animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Your photos are being prepared</h1>
        <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
          This usually takes under a minute. This page updates on its own when they&apos;re ready.
        </p>
        <p className="text-xs text-gray-400 mt-6">Order ID: {orderId}</p>
      </div>
    );
  }

  const status = order.review_status;

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (status === 'approved') {
    // Human review has NO digital payment — the review fee already covers the
    // digital files. Always show the downloads view (with an optional printed
    // add-on); never a digital checkout. DeliveredView handles the rare
    // not-yet-finalized case and the 48h deletion notice itself.
    return <DeliveredView order={order} orderId={orderId} reviewed offerPrinted />;
  }

  // ── REUPLOAD APPROVED — expert is uploading the corrected photo ─────────────
  if (status === 'reupload_approved') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <ReviewerChip />
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Your corrected photo was approved</h1>
        <p className="text-gray-600 mb-2">
          Our specialist approved the corrected photo you sent and is preparing your passport files now.
        </p>
        <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
          This page updates on its own — in a moment you&apos;ll be able to continue to delivery &amp;
          checkout. No action needed right now.
        </p>
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500">
          <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full inline-block animate-spin" />
          Preparing your passport photo…
        </div>
        <p className="text-xs text-gray-400 mt-6">Order ID: {orderId}</p>
      </div>
    );
  }

  // ── REJECTED ────────────────────────────────────────────────────────────────
  if (status === 'rejected') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
        <ReviewerChip />
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Photo requires corrections</h1>
        <p className="text-gray-600 mb-6">
          Our passport photo specialist reviewed your image and identified issues that must be
          corrected before processing. The specific reasons and what to fix have been sent to your
          email.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-900 max-w-md mx-auto">
          <p className="font-semibold mb-1">What happens next</p>
          Reply to that email with a corrected photo. Once our expert approves it, this page will
          let you upload it and finish — so keep this page bookmarked.
        </div>
        <p className="text-xs text-gray-400 mt-6">
          This page updates automatically. Order ID: {orderId}
        </p>
      </div>
    );
  }

  // ── IN REVIEW (default / awaiting) ─────────────────────────────────────────
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-brand-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-brand-900 mb-2">Your photo is being reviewed</h1>
      <p className="text-gray-600 mb-2">Our specialists are currently reviewing your photo.</p>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
        This page updates on its own the moment they decide — whether it&apos;s approved or needs a
        small change.
      </p>
      {/* Order ID — customers should save this to re-check status anytime. */}
      <div className="mx-auto max-w-sm rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Your Order ID — save this</p>
        <p className="mt-1 font-mono text-sm text-gray-900 break-all">{orderId}</p>
        <p className="mt-2 text-xs text-gray-600">
          Keep it safe. You can check your status anytime by entering it in &ldquo;Check your review
          status&rdquo; on our homepage — we also emailed you this link.
        </p>
      </div>
      <ReviewTimeline status={status ?? null} />
    </div>
  );
}
