import { Poppins } from 'next/font/google';
import styles from './HowItWorks.module.css';

/**
 * HowItWorks — "Three steps, under 5 minutes" section.
 * Ported from the provided standalone design (CSS lives in HowItWorks.module.css).
 * Poppins is loaded via next/font and exposed as --font-poppins on the section.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Join one or more module class names (handles the kebab-case keys).
const cx = (...names: string[]) => names.map((n) => styles[n]).filter(Boolean).join(' ');

export default function HowItWorks() {
  return (
    <section className={`${styles['how-section']} ${poppins.variable}`} aria-labelledby="how-title">
      <div className={styles['section-inner']}>

        {/* Heading */}
        <div className={styles['heading-wrap']}>
          <div className={styles['h-line']} aria-hidden="true" />
          <h2 id="how-title">Three steps, under 5 minutes</h2>
          <div className={cx('h-line', 'right')} aria-hidden="true" />
        </div>

        {/* Steps grid */}
        <div className={styles['steps-grid']}>

          {/* ════ CARD 1 ════ */}
          <article className={styles.card} aria-label="Step 1: Upload your selfie">
            <div className={styles['step-badge']} aria-hidden="true">1</div>

            <div className={cx('visual', 'v1')}>
              <div className={styles['v1-photo']}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=480&q=85&fit=crop&crop=top"
                  alt="Man taking a selfie"
                  loading="eager"
                  width={480}
                />
              </div>
              <div className={styles['v1-upload']}>
                <div className={styles['upload-card']}>
                  <div className={styles['uc-thumb']}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=140&q=85&fit=crop&crop=top"
                      alt="Photo preview"
                    />
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
            <div className={styles['c-arrow']}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
          </div>

          {/* ════ CARD 2 ════ */}
          <article className={styles.card} aria-label="Step 2: AI checks compliance">
            <div className={styles['step-badge']} aria-hidden="true">2</div>

            <div className={cx('visual', 'v2')}>
              <div className={styles['ai-box']}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=220&q=85&fit=crop&crop=top"
                  alt="Passport photo being analyzed"
                />
                <div className={cx('ai-corner', 'tl')} />
                <div className={cx('ai-corner', 'tr')} />
                <div className={cx('ai-corner', 'bl')} />
                <div className={cx('ai-corner', 'br')} />
                <div className={styles['ai-vline']} />
                <div className={styles['ai-oval']} />
                <div className={cx('ai-eye', 'L')} />
                <div className={cx('ai-eye', 'R')} />
              </div>

              <div className={styles['check-card']}>
                <div className={styles['cc-head']}>
                  <div className={styles['cc-head-icon']}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  </div>
                  <span>AI Compliance<br />Check</span>
                </div>
                {['Face size', 'Head position', 'Eye level', 'Lighting', 'Background'].map((label) => (
                  <div key={label} className={styles['cc-row']}>
                    <span className={styles['cc-row-label']}>{label}</span>
                    <span className={styles['cc-pass']}>
                      <span className={styles['cc-dot']}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
                      </span>
                      Pass
                    </span>
                  </div>
                ))}
                <div className={styles['cc-footer']}>
                  <span className={styles['cc-footer-title']}>Compliant</span>
                  <span className={styles['cc-footer-sub']}>Photo approved</span>
                </div>
              </div>
            </div>

            <div className={styles['card-body']}>
              <h3 className={styles['card-title']}>AI checks compliance</h3>
              <p className={styles['card-desc']}>We remove the background, verify face size, position, and lighting.</p>
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
            <div className={styles['c-arrow']}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
          </div>

          {/* ════ CARD 3 ════ */}
          <article className={styles.card} aria-label="Step 3: Download or pick up at CVS">
            <div className={styles['step-badge']} aria-hidden="true">3</div>

            <div className={cx('visual', 'v3')}>
              {/* Download column */}
              <div className={styles['v3-col']}>
                <span className={styles['v3-label']}>Download</span>
                <div className={styles['laptop-wrap']}>
                  <div className={styles['lp-screen']}>
                    <div className={styles['lp-screen-inner']}>
                      <div className={styles['lp-passport']}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=top"
                          alt="Passport photo on screen"
                        />
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
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80&fit=crop&crop=top" alt={`Print ${n}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['card-body']}>
              <h3 className={styles['card-title']}>Download or pick up</h3>
              <p className={styles['card-desc']}>Get an instant download, or pick up 2 prints at your nearest CVS.</p>
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
