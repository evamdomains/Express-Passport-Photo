import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Much Does a Passport Photo Cost in 2026? Honest Price Guide',
  description: 'Passport photo prices in 2026 range from $0.99 to $19.99. Compare CVS, Walgreens, UPS Store and AI services. Find the cheapest option that\'s still government-compliant.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog/passport-photo-cost-2026' },
};

const PROVIDERS = [
  { name: 'Express Passport Photo (AI)', price: '$0.99', wait: '30 seconds', check: 'Automatic AI', highlight: true },
  { name: 'CVS Studio', price: '$14.99', wait: '10–30 min', check: 'Manual' },
  { name: 'USPS', price: '$15.00', wait: '10–20 min', check: 'Manual' },
  { name: 'Walgreens Studio', price: '$16.99', wait: '10–30 min', check: 'Manual' },
  { name: 'FedEx Office', price: '$17.99', wait: '5–15 min', check: 'Manual' },
  { name: 'UPS Store', price: '$19.99', wait: '5–15 min', check: 'Manual' },
  { name: 'AAA (members only)', price: 'Free', wait: '10–20 min', check: 'Manual' },
];

const FAQ = [
  { q: 'How much does a passport photo cost at CVS?', a: 'CVS charges $14.99 for a passport photo in 2026. This includes two printed 2×2 inch photos. Not all CVS locations have a photo studio, so call ahead to confirm availability.' },
  { q: 'How much does a passport photo cost at Walgreens?', a: 'Walgreens charges $16.99 for a passport photo in 2026. This includes two printed photos. Wait times vary from 10 to 45 minutes depending on location and time of day.' },
  { q: 'What is the cheapest way to get a passport photo?', a: 'The cheapest option in 2026 is an AI passport photo service like Express Passport Photo at $0.99. It is also the fastest — your compliant photo is ready in 30 seconds. AAA members can also get free passport photos at AAA branches.' },
  { q: 'Can I take my own passport photo at home?', a: 'Yes. US government rules allow self-taken passport photos. The photo must meet strict requirements: white background, correct head size, neutral expression, eyes open, no glasses. An AI service handles all of these automatically.' },
  { q: 'Does a passport photo need to be professionally taken?', a: 'No. The US government does not require photos to be taken by a professional. You can take a selfie and use an AI tool to make it compliant. The photo just needs to meet technical specifications.' },
];

export default function PassportPhotoCostPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');

        .blog-page { font-family: 'Inter', system-ui, sans-serif; background: #F8F9FB; min-height: 100vh; }

        /* Hero */
        .blog-hero { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); padding: 56px 24px 64px; color: #fff; }
        .blog-hero-inner { max-width: 760px; margin: 0 auto; }
        .blog-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 500; text-decoration: none; margin-bottom: 28px; transition: color 0.15s; }
        .blog-back:hover { color: #fff; }
        .blog-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .blog-tag { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
        .blog-meta { color: rgba(255,255,255,0.55); font-size: 13px; }
        .blog-h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(28px, 5vw, 42px); font-weight: 800; line-height: 1.2; color: #fff; margin: 0 0 18px; text-wrap: balance; }
        .blog-lead { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.8); margin: 0; max-width: 600px; }

        /* Stat tiles in hero */
        .blog-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 36px; }
        @media (max-width: 600px) { .blog-stats { grid-template-columns: repeat(2, 1fr); } }
        .blog-stat { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 16px; text-align: center; }
        .blog-stat-val { font-size: 22px; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
        .blog-stat-val.accent { color: #60A5FA; }
        .blog-stat-label { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px; font-weight: 500; letter-spacing: 0.03em; }

        /* Article body */
        .blog-body { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

        /* TOC */
        .blog-toc { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px 28px; margin: 40px 0; }
        .blog-toc-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748B; margin-bottom: 14px; }
        .blog-toc ol { margin: 0; padding: 0 0 0 18px; }
        .blog-toc li { font-size: 14px; color: #2563EB; padding: 3px 0; line-height: 1.5; }
        .blog-toc li::marker { color: #94A3B8; font-size: 12px; }

        /* Section */
        .blog-section { margin-top: 52px; }
        .blog-section-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
        .blog-section-num { flex-shrink: 0; width: 32px; height: 32px; background: #EFF6FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2563EB; margin-top: 4px; }
        .blog-h2 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(20px, 3.5vw, 26px); font-weight: 700; color: #1B3A6B; line-height: 1.3; margin: 0; text-wrap: balance; }
        .blog-p { font-size: 16px; line-height: 1.75; color: #374151; margin: 0 0 16px; }
        .blog-p:last-child { margin-bottom: 0; }

        /* Table */
        .blog-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin: 20px 0; }
        table.blog-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .blog-table thead tr { background: #F1F5F9; }
        .blog-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #64748B; white-space: nowrap; }
        .blog-table td { padding: 13px 16px; border-top: 1px solid #F1F5F9; color: #374151; font-variant-numeric: tabular-nums; }
        .blog-table tr.best { background: #EFF6FF; }
        .blog-table tr.best td { border-top-color: #BFDBFE; }
        .blog-table tr.best td:first-child { border-left: 3px solid #2563EB; }
        .blog-table td.price { font-weight: 700; color: #1B3A6B; font-size: 15px; }
        .blog-table td.price.accent { color: #2563EB; }
        .blog-best-badge { display: inline-flex; background: #2563EB; color: #fff; font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; border-radius: 100px; margin-left: 8px; vertical-align: middle; }
        .blog-table-note { font-size: 12px; color: #94A3B8; margin-top: 8px; }

        /* Callout boxes */
        .callout { border-radius: 12px; padding: 18px 22px; margin: 24px 0; }
        .callout.tip { background: #EFF6FF; border-left: 4px solid #2563EB; }
        .callout.warning { background: #FFFBEB; border-left: 4px solid #F59E0B; }
        .callout.success { background: #F0FDF4; border-left: 4px solid #22C55E; }
        .callout-label { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
        .callout.tip .callout-label { color: #2563EB; }
        .callout.warning .callout-label { color: #D97706; }
        .callout.success .callout-label { color: #16A34A; }
        .callout p { font-size: 15px; line-height: 1.65; margin: 0; color: #1E293B; }

        /* Steps */
        .steps { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; }
        .step-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
        .step-n { flex-shrink: 0; width: 28px; height: 28px; background: #1B3A6B; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 1px; }
        .step-body { font-size: 15px; line-height: 1.6; color: #374151; }

        /* Hidden cost items */
        .risk-list { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
        .risk-item { display: flex; align-items: flex-start; gap: 12px; background: #fff; border: 1px solid #FEE2E2; border-radius: 10px; padding: 12px 16px; }
        .risk-icon { flex-shrink: 0; width: 20px; height: 20px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
        .risk-icon svg { width: 10px; height: 10px; stroke: #EF4444; }
        .risk-item span { font-size: 14px; color: #374151; line-height: 1.5; }

        /* FAQ */
        .faq-list { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        details.faq-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
        details.faq-item[open] { border-color: #BFDBFE; }
        details.faq-item summary { list-style: none; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; font-size: 15px; font-weight: 600; color: #1B3A6B; line-height: 1.4; }
        details.faq-item summary::-webkit-details-marker { display: none; }
        .faq-chevron { flex-shrink: 0; width: 20px; height: 20px; stroke: #2563EB; transition: transform 0.2s; }
        details.faq-item[open] .faq-chevron { transform: rotate(180deg); }
        .faq-answer { padding: 0 20px 18px; font-size: 15px; line-height: 1.7; color: #4B5563; }

        /* Author */
        .blog-author { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px 24px; margin-top: 48px; }
        .blog-author-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; }
        .blog-author-name { font-size: 15px; font-weight: 700; color: #1B3A6B; margin-bottom: 6px; }
        .blog-author-bio { font-size: 14px; color: #6B7280; line-height: 1.65; }

        /* CTA */
        .blog-cta { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); border-radius: 20px; padding: 44px 36px; text-align: center; margin-top: 48px; }
        .blog-cta h2 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(22px, 4vw, 30px); font-weight: 800; color: #fff; margin: 0 0 12px; }
        .blog-cta p { font-size: 16px; color: rgba(255,255,255,0.75); margin: 0 0 28px; }
        .blog-cta-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #1B3A6B; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
        .blog-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

        /* Divider */
        .blog-divider { border: none; border-top: 1px solid #E2E8F0; margin: 48px 0 0; }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .blog-page { background: #0F172A; }
          :root:not([data-theme="light"]) .blog-toc,
          :root:not([data-theme="light"]) .step-item,
          :root:not([data-theme="light"]) details.faq-item,
          :root:not([data-theme="light"]) .blog-author { background: #1E293B; border-color: #334155; }
          :root:not([data-theme="light"]) .blog-h2 { color: #E2E8F0; }
          :root:not([data-theme="light"]) .blog-p { color: #CBD5E1; }
          :root:not([data-theme="light"]) .blog-table-wrap { border-color: #334155; }
          :root:not([data-theme="light"]) .blog-table td { color: #CBD5E1; border-color: #1E293B; }
          :root:not([data-theme="light"]) .blog-table thead tr { background: #1E293B; }
          :root:not([data-theme="light"]) .blog-table tr.best { background: #172554; }
          :root:not([data-theme="light"]) .blog-table td.price { color: #E2E8F0; }
          :root:not([data-theme="light"]) details.faq-item summary { color: #E2E8F0; }
          :root:not([data-theme="light"]) .faq-answer { color: #94A3B8; }
          :root:not([data-theme="light"]) .risk-item { background: #1E293B; border-color: #7F1D1D; }
          :root:not([data-theme="light"]) .risk-item span { color: #CBD5E1; }
          :root:not([data-theme="light"]) .step-body { color: #CBD5E1; }
          :root:not([data-theme="light"]) .callout.tip { background: #172554; }
          :root:not([data-theme="light"]) .callout.tip p { color: #BFDBFE; }
          :root:not([data-theme="light"]) .blog-author-name { color: #E2E8F0; }
          :root:not([data-theme="light"]) .blog-author-bio { color: #94A3B8; }
          :root:not([data-theme="light"]) .blog-divider { border-color: #334155; }
        }
        :root[data-theme="dark"] .blog-page { background: #0F172A; }
        :root[data-theme="dark"] .blog-toc,
        :root[data-theme="dark"] .step-item,
        :root[data-theme="dark"] details.faq-item,
        :root[data-theme="dark"] .blog-author { background: #1E293B; border-color: #334155; }
        :root[data-theme="dark"] .blog-h2 { color: #E2E8F0; }
        :root[data-theme="dark"] .blog-p { color: #CBD5E1; }
      `}</style>

      <div className="blog-page">
        {/* Hero */}
        <div className="blog-hero">
          <div className="blog-hero-inner">
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">Cost &amp; Pricing</span>
              <span className="blog-meta">September 8, 2026 · 6 min read</span>
            </div>
            <h1 className="blog-h1">How Much Does a Passport Photo Cost in 2026? Honest Price Guide</h1>
            <p className="blog-lead">Prices range from $0.99 to $19.99. Before you drive to Walgreens or CVS, read this guide to understand exactly what you&apos;re paying for — and where to get the best value without risking rejection.</p>
            <div className="blog-stats">
              <div className="blog-stat"><div className="blog-stat-val accent">$0.99</div><div className="blog-stat-label">AI Service</div></div>
              <div className="blog-stat"><div className="blog-stat-val">$14.99</div><div className="blog-stat-label">CVS Studio</div></div>
              <div className="blog-stat"><div className="blog-stat-val">$16.99</div><div className="blog-stat-label">Walgreens</div></div>
              <div className="blog-stat"><div className="blog-stat-val">$19.99</div><div className="blog-stat-label">UPS Store</div></div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="blog-body">

          {/* TOC */}
          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>Quick answer: what does a passport photo cost in 2026?</li>
              <li>Full comparison — all providers side by side</li>
              <li>CVS passport photo cost</li>
              <li>Walgreens passport photo cost</li>
              <li>UPS Store and FedEx passport photo cost</li>
              <li>AI passport photo services — the cheapest compliant option</li>
              <li>Hidden costs nobody tells you about</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          {/* Section 1 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">Quick Answer: What Does a Passport Photo Cost in 2026?</h2>
            </div>
            <p className="blog-p">In 2026, a standard US passport photo (2×2 inches, white background, ICAO-compliant) costs between <strong>$0.99 and $19.99</strong> depending on where you go. AI-powered services are the most affordable option and just as compliant as studio photos. In-store studios at CVS and Walgreens charge $14–17 and typically require a 10–30 minute wait.</p>
            <div className="callout tip">
              <div className="callout-label">TIP</div>
              <p>If your priority is speed and price, an AI passport photo service like Express Passport Photo gives you a government-compliant photo in 30 seconds for $0.99 — with CVS pickup available if you want a physical print.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">Full Comparison — All Providers Side by Side</h2>
            </div>
            <div className="blog-table-wrap">
              <table className="blog-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Price</th>
                    <th>Wait Time</th>
                    <th className="hidden sm:table-cell">Compliance Check</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((row) => (
                    <tr key={row.name} className={row.highlight ? 'best' : ''}>
                      <td style={{fontWeight: 600, color: '#1B3A6B'}}>
                        {row.name}
                        {row.highlight && <span className="blog-best-badge">Best Value</span>}
                      </td>
                      <td className={`price${row.highlight ? ' accent' : ''}`}>{row.price}</td>
                      <td>{row.wait}</td>
                      <td className="hidden sm:table-cell" style={{color: '#6B7280'}}>{row.check}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="blog-table-note">Prices current as of September 2026. In-store prices may vary by location.</p>
          </div>

          {/* Section 3 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">CVS Passport Photo Cost</h2>
            </div>
            <p className="blog-p">CVS charges <strong>$14.99</strong> for a passport photo in 2026. This includes two printed 2×2 inch photos. Most CVS locations offer passport photo services during pharmacy hours, but not all locations have a dedicated photo studio — call ahead to confirm.</p>
            <p className="blog-p">With Express Passport Photo, you can order a digital file for $0.99 and send it directly to your nearest CVS for printing the same day. This gives you the CVS pickup convenience at a fraction of the studio price.</p>
          </div>

          {/* Section 4 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">4</div>
              <h2 className="blog-h2">Walgreens Passport Photo Cost</h2>
            </div>
            <p className="blog-p">Walgreens charges <strong>$16.99</strong> for a passport photo in 2026. Like CVS, this includes two printed photos. Walgreens photo studios are available at most locations but wait times can vary significantly — up to 45 minutes during busy periods.</p>
            <p className="blog-p">Walgreens also offers an online photo service, but you still need to upload a compliant photo yourself. Using an AI service to create the compliant photo first, then sending it to Walgreens for printing, is a faster and cheaper combined approach.</p>
          </div>

          {/* Section 5 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">UPS Store and FedEx Passport Photo Cost</h2>
            </div>
            <p className="blog-p">UPS Store charges <strong>$19.99</strong> and FedEx Office charges <strong>$17.99</strong> for passport photos in 2026. These are the most expensive options on the list. The only advantage is that most locations are open longer hours than pharmacy photo studios, and the wait is usually shorter.</p>
            <p className="blog-p">However, at $19.99 for two printed photos, UPS Store is the most expensive way to get a passport photo — and compliance is still not guaranteed.</p>
          </div>

          {/* Section 6 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">6</div>
              <h2 className="blog-h2">AI Passport Photo Services — The Cheapest Compliant Option</h2>
            </div>
            <p className="blog-p">AI passport photo services like Express Passport Photo have become the fastest-growing option in 2026. Here is how the process works:</p>
            <div className="steps">
              {[
                'You upload a selfie from your phone — any background, any lighting',
                'The AI removes the background and replaces it with the required white background',
                'The AI checks head position, eye openness, face centering, and lighting automatically',
                'You download a government-compliant photo in 30 seconds',
                'You can send the file to CVS or Walgreens for printing, or use the digital file for an online application',
              ].map((text, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div className="step-body">{text}</div>
                </div>
              ))}
            </div>
            <div className="callout success" style={{marginTop: 24}}>
              <div className="callout-label">Guarantee</div>
              <p><strong>Express Passport Photo charges $0.99</strong> for a digital download. The photo comes with a 100% acceptance guarantee — if it gets rejected, you get a full refund. No questions asked.</p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">7</div>
              <h2 className="blog-h2">Hidden Costs Nobody Tells You About</h2>
            </div>
            <p className="blog-p">Before choosing based on price alone, consider these hidden costs of in-store passport photo services:</p>
            <div className="risk-list">
              {[
                'Driving time and gas — a 20-minute round trip adds real cost',
                'Wait time — 10–45 minutes at a studio, vs 30 seconds at home',
                'Rejection risk — if the studio photo does not meet government specs, you pay again',
                'Reprint fees — some studios charge for a retake if the first attempt fails',
                'Parking — at busy pharmacy locations this is often paid',
              ].map((item) => (
                <div key={item} className="risk-item">
                  <div className="risk-icon">
                    <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="callout warning" style={{marginTop: 20}}>
              <div className="callout-label">Bottom line</div>
              <p>When you factor in time and travel, an AI service at $0.99 is not just cheaper — it saves 45 minutes to an hour of your day.</p>
            </div>
          </div>

          {/* Section 8 — FAQ */}
          <hr className="blog-divider"/>
          <div className="blog-section">
            <h2 className="blog-h2" style={{marginBottom: 8}}>8. Frequently Asked Questions</h2>
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

          {/* Author */}
          <div className="blog-author">
            <div className="blog-author-label">Written by</div>
            <div className="blog-author-name">The Express Passport Photo Team</div>
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. Our AI is trained on US government passport photo specifications and ICAO international standards. We wrote this pricing guide to help travelers make an informed decision before spending $15–20 at a studio.</div>
          </div>

          {/* CTA */}
          <div className="blog-cta">
            <h2>Get your passport photo for $0.99</h2>
            <p>ICAO-compliant. AI-verified. Ready in 30 seconds. Money-back guarantee.</p>
            <Link href="/upload" className="blog-cta-btn">
              Get started — $0.99
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
