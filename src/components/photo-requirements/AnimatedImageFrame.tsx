'use client';

import { useEffect, useRef } from 'react';
import styles from '../HumanReviewTrustBanner.module.css';

/**
 * Reusable animated image frame — the same visual treatment as the Human-Review
 * trust banner (animated gradient glow border, gentle float, entrance reveal,
 * and cursor-follow 3D tilt + shine). Renders any image; purely presentational.
 * Honors prefers-reduced-motion (tilt disabled; CSS animations stop via the
 * shared module's media query).
 */
export default function AnimatedImageFrame({ src, alt }: { src: string; alt: string }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: MouseEvent) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      frame.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
      frame.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
      frame.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const onLeave = () => {
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    };
    frame.addEventListener('mousemove', onMove);
    frame.addEventListener('mouseleave', onLeave);
    return () => {
      frame.removeEventListener('mousemove', onMove);
      frame.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className={styles.floatWrap}>
      <div ref={frameRef} className={styles.frame}>
        <div className={styles.shine} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className={styles.img} />
      </div>
    </div>
  );
}
