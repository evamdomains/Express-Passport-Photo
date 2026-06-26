'use client';

import { useState } from 'react';

const DOCUMENT_TYPES = [
  'US Passport',
  'US Visa',
  'Baby Passport',
  'Canadian Passport',
  'Canadian PR Card',
  'Other',
];

type Status = 'idle' | 'sending' | 'sent' | 'error';

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <svg
            className={`w-8 h-8 transition-colors ${n <= shown ? 'text-amber-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L8.4 2.93z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    documentType: '',
    rating: 0,
    comment: '',
  });

  const update =
    (field: 'name' | 'location' | 'documentType' | 'comment') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.rating) {
      setError('Please select a star rating.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit your review.');
      setStatus('sent');
      setForm({ name: '', location: '', documentType: '', rating: 0, comment: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Thank you for your review!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Your review has been submitted and will appear here once it&apos;s approved by our team.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          Write another review
        </button>
      </div>
    );
  }

  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';
  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm" noValidate>
      <div className="mb-5">
        <span className={labelCls}>Your rating <span className="text-brand-600">*</span></span>
        <StarPicker value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label htmlFor="r-name" className={labelCls}>
            Name <span className="text-brand-600">*</span>
          </label>
          <input id="r-name" type="text" required value={form.name} onChange={update('name')} className={inputCls} placeholder="Jane D." autoComplete="name" maxLength={80} />
        </div>
        <div>
          <label htmlFor="r-loc" className={labelCls}>
            Location
          </label>
          <input id="r-loc" type="text" value={form.location} onChange={update('location')} className={inputCls} placeholder="Austin, TX" maxLength={80} />
        </div>
        <div>
          <label htmlFor="r-doc" className={labelCls}>
            Document type
          </label>
          <select id="r-doc" value={form.documentType} onChange={update('documentType')} className={inputCls}>
            <option value="">Select…</option>
            {DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="r-comment" className={labelCls}>
          Your review <span className="text-brand-600">*</span>
        </label>
        <textarea
          id="r-comment"
          required
          rows={4}
          value={form.comment}
          onChange={update('comment')}
          className={`${inputCls} resize-y`}
          placeholder="Tell other customers about your experience…"
          maxLength={1000}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === 'sending' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : (
          <>
            Submit review
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
      <p className="mt-3 text-xs text-gray-400">
        Reviews are checked before they&apos;re published. Please keep it honest and respectful.
      </p>
    </form>
  );
}
