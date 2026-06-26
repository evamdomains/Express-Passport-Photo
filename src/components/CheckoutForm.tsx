'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PRODUCTS, HUMAN_REVIEW_FEE } from '@/constants/products';
import type { ProductSku } from '@/types/order';
import type { StoreResult } from '@/types/photo';

type Step = 'select-sku' | 'select-store' | 'enter-email';

interface SelectedStore extends StoreResult {
  chain: 'CVS' | 'Walgreens';
}

interface StoreResults {
  cvs: StoreResult[];
  walgreens: StoreResult[];
}

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  // ?sku=printed_ready (e.g. the "Order Print & Ready" upsell after a human
  // review delivers the digital files for free) jumps straight to picking a store.
  const skuParam = searchParams.get('sku');

  const [step, setStep] = useState<Step>('select-sku');
  const [selectedSku, setSelectedSku] = useState<ProductSku>('digital_download');
  const [zip, setZip] = useState('');
  const [stores, setStores] = useState<StoreResults | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Human-review orders skip the SKU/store selection entirely — they were
  // created with their own contact email and just need to confirm + pay (now $0)
  // to enter the review queue. We detect this by reading the order on load.
  const [isHumanReview, setIsHumanReview] = useState<boolean | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        if (!res.ok) return;
        const order = (await res.json()) as { review_type?: string; review_status?: string | null; email?: string | null };
        if (order.email) setEmail(order.email);
        // Human review NOT yet approved → the $0 review submission (skip SKU).
        // Once approved, the photo is generated and the customer picks delivery
        // (digital / printed) here exactly like the AI path.
        if (order.review_type === 'human' && order.review_status !== 'approved') {
          setIsHumanReview(true);
          setStep('enter-email'); // straight to confirm + submit
        } else if (order.review_type === 'human' && order.review_status === 'approved' && skuParam !== 'printed_ready') {
          // Human review has NO digital payment — the digital files are already
          // free to download. Never show the digital/printed SKU page here; send
          // them to their downloads page (where they can also choose printed).
          router.replace(`/review-status?orderId=${orderId}`);
          return;
        } else {
          setIsHumanReview(false);
          // Printed-copies add-on: skip the SKU step and go straight to choosing
          // a store (zip → CVS/Walgreens), then the normal printed payment flow.
          if (skuParam === 'printed_ready') {
            setSelectedSku('printed_ready');
            setStep('select-store');
          }
        }
      } catch {
        setIsHumanReview(false);
      }
    })();
  }, [orderId, skuParam]);

  const allStores: SelectedStore[] = stores
    ? [
        ...stores.cvs.map((s) => ({ ...s, chain: 'CVS' as const })),
        ...stores.walgreens.map((s) => ({ ...s, chain: 'Walgreens' as const })),
      ].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    : [];

  const handleSkuContinue = () => {
    if (selectedSku === 'printed_ready') {
      setStep('select-store');
    } else {
      setStep('enter-email');
    }
  };

  const handleFindStores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setStoreError('Enter a valid 5-digit US zip code');
      return;
    }
    setStoresLoading(true);
    setStoreError(null);
    try {
      const res = await fetch(`/api/stores?zip=${zip}&photo=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Store lookup failed');
      setStores(data as StoreResults);
    } catch (e) {
      setStoreError(e instanceof Error ? e.message : 'Store lookup failed');
    } finally {
      setStoresLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!orderId || !email) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = { orderId, sku: selectedSku, email };
      if (selectedSku === 'printed_ready' && selectedStore) {
        body.storeName = selectedStore.name;
        body.storeAddress = selectedStore.address;
        body.storePlaceId = selectedStore.placeId;
        body.storeMapsUrl = selectedStore.mapsUrl;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed');

      // Internal redirects (human-review submit, free digital fulfilment) point
      // back into our own app — navigate client-side so we don't hard-reload the
      // whole app and flash a blank page. Only external Stripe URLs need a full
      // window navigation. We keep `loading` true so the button stays in its
      // "Submitting…" state until the destination renders.
      const dest = new URL(data.url, window.location.origin);
      if (dest.origin === window.location.origin) {
        router.push(dest.pathname + dest.search);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const price = PRODUCTS.find((p) => p.sku === selectedSku)?.price;
  const reviewFeeLabel = HUMAN_REVIEW_FEE === 0 ? 'Free' : `$${HUMAN_REVIEW_FEE.toFixed(2)}`;

  // ── Headers ────────────────────────────────────────────────────────────────
  // The human-review submission is NOT a delivery step — it's where a customer
  // hands their photo to a real specialist. Its header + trust signals reflect
  // that (reviewed by a person, nothing charged yet, privacy), so the page reads
  // as a credible expert-review handoff rather than a shipping choice.
  const reviewHeader = (
    <div className="mb-8 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-900">Submit for Expert Review</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        A real passport photo specialist personally checks your photo against the official requirements.
        {HUMAN_REVIEW_FEE > 0 && (
          <> One-time <span className="font-semibold text-brand-700">{reviewFeeLabel}</span> review fee.</>
        )}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Real human review
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          Photos deleted in 48h
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.4-4 8-9 8a9.9 9.9 0 01-4-.8L3 20l1-3.5A7.5 7.5 0 013 12c0-4.4 4-8 9-8s9 3.6 9 8z" /></svg>
          Live chat support
        </span>
      </div>
    </div>
  );

  const deliveryHeader = (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your delivery</h1>
        <p className="text-gray-500 text-sm">Instant digital download or pickup at CVS / Walgreens near you.</p>
      </div>
      <div className="flex items-center justify-center gap-5 text-xs text-gray-400 mb-8 flex-wrap">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          SSL Secured
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>
          Powered by Stripe
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          Money-back guarantee
        </span>
      </div>
    </div>
  );

  // Until the order's review type is known, render a placeholder rather than the
  // SKU step. Otherwise a human-review order briefly flashes the digital/printed
  // selection before the fetch resolves and we switch to the review-submit step.
  if (orderId && isHumanReview === null) {
    return (
      <div className="space-y-3">
        <div className="mx-auto mb-2 h-7 w-56 rounded bg-gray-100 animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isHumanReview ? reviewHeader : deliveryHeader}

      {/* Step 1: Select SKU */}
      {step === 'select-sku' && (
        <>
          <div className="space-y-3">
            {PRODUCTS.map((product) => (
              <button
                key={product.sku}
                type="button"
                onClick={() => setSelectedSku(product.sku)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  selectedSku === product.sku
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base">{product.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>
                    <p className="text-xs text-gray-400 mt-1">⏱ {product.turnaround}</p>
                  </div>
                  <span className="text-2xl font-bold text-brand-700 ml-4 shrink-0">${product.price}</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {product.features.map((f) => (
                    <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <button
            onClick={handleSkuContinue}
            className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
          >
            Continue
          </button>
        </>
      )}

      {/* Step 2: Store selection (printed_ready only) */}
      {step === 'select-store' && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                // Human-review printed add-on (?sku=printed_ready): there's no SKU
                // step (digital is already delivered free), so Back returns to the
                // status page where they download files / re-choose printed.
                if (skuParam === 'printed_ready') {
                  router.push(`/review-status?orderId=${orderId}`);
                } else {
                  setStep('select-sku');
                }
              }}
              className="text-sm text-brand-600 hover:underline"
            >
              ← Back
            </button>
            <p className="text-sm font-medium text-gray-700">Select a pickup store</p>
          </div>

          <form onSubmit={handleFindStores} className="flex gap-2">
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Enter zip code"
              maxLength={5}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={storesLoading}
              className="bg-brand-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 shrink-0"
            >
              {storesLoading ? '…' : 'Find'}
            </button>
          </form>

          {storeError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{storeError}</p>
          )}

          {allStores.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {allStores.map((store, i) => (
                <button
                  key={`${store.chain}-${store.placeId}-${i}`}
                  type="button"
                  onClick={() => setSelectedStore(store)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedStore?.placeId === store.placeId
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          store.chain === 'CVS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {store.chain}
                        </span>
                        {store.openNow !== null && (
                          <span className={`text-xs font-medium ${store.openNow ? 'text-green-600' : 'text-red-500'}`}>
                            {store.openNow ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{store.address}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{store.distance}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            disabled={!selectedStore}
            onClick={() => setStep('enter-email')}
            className="w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
          >
            {selectedStore ? `Continue — ${selectedStore.chain} on ${selectedStore.address.split(',')[0]}` : 'Select a store to continue'}
          </button>
        </>
      )}

      {/* Step 3: Email + pay */}
      {step === 'enter-email' && (
        <>
          {!isHumanReview && (
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep(selectedSku === 'printed_ready' ? 'select-store' : 'select-sku')}
                className="text-sm text-brand-600 hover:underline"
              >
                ← Back
              </button>
            </div>
          )}

          {isHumanReview && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 sm:flex sm:gap-4">
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-3xl shadow-sm">🧑‍💼</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg sm:hidden">🧑‍💼</span>
                  <p className="font-semibold text-brand-900">Human Expert Review includes</p>
                  <span className={`ml-auto text-sm font-bold ${HUMAN_REVIEW_FEE === 0 ? 'text-green-600' : 'text-brand-700'}`}>{reviewFeeLabel}</span>
                </div>
                <ul className="space-y-1">
                  {['Professional review', 'Compliance guidance', 'Approval or rejection feedback', 'One resubmission review', 'Email support'].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-sm text-gray-600"><span className="text-green-500 shrink-0">✓</span>{f}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  A specialist confirms pass/fail on live chat.
                  {HUMAN_REVIEW_FEE > 0 && ` One-time ${reviewFeeLabel} fee — charged securely via Stripe.`}
                </p>
              </div>
            </div>
          )}


          {selectedStore && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pickup store</p>
              <p className="font-semibold">{selectedStore.name}</p>
              <p className="text-gray-500">{selectedStore.address}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              {isHumanReview
                ? 'Our specialist will reach you here and on live chat.'
                : selectedSku === 'digital_download'
                  ? "We'll send your download link here."
                  : "We'll send your order confirmation and pickup details here."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <button
            disabled={!email || loading || !orderId}
            onClick={handleCheckout}
            className="w-full bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 transition-colors"
          >
            {loading
              ? isHumanReview ? (HUMAN_REVIEW_FEE === 0 ? 'Submitting…' : 'Redirecting to Stripe…') : price === 0 ? 'Processing…' : 'Redirecting to Stripe…'
              : isHumanReview
                ? (HUMAN_REVIEW_FEE === 0 ? 'Submit for Expert Review — Free' : `Pay ${reviewFeeLabel} & Submit for Review`)
                : price === 0 ? 'Get my photo — Free' : `Pay $${price}`}
          </button>
          <p className="text-center text-xs text-gray-400">
            {isHumanReview
              ? HUMAN_REVIEW_FEE === 0
                ? 'No charge during testing · photos deleted within 48h'
                : 'Secure payment via Stripe · photos deleted within 48h'
              : 'Secure payment via Stripe · 30-day satisfaction guarantee'}
          </p>
        </>
      )}
    </div>
  );
}
