import type { Metadata } from 'next';
import Link from 'next/link';

const CANONICAL = 'https://expresspassportphoto.com/blog/how-to-renew-us-passport-2026';

export const metadata: Metadata = {
  title: 'How to Renew a US Passport in 2026 (Step-by-Step Guide)',
  description: 'Complete guide to renewing your US passport in 2026. Processing times, fees, required documents, photos, and whether to use routine or expedited renewal.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'How to Renew a US Passport in 2026',
    description: 'Routine renewal takes 6–8 weeks. Expedited takes 2–3 weeks. Here is every step, every document, and every fee — so nothing delays your application.',
    url: CANONICAL,
    siteName: 'Express Passport Photo',
    type: 'article',
    publishedTime: '2026-09-16',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Renew a US Passport in 2026',
    description: 'Step-by-step renewal guide: documents, fees, photos, processing times. Everything in one place.',
  },
};

const FAQ = [
  { q: 'How long does passport renewal take in 2026?', a: 'Routine passport renewal takes 6–8 weeks in 2026. Expedited renewal takes 2–3 weeks. If you are traveling within 14 days, you can request an urgent appointment at a passport agency. These times can change — check travel.state.gov for current processing times before applying.' },
  { q: 'How much does it cost to renew a US passport in 2026?', a: 'Routine passport renewal costs $130 for the book. Expedited service adds $60, making it $190. An 8-week passport card renewal costs $30 (routine) or $90 (expedited). These are government fees — any postal or agency service fees are separate.' },
  { q: 'Can I renew my passport by mail in 2026?', a: 'Yes, if your passport is less than 15 years old, was issued after your 16th birthday, is not damaged, and was issued in your current legal name (or you have legal documentation of a name change). If any of these conditions are not met, you must apply in person.' },
  { q: 'Do I need a new photo to renew my passport?', a: 'Yes. Every passport renewal requires a new 2×2 inch photo taken within the last 6 months. The photo must meet all US State Department requirements: white background, neutral expression, no glasses, eyes open. An AI service like Express Passport Photo produces a compliant photo in 30 seconds for $0.99.' },
  { q: 'How early should I renew my passport?', a: 'Renew at least 9 months before your passport expires. Many countries require your passport to be valid for 6 months beyond your travel dates. If your passport expires in the next 9 months, start the renewal process now.' },
  { q: 'What if I need my passport renewed urgently?', a: 'If you are traveling within 3 weeks, call 1-877-487-2778 to request an urgent appointment at a regional passport agency. You must bring proof of travel (flight booking, hotel reservation) dated within 3 weeks. Bring all documents and a compliant photo ready to submit.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'How to Renew a US Passport in 2026 (Step-by-Step Guide)',
      description: 'Complete guide to renewing your US passport in 2026. Processing times, fees, required documents, and photos.',
      datePublished: '2026-09-16',
      dateModified: '2026-09-16',
      author: { '@type': 'Organization', name: 'Express Passport Photo', url: 'https://expresspassportphoto.com' },
      publisher: { '@type': 'Organization', name: 'Express Passport Photo', url: 'https://expresspassportphoto.com' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://expresspassportphoto.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://expresspassportphoto.com/blog' },
        { '@type': 'ListItem', position: 3, name: 'How to Renew a US Passport 2026', item: CANONICAL },
      ],
    },
  ],
};

export default function PassportRenewalPage() {
  return (
    <>
      <style>{`
        .blog-page { font-family: var(--font-inter), system-ui, sans-serif; background: #fff; min-height: 100vh; color: #374151; }

        .blog-hero { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); padding: 56px 24px 64px; color: #fff; }
        .blog-hero-inner { max-width: 760px; margin: 0 auto; }
        .blog-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 500; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .blog-back:hover { color: #fff; }
        .blog-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .blog-tag { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
        .blog-meta { color: rgba(255,255,255,0.55); font-size: 13px; }
        .blog-h1 { font-family: var(--font-inter), system-ui, sans-serif; font-size: clamp(28px, 5vw, 42px); font-weight: 800; line-height: 1.2; color: #fff; margin: 0 0 18px; text-wrap: balance; }
        .blog-lead { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.8); margin: 0; max-width: 620px; }

        .blog-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 36px; }
        @media (max-width: 600px) { .blog-stats { grid-template-columns: repeat(2, 1fr); } }
        .blog-stat { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 16px; text-align: center; }
        .blog-stat-val { font-size: 20px; font-weight: 800; color: #fff; }
        .blog-stat-val.accent { color: #60A5FA; }
        .blog-stat-label { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px; font-weight: 500; }

        .blog-body { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

        .blog-toc { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px 28px; margin: 40px 0; }
        .blog-toc-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748B; margin-bottom: 14px; }
        .blog-toc ol { margin: 0; padding: 0 0 0 18px; }
        .blog-toc li { font-size: 14px; color: #2563EB; padding: 3px 0; line-height: 1.5; }

        .blog-section { margin-top: 52px; }
        .blog-section-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
        .blog-section-num { flex-shrink: 0; width: 32px; height: 32px; background: #EFF6FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2563EB; margin-top: 4px; }
        .blog-h2 { font-family: var(--font-inter), system-ui, sans-serif; font-size: clamp(20px, 3.5vw, 26px); font-weight: 800; color: #1B3A6B; line-height: 1.3; margin: 0; text-wrap: balance; }
        .blog-p { font-size: 16px; line-height: 1.75; color: #374151; margin: 0 0 16px; }

        .callout { border-radius: 12px; padding: 18px 22px; margin: 24px 0; }
        .callout.tip { background: #EFF6FF; border-left: 4px solid #2563EB; }
        .callout.warning { background: #FFFBEB; border-left: 4px solid #F59E0B; }
        .callout.success { background: #F0FDF4; border-left: 4px solid #22C55E; }
        .callout.danger { background: #FFF1F2; border-left: 4px solid #F43F5E; }
        .callout-label { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
        .callout.tip .callout-label { color: #2563EB; }
        .callout.warning .callout-label { color: #D97706; }
        .callout.success .callout-label { color: #16A34A; }
        .callout.danger .callout-label { color: #E11D48; }
        .callout p { font-size: 15px; line-height: 1.65; margin: 0; color: #1E293B; }

        .steps { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; }
        .step-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
        .step-n { flex-shrink: 0; width: 28px; height: 28px; background: #1B3A6B; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 1px; }
        .step-content { flex: 1; }
        .step-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 4px; }
        .step-body { font-size: 14px; line-height: 1.6; color: #4B5563; }

        .fees-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid #E2E8F0; margin: 20px 0; }
        table.fees-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .fees-table thead tr { background: #F1F5F9; }
        .fees-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #64748B; }
        .fees-table td { padding: 13px 16px; border-top: 1px solid #F1F5F9; color: #374151; }
        .fees-table td.price { font-weight: 700; color: #1B3A6B; font-variant-numeric: tabular-nums; }

        .checklist { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
        .check-item { display: flex; align-items: flex-start; gap: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 12px 16px; }
        .check-icon { flex-shrink: 0; width: 20px; height: 20px; background: #22C55E; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
        .check-icon svg { width: 10px; height: 10px; stroke: #fff; stroke-width: 3; }
        .check-item span { font-size: 14px; color: #374151; line-height: 1.5; }

        .timeline { display: flex; flex-direction: column; gap: 0; margin: 20px 0; }
        .timeline-item { display: flex; gap: 16px; }
        .timeline-left { display: flex; flex-direction: column; align-items: center; }
        .timeline-dot { width: 14px; height: 14px; border-radius: 50%; background: #2563EB; flex-shrink: 0; margin-top: 4px; }
        .timeline-line { width: 2px; background: #BFDBFE; flex: 1; margin: 4px 0; min-height: 24px; }
        .timeline-item:last-child .timeline-line { display: none; }
        .timeline-content { padding-bottom: 20px; }
        .timeline-label { font-size: 13px; font-weight: 700; color: #1B3A6B; }
        .timeline-detail { font-size: 13px; color: #6B7280; margin-top: 2px; line-height: 1.5; }

        .faq-list { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        details.faq-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
        details.faq-item[open] { border-color: #BFDBFE; }
        details.faq-item summary { list-style: none; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; font-size: 15px; font-weight: 600; color: #1B3A6B; line-height: 1.4; }
        details.faq-item summary::-webkit-details-marker { display: none; }
        .faq-chevron { flex-shrink: 0; width: 20px; height: 20px; stroke: #2563EB; transition: transform 0.2s; }
        details.faq-item[open] .faq-chevron { transform: rotate(180deg); }
        .faq-answer { padding: 0 20px 18px; font-size: 15px; line-height: 1.7; color: #4B5563; }

        .related-links { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px 24px; margin-top: 40px; }
        .related-links-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94A3B8; margin-bottom: 12px; }
        .related-link { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #2563EB; text-decoration: none; padding: 4px 0; }

        .blog-author { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px 24px; margin-top: 24px; }
        .blog-author-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; }
        .blog-author-name { font-size: 15px; font-weight: 700; color: #1B3A6B; margin-bottom: 6px; }
        .blog-author-bio { font-size: 14px; color: #6B7280; line-height: 1.65; }

        .blog-cta { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); border-radius: 20px; padding: 44px 36px; text-align: center; margin-top: 48px; }
        .blog-cta h2 { font-family: var(--font-inter), system-ui, sans-serif; font-size: clamp(22px, 4vw, 30px); font-weight: 800; color: #fff; margin: 0 0 12px; }
        .blog-cta p { font-size: 16px; color: rgba(255,255,255,0.75); margin: 0 0 28px; }
        .blog-cta-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #1B3A6B; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,0.15); transition: transform 0.15s; }
        .blog-cta-btn:hover { transform: translateY(-2px); }
        .blog-divider { border: none; border-top: 1px solid #E2E8F0; margin: 48px 0 0; }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="blog-page">
        <div className="blog-hero">
          <div className="blog-hero-inner">
            <nav aria-label="Breadcrumb" style={{marginBottom:20}}>
              <ol style={{display:'flex',gap:6,fontSize:13,color:'rgba(255,255,255,0.55)',listStyle:'none',padding:0,margin:0,flexWrap:'wrap'}}>
                <li><Link href="/" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>Home</Link></li>
                <li style={{opacity:0.4}}>›</li>
                <li><Link href="/blog" style={{color:'rgba(255,255,255,0.55)',textDecoration:'none'}}>Blog</Link></li>
                <li style={{opacity:0.4}}>›</li>
                <li style={{color:'rgba(255,255,255,0.8)',fontWeight:500}}>How to Renew a US Passport 2026</li>
              </ol>
            </nav>
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">Passport Renewal</span>
              <span className="blog-meta">September 16, 2026 · 8 min read</span>
            </div>
            <h1 className="blog-h1">How to Renew a US Passport in 2026 (Step-by-Step Guide)</h1>
            <p className="blog-lead">Routine renewal takes 6–8 weeks. Expedited takes 2–3 weeks. Here is every step, every document, and every fee — so nothing delays your application.</p>
            <div className="blog-stats">
              <div className="blog-stat"><div className="blog-stat-val">6–8 wks</div><div className="blog-stat-label">Routine processing</div></div>
              <div className="blog-stat"><div className="blog-stat-val">2–3 wks</div><div className="blog-stat-label">Expedited processing</div></div>
              <div className="blog-stat"><div className="blog-stat-val">$130</div><div className="blog-stat-label">Routine fee</div></div>
              <div className="blog-stat"><div className="blog-stat-val accent">$0.99</div><div className="blog-stat-label">Photo via AI</div></div>
            </div>
          </div>
        </div>

        <div className="blog-body">
          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>Can you renew your passport by mail?</li>
              <li>Documents you need for renewal</li>
              <li>2026 passport renewal fees</li>
              <li>Get a compliant passport photo</li>
              <li>How to fill out Form DS-82</li>
              <li>Where to submit your renewal application</li>
              <li>Processing times in 2026</li>
              <li>What to do if you need your passport urgently</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          {/* Section 1 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">Can You Renew Your Passport by Mail?</h2>
            </div>
            <p className="blog-p">Most US adults can renew their passport by mail using Form DS-82. You qualify if ALL of the following are true:</p>
            <div className="checklist">
              {[
                'Your most recent passport was issued when you were 16 or older',
                'Your passport was issued less than 15 years ago',
                'Your passport is undamaged (not water damaged, torn, or heavily worn)',
                'Your name has not changed — or you have a legal document proving the change (marriage certificate, court order)',
                'You currently have the passport in your possession',
              ].map((t) => (
                <div key={t} className="check-item">
                  <div className="check-icon"><svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="callout warning">
              <div className="callout-label">Cannot renew by mail?</div>
              <p>If any condition above is not met, you must apply in person at a passport acceptance facility (post office, library, or clerk of court). Use Form DS-11 instead of DS-82.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">Documents You Need for Renewal</h2>
            </div>
            <p className="blog-p">Before you mail anything, gather every item on this list. A missing document is the most common reason renewals are delayed.</p>
            <div className="checklist">
              {[
                'Completed Form DS-82 (filled out in black ink or printed from the State Department website)',
                'Your most recent US passport (it will be returned to you after processing)',
                'One passport photo — 2×2 inches, taken within the last 6 months',
                'Check or money order for the application fee (payable to "US Department of State")',
                'Name change document if applicable (certified copy — originals are returned)',
              ].map((t) => (
                <div key={t} className="check-item">
                  <div className="check-icon"><svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="callout tip">
              <div className="callout-label">Tip</div>
              <p>Do not staple or paper-clip your photo to the form. Write your name and date of birth lightly in pencil on the back of the photo, then attach it with a small piece of tape to the designated box on DS-82.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">2026 Passport Renewal Fees</h2>
            </div>
            <p className="blog-p">These are the official US government fees as of 2026. Expedited service is worth it if you have any travel planned in the next 3 months.</p>
            <div className="fees-table-wrap">
              <table className="fees-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Government fee</th>
                    <th>Expedited add-on</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: 'Passport Book (adult)', f: '$130', e: '+$60', t: '$190 expedited' },
                    { s: 'Passport Card (adult)', f: '$30', e: '+$60', t: '$90 expedited' },
                    { s: 'Book + Card together', f: '$160', e: '+$60', t: '$220 expedited' },
                    { s: 'Passport Photo (AI)', f: '$0.99', e: '—', t: '$0.99' },
                  ].map((row) => (
                    <tr key={row.s}>
                      <td style={{fontWeight:600,color:'#1B3A6B'}}>{row.s}</td>
                      <td className="price">{row.f}</td>
                      <td style={{color:'#6B7280'}}>{row.e}</td>
                      <td style={{color:'#374151',fontSize:13}}>{row.t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="blog-p" style={{fontSize:12,color:'#94A3B8',marginTop:8}}>Pay by check or money order made out to "US Department of State." Do not send cash.</p>
          </div>

          {/* Section 4 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">4</div>
              <h2 className="blog-h2">Get a Compliant Passport Photo</h2>
            </div>
            <p className="blog-p">Every renewal requires a new photo. The State Department rejects photos that do not meet their exact specifications — and a rejected photo delays your entire application.</p>
            <p className="blog-p">Your photo must be:</p>
            <div className="checklist">
              {[
                '2×2 inches (51×51 mm) printed size',
                'Taken within the last 6 months',
                'Plain white or off-white background — no patterns or shadows',
                'Neutral expression, mouth closed',
                'Eyes open and looking directly at the camera',
                'No glasses (not permitted since 2016)',
                'No hats or head coverings (unless for religious reasons)',
              ].map((t) => (
                <div key={t} className="check-item">
                  <div className="check-icon"><svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="callout success">
              <div className="callout-label">Fastest option</div>
              <p><strong>Express Passport Photo</strong> produces a government-compliant 2×2 photo in 30 seconds for $0.99 — with automatic background removal, head size check, and a 100% acceptance guarantee. Download the digital file, then print at CVS or Walgreens for $1–3.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">How to Fill Out Form DS-82</h2>
            </div>
            <p className="blog-p">Download DS-82 from travel.state.gov. Print it single-sided on standard 8.5×11 paper. Fill it out in black ink or complete it online and print.</p>
            <div className="steps">
              {[
                { title: 'Complete all fields on pages 1 and 2', body: 'Include your full legal name exactly as it appears on your current passport. If your name has changed, fill in your new name on the top and your previous name in the name change section.' },
                { title: 'Sign and date on page 2', body: 'Your signature must be inside the box. Do not sign before you are ready to mail — the signature must be fresh. Do not use a digital signature.' },
                { title: 'Attach your photo', body: 'Tape your 2×2 photo into the photo box on page 1. Do not staple it. Write your name and date of birth lightly in pencil on the back of the photo before attaching.' },
                { title: 'Do not mail your form until your photo is ready', body: 'A missing or non-compliant photo is the most common reason DS-82 applications are returned. Have your compliant photo in hand before you seal the envelope.' },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div className="step-content">
                    <div className="step-title">{s.title}</div>
                    <div className="step-body">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">6</div>
              <h2 className="blog-h2">Where to Submit Your Renewal Application</h2>
            </div>
            <p className="blog-p">Mail your complete DS-82 package to the National Passport Processing Center. The address varies based on whether you choose routine or expedited service.</p>
            <div className="steps">
              {[
                { title: 'Routine renewal (6–8 weeks)', body: 'National Passport Processing Center, P.O. Box 90155, Philadelphia, PA 19190-0155' },
                { title: 'Expedited renewal (2–3 weeks, +$60)', body: 'National Passport Processing Center, P.O. Box 90955, Philadelphia, PA 19190-0955. Write "EXPEDITE" on the outside of the envelope.' },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div className="step-content">
                    <div className="step-title">{s.title}</div>
                    <div className="step-body" style={{fontFamily:'monospace',fontSize:13,background:'#F8FAFC',padding:'8px 12px',borderRadius:8,marginTop:6}}>{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="callout tip">
              <div className="callout-label">Use trackable mail</div>
              <p>Send your application via USPS Priority Mail or FedEx with a tracking number. Your original passport is in that envelope — you want to know exactly where it is.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">7</div>
              <h2 className="blog-h2">Processing Times in 2026</h2>
            </div>
            <p className="blog-p">Current processing times from the US State Department as of September 2026. These are subject to change — check travel.state.gov for live updates before you apply.</p>
            <div className="timeline">
              {[
                { label: 'Routine processing', detail: '6–8 weeks from mailing date. Best for travel more than 10 weeks away.' },
                { label: 'Expedited processing (+$60)', detail: '2–3 weeks from mailing date. Best for travel 3–10 weeks away.' },
                { label: 'Urgent appointment at passport agency', detail: '1–5 business days. Only available if traveling within 14 days. Must call 1-877-487-2778 to schedule.' },
                { label: 'Life-or-death emergency', detail: '24–72 hours. For medical emergencies or funerals abroad requiring immediate travel.' },
              ].map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-left">
                    <div className="timeline-dot"></div>
                    <div className="timeline-line"></div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-label">{t.label}</div>
                    <div className="timeline-detail">{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">8</div>
              <h2 className="blog-h2">What to Do If You Need Your Passport Urgently</h2>
            </div>
            <p className="blog-p">If you are traveling within 3 weeks and do not have a valid passport, take these steps immediately:</p>
            <div className="steps">
              {[
                { title: 'Call 1-877-487-2778', body: 'This is the National Passport Information Center. They can check appointment availability at your nearest regional passport agency. Lines are open Monday–Friday, 8am–10pm ET.' },
                { title: 'Book your appointment online', body: 'Go to travel.state.gov → "Schedule Appointment." Appointments fill up fast — call and book online at the same time if possible.' },
                { title: 'Gather your documents before the appointment', body: 'Bring: DS-82 (completed), your current passport, one compliant 2×2 photo, payment for all fees, and proof of travel (flight or hotel booking showing departure within 3 weeks).' },
                { title: 'Get your photo before your appointment', body: 'Do not show up without a photo — agencies do not always have photo services on-site. Get your compliant photo from Express Passport Photo ($0.99) and print it before you go.' },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div className="step-content">
                    <div className="step-title">{s.title}</div>
                    <div className="step-body">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="callout danger">
              <div className="callout-label">Important</div>
              <p>Passport agencies only serve people with imminent travel. You must bring proof of travel dated within 14 days to qualify for an urgent appointment. Without it, you will be turned away.</p>
            </div>
          </div>

          {/* FAQ */}
          <hr className="blog-divider"/>
          <div className="blog-section">
            <h2 className="blog-h2" style={{marginBottom:8}}>9. Frequently Asked Questions</h2>
            <div className="faq-list">
              {FAQ.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>
                    {item.q}
                    <svg className="faq-chevron" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </summary>
                  <div className="faq-answer">{item.a}</div>
                </details>
              ))}
            </div>
          </div>

          {/* Related links */}
          <div className="related-links">
            <div className="related-links-title">Related guides</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { href:'/blog/passport-photo-cost-2026', label:'How Much Does a Passport Photo Cost in 2026?' },
                { href:'/blog/how-to-take-passport-photo-at-home', label:'How to Take a Passport Photo at Home' },
                { href:'/blog/passport-photo-rejected', label:'What Happens If Your Passport Photo Gets Rejected?' },
                { href:'/us-passport-photo', label:'US Passport Photo Requirements' },
              ].map(({href,label}) => (
                <Link key={href} href={href} className="related-link">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="blog-author">
            <div className="blog-author-label">Written by</div>
            <div className="blog-author-name">The Express Passport Photo Team</div>
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. We help travelers get government-compliant passport photos in 30 seconds for $0.99 — with a 100% acceptance guarantee.</div>
          </div>

          <div className="blog-cta">
            <h2>Get your renewal photo in 30 seconds</h2>
            <p>Upload a selfie. AI removes the background, checks compliance, and delivers a print-ready 2×2 photo. $0.99 with a money-back guarantee.</p>
            <Link href="/upload" className="blog-cta-btn">
              Get my passport photo — $0.99
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
