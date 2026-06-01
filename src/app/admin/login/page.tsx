'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/admin';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch(`/api/admin/auth?from=${encodeURIComponent(from)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      redirect: 'follow',
    });

    if (res.ok || res.redirected) {
      window.location.href = from;
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Admin</h1>
        <p className="text-sm text-gray-500 mb-8">Express Passport Photo</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {error && (
            <p className="text-sm text-red-600">Incorrect password.</p>
          )}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
