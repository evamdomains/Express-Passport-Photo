'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS } from '@/constants/products';
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
  const orderId = searchParams.get('orderId');

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
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const price = PRODUCTS.find((p) => p.sku === selectedSku)?.price;

  return (
    <div className="space-y-6">

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
            <button onClick={() => setStep('select-sku')} className="text-sm text-brand-600 hover:underline">
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
              {allStores.map((store) => (
                <button
                  key={store.placeId}
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
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setStep(selectedSku === 'printed_ready' ? 'select-store' : 'select-sku')}
              className="text-sm text-brand-600 hover:underline"
            >
              ← Back
            </button>
          </div>

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
              {selectedSku === 'digital_download'
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
            {loading ? 'Redirecting to Stripe…' : `Pay $${price}`}
          </button>
          <p className="text-center text-xs text-gray-400">
            Secure payment via Stripe · 30-day satisfaction guarantee
          </p>
        </>
      )}
    </div>
  );
}
