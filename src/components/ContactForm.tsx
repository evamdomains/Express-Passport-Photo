'use client';

import { useState } from 'react';

const DOCUMENT_TYPES = [
  'US Passport',
  'US Visa',
  'Baby Passport',
  'Canadian Passport',
  'Canadian PR Card',
  'Other / Not sure',
];

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    documentType: '',
    message: '',
  });

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your message.');
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', documentType: '', message: '' });
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
        <h3 className="text-lg font-bold text-gray-900">Message sent!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Thanks for reaching out — one of our experts will reply to your email shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          Send another message
        </button>
      </div>
    );
  }

  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';
  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="c-name" className={labelCls}>
            Full name <span className="text-brand-600">*</span>
          </label>
          <input
            id="c-name"
            type="text"
            required
            value={form.name}
            onChange={update('name')}
            className={inputCls}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>
            Email <span className="text-brand-600">*</span>
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className={inputCls}
            placeholder="jane@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="c-phone" className={labelCls}>
            Phone number
          </label>
          <input
            id="c-phone"
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            className={inputCls}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="c-doc" className={labelCls}>
            Document type <span className="text-brand-600">*</span>
          </label>
          <select id="c-doc" required value={form.documentType} onChange={update('documentType')} className={inputCls}>
            <option value="" disabled>
              Select a document type
            </option>
            {DOCUMENT_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="c-message" className={labelCls}>
          Message <span className="text-brand-600">*</span>
        </label>
        <textarea
          id="c-message"
          required
          rows={5}
          value={form.message}
          onChange={update('message')}
          className={`${inputCls} resize-y`}
          placeholder="Tell us how we can help — questions about compliance, a tricky photo, baby passport help, etc."
          maxLength={5000}
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
            Sending…
          </>
        ) : (
          <>
            Send message
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
      <p className="mt-3 text-xs text-gray-400">
        We&apos;ll only use your details to respond to your enquiry.
      </p>
    </form>
  );
}
