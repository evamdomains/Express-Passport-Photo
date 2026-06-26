'use client';

import { useEffect, useState } from 'react';
import styles from './CustomerReviews.module.css';
import { SAMPLE_REVIEWS, type Review } from './CustomerReviews';
import type { PublicReview } from '@/types/review';

/**
 * Homepage social-proof reviews. Pulls the SAME reviews as the /reviews page —
 * approved customer reviews from /api/reviews, falling back to the shared sample
 * set until any are approved. Animated with the opposing-marquee scroll from
 * CustomerReviews.module.css, styled for the dark blue (bg-brand-900) section.
 * Pauses on hover; wraps to a static grid under prefers-reduced-motion.
 */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="mb-2 flex gap-0.5 text-sm" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-yellow-400' : 'text-white/25'} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

function Card({ r }: { r: Review }) {
  const sub = [r.location, r.doc].filter(Boolean).join(' · ');
  return (
    <figure className="w-80 shrink-0 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
      <Stars rating={r.rating} />
      <blockquote className="mb-3 text-sm leading-relaxed text-brand-100">&ldquo;{r.text}&rdquo;</blockquote>
      <figcaption className="text-sm font-semibold text-white">{r.name}</figcaption>
      {sub && <p className="text-xs text-brand-300">{sub}</p>}
    </figure>
  );
}

export default function HomeReviewsMarquee() {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PublicReview[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setReviews(
          data.map((d) => ({
            name: d.name,
            location: d.location ?? '',
            doc: d.document_type ?? '',
            rating: d.rating,
            text: d.comment,
          })),
        );
      })
      .catch(() => {
        /* keep samples on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mid = Math.ceil(reviews.length / 2);
  const rowA = reviews.slice(0, mid);
  const rowB = reviews.slice(mid).length ? reviews.slice(mid) : reviews.slice(0, mid);

  return (
    <div className={styles.section}>
      <div className={`${styles.marqueeMask} space-y-5`}>
        <div className={`${styles.row} ${styles.rowLeft}`}>
          {[...rowA, ...rowA].map((r, i) => (
            <Card key={`a-${i}`} r={r} />
          ))}
        </div>
        <div className={`${styles.row} ${styles.rowRight}`}>
          {[...rowB, ...rowB].map((r, i) => (
            <Card key={`b-${i}`} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
