'use client';

import { useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import styles from './HowItWorks.module.css';

/**
 * HowItWorks — "Three steps, under 5 minutes" section.
 * Ported from the provided design (index 1.html). Step 2 is a Before → After
 * background-removal comparison. Animations (card entrance + 3D tilt, floating
 * particles) are wired up in the effect below; the rest are pure CSS.
 *
 * Images: step_selfie.png = raw selfie (before), step_compliant.png = same
 * person with the background removed onto white (after) — used in steps 2 & 3.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const BEFORE_IMG = '/images/backgrounds/1.png'; // raw selfie (room background)
const AFTER_IMG = '/images/backgrounds/2.png';  // same person, background removed → white

const PARTICLE_COLORS = ['#c7d2fe', '#bfdbfe', '#bbf7d0', '#ddd6fe', '#fce7f3', '#fed7aa'];

// Join one or more module class names (handles the kebab-case keys).
const cx = (...names: string[]) => names.map((n) => styles[n]).filter(Boolean).join(' ');

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(sectionEl.querySelectorAll<HTMLElement>(`.${styles.card}`));

    // 3D tilt + shine follow cursor (entrance is handled in pure CSS)
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
      const leave = () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
      });
    });

    // 3 — floating background particles
    const particles: HTMLElement[] = [];
    if (!reduce) {
      for (let i = 0; i < 22; i++) {
        const p = document.createElement('div');
        p.className = styles['bg-particle'];
        const size = 7 + Math.random() * 22;
        p.style.cssText = `
          width:${size}px; height:${size}px;
          left:${Math.random() * 100}%;
          bottom:${-size}px;
          background:${PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]};
          animation-duration:${7 + Math.random() * 12}s;
          animation-delay:${Math.random() * 10}s;
          border-radius:${Math.random() > 0.45 ? '50%' : '5px'};
        `;
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
    <section
      ref={sectionRef}
      className={`${styles['how-section']} ${poppins.variable}`}
      aria-labelledby="how-title"
    >
      <div className={styles['section-inner']}>

        {/* Heading */}
        <div className={styles['heading-wrap']}>
          <div className={styles['h-line']} aria-hidden="true" />
          <h2 id="how-title" className={styles['title-anim']}>Three steps, under 5 minutes</h2>
          <div className={cx('h-line', 'right')} aria-hidden="true" />
        </div>

        {/* Steps grid */}
        <div className={styles['steps-grid']}>

          {/* ════ CARD 1 ════ */}
          <article className={styles.card} aria-label="Step 1: Upload your selfie">
            <div className={styles['card-shine']} aria-hidden="true" />
            <div className={styles['step-badge']} aria-hidden="true">
              <div className={styles['radar-ring']} /><div className={styles['radar-ring']} />1
            </div>

            <div className={cx('visual', 'v1')}>
              <div className={styles['v1-photo']}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BEFORE_IMG} alt="Man taking a selfie" loading="eager" width={480} />
              </div>
              <div className={styles['v1-upload']}>
                <div className={styles['upload-card']}>
                  <div className={styles['uc-thumb']}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={BEFORE_IMG} alt="Photo preview" />
                  </div>
                  <div className={styles['uc-icon']}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M12 5l-5 5M12 5l5 5" /></svg>
                  </div>
                  <span className={styles['uc-label']}>Uploading...</span>
                  <div
                    className={styles['uc-bar']}
                    role="progressbar"
                    aria-valuenow={100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Upload progress 100%"
                  >
                    <div className={styles['uc-fill']} />
                  </div>
                  <div className={styles['uc-pct']}>
                    100%
                    <div className={styles['uc-tick']}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['card-body']}>
              <h3 className={styles['card-title']}>Upload your selfie</h3>
              <p className={styles['card-desc']}>Take a selfie or upload an existing photo. Any background works.</p>
              <div className={styles['time-pill']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                10 seconds
              </div>
            </div>
          </article>

          {/* Connector 1 → 2 */}
          <div className={styles.connector} aria-hidden="true">
            <div className={styles['pulse-dot']} />
            <div className={styles['c-arrow']}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
          </div>

          {/* ════ CARD 2 ════ */}
          <article className={styles.card} aria-label="Step 2: AI removes background">
            <div className={styles['card-shine']} aria-hidden="true" />
            <div className={styles['step-badge']} aria-hidden="true">
              <div className={styles['radar-ring']} /><div className={styles['radar-ring']} />2
            </div>

            <div className={cx('visual', 'v2')}>
              {/* Before: natural background selfie */}
              <div className={styles['v2-before']}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BEFORE_IMG} alt="Original selfie with natural background" />
                <span className={cx('v2-label', 'v2-label-before')}>Before</span>
              </div>

              {/* Center: AI divider badge */}
              <div className={styles['v2-center']}>
                <div className={styles['v2-scan']} aria-hidden="true" />
                <div className={styles['v2-ai-dot']} aria-label="AI processing">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" /></svg>
                </div>
                <span className={styles['v2-ai-text']}>AI</span>
              </div>

              {/* After: white background result */}
              <div className={styles['v2-after']}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AFTER_IMG} alt="Passport photo with white background" />
                <div className={styles['v2-removed-tag']} aria-hidden="true">
                  <span>✓ Background</span>
                  <span>Removed</span>
                </div>
                <span className={cx('v2-label', 'v2-label-after')}>✓ After</span>
              </div>
            </div>

            <div className={styles['card-body']}>
              <h3 className={styles['card-title']}>AI removes background</h3>
              <p className={styles['card-desc']}>AI instantly removes the background and replaces it with a clean white — then verifies face, position, and lighting.</p>
              <div className={styles['time-pill']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                ~30 seconds
              </div>
            </div>
          </article>

          {/* Connector 2 → 3 */}
          <div className={styles.connector} aria-hidden="true">
            <div className={styles['pulse-dot']} />
            <div className={styles['c-arrow']}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
          </div>

          {/* ════ CARD 3 ════ */}
          <article className={styles.card} aria-label="Step 3: Download or pick up at CVS">
            <div className={styles['card-shine']} aria-hidden="true" />
            <div className={styles['step-badge']} aria-hidden="true">
              <div className={styles['radar-ring']} /><div className={styles['radar-ring']} />3
            </div>

            <div className={cx('visual', 'v3')}>
              {/* Download column */}
              <div className={styles['v3-col']}>
                <span className={styles['v3-label']}>Download</span>
                <div className={styles['laptop-wrap']}>
                  <div className={styles['lp-screen']}>
                    <div className={styles['lp-screen-inner']}>
                      <div className={styles['lp-passport']}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={AFTER_IMG} alt="Passport photo on screen" />
                      </div>
                    </div>
                  </div>
                  <div className={styles['lp-hinge']} />
                  <div className={styles['lp-base']} />
                </div>
                <button className={styles['dl-btn']} type="button">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v10M7 15l5 5 5-5M4 20h16" /></svg>
                  Download
                </button>
                <span className={styles['dl-caption']}>Instant digital file</span>
              </div>

              {/* OR */}
              <div className={styles['v3-or']} aria-label="or">
                <div className={styles['or-line']} />
                <div className={styles['or-badge']}>OR</div>
                <div className={styles['or-line']} />
              </div>

              {/* CVS column */}
              <div className={styles['v3-col']}>
                <span className={styles['v3-label']}>Pick up</span>
                <div className={styles['cvs-store-wrap']}>
                  <div className={styles['cvs-storefront']} aria-label="CVS store">
                    <div className={styles['cvs-sky']} />
                    <div className={styles['cvs-building']} />
                    <div className={styles['cvs-signboard']}>
                      <div className={styles['cvs-signboard-text']}>CVS</div>
                    </div>
                    <div className={styles['cvs-door']} />
                    <div className={cx('cvs-win', 'L')} />
                    <div className={cx('cvs-win', 'R')} />
                  </div>
                  <div className={styles['print-grid']} aria-label="Printed passport photos">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className={styles['print-cell']}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={AFTER_IMG} alt={`Print ${n}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['card-body']}>
              <h3 className={styles['card-title']}>Download or pick up</h3>
              <p className={styles['card-desc']}>Get an instant download, or pick up 6 pics at your nearest CVS.</p>
              <div className={styles['time-pill']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Instant
              </div>
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}
