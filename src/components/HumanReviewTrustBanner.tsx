'use client';

import { useEffect, useRef } from 'react';
import howStyles from './HowItWorks.module.css';
import styles from './HumanReviewTrustBanner.module.css';

/**
 * Full-width Human-Review HR.png banner with the "Three steps" effect system:
 * animated morphing gradient backdrop + floating particles (reused from
 * HowItWorks.module.css), plus an animated gradient glow frame, gentle float,
 * entrance reveal, and cursor-follow 3D tilt + shine on the image itself.
 * Purely presentational.
 */
const PARTICLE_COLORS = ['#c7d2fe', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#fce7f3', '#fed7aa'];

export default function HumanReviewTrustBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const frame = frameRef.current;
    if (!sectionEl || !frame) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // cursor-follow 3D tilt + shine
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

    // floating background particles
    const particles: HTMLElement[] = [];
    if (!reduce) {
      for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = howStyles['bg-particle'];
        const size = 7 + Math.random() * 22;
        p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:${-size}px;background:${PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]};animation-duration:${7 + Math.random() * 12}s;animation-delay:${Math.random() * 10}s;border-radius:${Math.random() > 0.45 ? '50%' : '5px'};`;
        sectionEl.appendChild(p);
        particles.push(p);
      }
    }

    return () => {
      frame.removeEventListener('mousemove', onMove);
      frame.removeEventListener('mouseleave', onLeave);
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <section ref={sectionRef} className={howStyles['how-section']}>
      <div className={howStyles['section-inner']}>
        <div className={styles.floatWrap}>
          <div ref={frameRef} className={styles.frame}>
            <div className={styles.shine} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/backgrounds/HR.png"
              alt="Every photo personally reviewed by a passport expert — 100% human reviewed, meets official government standards, trusted by thousands of customers."
              loading="lazy"
              className={styles.img}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
