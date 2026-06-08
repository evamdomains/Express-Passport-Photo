'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { StoreResult } from '@/types/photo';

// Lazy-load the animated map: it's purely decorative, so it should never block
// the hero copy or the search input from rendering/becoming interactive.
// ssr:false keeps it out of the server payload; the skeleton holds its space
// (same aspect ratio) to avoid layout shift.
const AnimatedStoreMap = dynamic(() => import('./AnimatedStoreMap'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full max-w-xl mx-auto" aria-hidden="true">
      <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-brand-50 via-white to-sky-50 ring-1 ring-gray-900/5 shadow-2xl" />
    </div>
  ),
});

interface StoreResults {
  cvs: StoreResult[];
  walgreens: StoreResult[];
}

const TRUST = [
  'Ready in 60 seconds',
  'Accepted by Government',
  'ICAO Compliant',
  'Print at Nearby Stores',
];

export default function StoreLocator() {
  const [zip, setZip] = useState('');
  const [results, setResults] = useState<StoreResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit US zip code');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stores?zip=${zip}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed');
      setResults(data as StoreResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const allStores = results
    ? [
        ...results.cvs.map((s) => ({ ...s, chain: 'CVS' as const })),
        ...results.walgreens.map((s) => ({ ...s, chain: 'Walgreens' as const })),
      ].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    : [];

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/50 to-white">
        {/* Decorative blurred blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: copy + search */}
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1.5 text-xs font-semibold ring-1 ring-brand-100 mb-5">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <circle cx="12" cy="11" r="3" strokeWidth="2" />
              </svg>
              Print locally — CVS · Walgreens · FedEx Office
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-4">
              Find a Nearby Store to{' '}
              <span className="text-brand-600">Print Your Passport Photo</span>
            </h1>

            <p className="text-gray-500 text-base sm:text-lg mb-7 max-w-lg leading-relaxed">
              Download your passport photo and print it at CVS, Walgreens, FedEx Office, or
              other nearby locations in minutes.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-lg">
              <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-gray-900/5">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <circle cx="12" cy="11" r="3" strokeWidth="2" />
                    </svg>
                  </span>
                  <label htmlFor="zip" className="sr-only">Enter your ZIP code</label>
                  <input
                    id="zip"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="Enter ZIP code"
                    maxLength={5}
                    className="w-full rounded-xl border-0 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    <>
                      Find Stores
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </form>

            {/* Trust indicators */}
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg className="h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: animated map */}
          <div className="lg:pl-4">
            <AnimatedStoreMap />
          </div>
        </div>
      </section>

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pt-4 pb-4">
        {results && allStores.length === 0 && (
          <p className="py-10 text-center text-gray-500">
            No CVS or Walgreens found near {zip}.
          </p>
        )}

        {allStores.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">
              {allStores.length} stores near {zip}
            </p>
            {allStores.map((store) => (
              <a
                key={store.placeId}
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between rounded-xl border border-gray-200 p-5 transition-all hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 rounded px-2 py-0.5 text-sm font-bold ${
                      store.chain === 'CVS'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {store.chain}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-brand-700">
                      {store.name}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">{store.address}</p>
                    {store.openNow !== null && (
                      <p
                        className={`mt-1 text-xs font-medium ${
                          store.openNow ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {store.openNow ? 'Open now' : 'Closed'}
                      </p>
                    )}
                  </div>
                </div>
                <span className="ml-4 mt-0.5 whitespace-nowrap text-sm text-gray-400">
                  {store.distance}
                </span>
              </a>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          When printing, ask for &quot;4×6 standard print&quot; and bring your digital file on your phone.
        </p>
      </section>
    </>
  );
}
