'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import styles from './HowItWorks.module.css';

/**
 * "How Human Expert Review works" — reuses the exact visual system of the
 * "Three steps, under 5 minutes" section (HowItWorks.module.css): the animated
 * morphing gradient background, floating particles, gradient-flow title with
 * side lines, gradient-top cards with cursor-follow shine + 3D tilt, numbered
 * radar badges, and connector arrows. Purely presentational.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const PARTICLE_COLORS = ['#c7d2fe', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#fce7f3', '#fed7aa'];
const cx = (...names: string[]) => names.map((n) => styles[n]).filter(Boolean).join(' ');

const STEPS = [
  { icon: '📄', title: 'Select Document Type', desc: 'Choose your document type and select Human Expert Review.' },
  { icon: '⬆️', title: 'Upload Your Photo', desc: 'Upload your passport photo to start the review.' },
  { icon: '📝', title: 'Submit Review Request', desc: 'Provide your contact details and submit your review request.' },
  { icon: '🧑‍💼', title: 'Expert Reviews Your Photo', desc: 'A passport photo specialist carefully reviews your image.' },
  { icon: '✅', title: 'Receive Feedback', desc: 'We approve your photo or give specific correction instructions.' },
  { icon: '🪪', title: 'Generate Your Passport Photo', desc: 'Once approved, continue to generate your passport photo.' },
];

export default function HumanReviewHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // cursor-follow 3D tilt + shine (same as HowItWorks)
    const cards = Array.from(sectionEl.querySelectorAll<HTMLElement>(`.${styles.card}`));
    const cleanups: Array<() => void> = [];
    cards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', `${(-y * 13).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 13).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      };
      const leave = () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      cleanups.push(() => { card.removeEventListener('mousemove', move); card.removeEventListener('mouseleave', leave); });
    });

    // floating background particles
    const particles: HTMLElement[] = [];
    if (!reduce) {
      for (let i = 0; i < 22; i++) {
        const p = document.createElement('div');
        p.className = styles['bg-particle'];
        const size = 7 + Math.random() * 22;
        p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:${-size}px;background:${PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]};animation-duration:${7 + Math.random() * 12}s;animation-delay:${Math.random() * 10}s;border-radius:${Math.random() > 0.45 ? '50%' : '5px'};`;
        sectionEl.appendChild(p);
        particles.push(p);
      }
    }

    return () => {
      cleanups.forEach((fn) => fn());
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles['how-section']} ${poppins.variable}`} aria-labelledby="hr-how-title">
      <div className={styles['section-inner']}>
        <div className={styles['heading-wrap']}>
          <div className={styles['h-line']} aria-hidden="true" />
          <h2 id="hr-how-title" className={styles['title-anim']}>How Human Expert Review works</h2>
          <div className={cx('h-line', 'right')} aria-hidden="true" />
        </div>

        {/* 6 steps in a 3-up grid → 2 cols on tablet, 1 col on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <article key={s.title} className={styles.card} aria-label={`Step ${i + 1}: ${s.title}`}>
              <div className={styles['card-shine']} aria-hidden="true" />
              <div className={styles['step-badge']} aria-hidden="true">
                <div className={styles['radar-ring']} /><div className={styles['radar-ring']} />{i + 1}
              </div>
              <div className={styles['card-body']} style={{ paddingTop: 64 }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">{s.icon}</div>
                <h3 className={styles['card-title']}>{s.title}</h3>
                <p className={styles['card-desc']}>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
