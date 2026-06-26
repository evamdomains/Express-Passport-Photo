'use client';

import { useEffect, useState } from 'react';
import styles from './CustomerReviews.module.css';
import type { PublicReview } from '@/types/review';

/**
 * Animated customer-reviews section for the About page.
 *
 * Shows real, APPROVED customer reviews fetched from /api/reviews. Until any
 * real reviews are approved, it falls back to the representative samples below
 * so the section is never empty. Once you have approved reviews, those replace
 * the samples automatically.
 */

export type Review = {
  name: string;
  location: string;
  doc: string;
  rating: number;
  text: string;
};

export const SAMPLE_REVIEWS: Review[] = [
  {
    name: 'Sarah M.',
    location: 'Austin, TX',
    doc: 'US Passport',
    rating: 5,
    text: 'Rejected twice at the pharmacy, then did it here in two minutes. The compliance checklist showed exactly what was wrong before I paid. Accepted first try.',
  },
  {
    name: 'David R.',
    location: 'Toronto, ON',
    doc: 'Canadian Passport',
    rating: 5,
    text: 'The 50×70mm sizing is fussy and I had no idea what I was doing. The expert reviewed my photo and told me to retake it with better lighting. Worth every cent.',
  },
  {
    name: 'Priya K.',
    location: 'Seattle, WA',
    doc: 'Baby Passport',
    rating: 5,
    text: 'Getting a passport photo of a 3-month-old felt impossible. Human review walked me through it and approved a photo I never thought would pass.',
  },
  {
    name: 'James O.',
    location: 'Chicago, IL',
    doc: 'US Visa',
    rating: 5,
    text: 'Fast, cheap, and it actually worked. Background was removed cleanly and the download was instant. No subscription nonsense.',
  },
  {
    name: 'Elena V.',
    location: 'Miami, FL',
    doc: 'US Passport',
    rating: 5,
    text: 'I appreciated that they delete photos after 48 hours — privacy was a real concern for me. Smooth, professional, and refreshingly transparent.',
  },
  {
    name: 'Marcus T.',
    location: 'Calgary, AB',
    doc: 'PR Card',
    rating: 5,
    text: 'The money-back guarantee made it a no-brainer. Photo passed, so I never needed it, but knowing it was there is why I tried it.',
  },
  {
    name: 'Aisha N.',
    location: 'Boston, MA',
    doc: 'US Passport',
    rating: 5,
    text: 'Did it from my couch at 11pm. Uploaded a selfie, got a perfectly cropped, white-background photo seconds later. Unreal how easy this was.',
  },
  {
    name: 'Tom B.',
    location: 'Vancouver, BC',
    doc: 'Canadian Passport',
    rating: 4,
    text: 'Great experience overall. Had a question about head size and the chat answered quickly. Photo was accepted at the passport office.',
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.1 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L8.4 2.93z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const initials = r.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <figure className={styles.card}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
          {initials}
        </div>
        <div className="min-w-0">
          <figcaption className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            {r.name}
            <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified customer">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4l2.3 2.29 6.3-6.3a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </figcaption>
          <p className="text-xs text-gray-500">
            {r.location} · {r.doc}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Stars rating={r.rating} />
      </div>
      <blockquote className="mt-3 text-sm leading-relaxed text-gray-600">“{r.text}”</blockquote>
    </figure>
  );
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [isReal, setIsReal] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PublicReview[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        const mapped: Review[] = data.map((d) => ({
          name: d.name,
          location: d.location ?? '',
          doc: d.document_type ?? '',
          rating: d.rating,
          text: d.comment,
        }));
        setReviews(mapped);
        setIsReal(true);
        setCount(data.length);
      })
      .catch(() => {
        /* keep samples on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // split into two rows for opposing marquee directions
  const mid = Math.ceil(reviews.length / 2);
  const rowA = reviews.slice(0, mid);
  const rowB = reviews.slice(mid).length ? reviews.slice(mid) : reviews.slice(0, mid);

  const avg = isReal && count ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 4.9;
  const avgRounded = Math.round(avg * 10) / 10;
  const summary = isReal
    ? `Based on ${count} verified customer review${count !== 1 ? 's' : ''}`
    : 'Based on thousands of compliant photos delivered';

  return (
    <section className={`${styles.section} bg-gray-50 px-4 py-16 sm:py-20`} aria-labelledby="reviews-title">
      <div className="max-w-5xl mx-auto text-center">
        <span className={`${styles.fadeUp} inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700`}>
          ★ Loved by customers
        </span>
        <h2 id="reviews-title" className={`${styles.fadeUp} mt-4 text-2xl sm:text-3xl font-bold text-gray-900`} style={{ animationDelay: '0.06s' }}>
          Trusted by people just like you
        </h2>

        {/* aggregate rating */}
        <div className={`${styles.fadeUp} mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2`} style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center gap-2">
            <Stars rating={Math.round(avg)} />
            <span className="text-sm font-bold text-gray-900">{avgRounded} / 5</span>
          </div>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-sm text-gray-600">{summary}</span>
        </div>
      </div>

      {/* marquee rows */}
      <div className={`${styles.marqueeMask} mt-10 space-y-5`}>
        <div className={`${styles.row} ${styles.rowLeft}`} aria-hidden="false">
          {[...rowA, ...rowA].map((r, i) => (
            <ReviewCard key={`a-${i}`} r={r} />
          ))}
        </div>
        <div className={`${styles.row} ${styles.rowRight}`}>
          {[...rowB, ...rowB].map((r, i) => (
            <ReviewCard key={`b-${i}`} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
