'use client';

import { useState } from 'react';
import type { StoreResult } from '@/types/photo';

interface StoreResults {
  cvs: StoreResult[];
  walgreens: StoreResult[];
}

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
    <div className="space-y-8">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter zip code"
          maxLength={5}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Results */}
      {results && allStores.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No CVS or Walgreens found near {zip}.
        </p>
      )}

      {allStores.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {allStores.length} stores near {zip}
          </p>
          {allStores.map((store) => (
            <a
              key={store.placeId}
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between p-5 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 text-sm font-bold px-2 py-0.5 rounded ${
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
                  <p className="text-sm text-gray-500 mt-0.5">{store.address}</p>
                  {store.openNow !== null && (
                    <p
                      className={`text-xs mt-1 font-medium ${
                        store.openNow ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {store.openNow ? 'Open now' : 'Closed'}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-400 whitespace-nowrap ml-4 mt-0.5">
                {store.distance}
              </span>
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        When printing, ask for "4×6 standard print" and bring your digital file on your phone.
      </p>
    </div>
  );
}
