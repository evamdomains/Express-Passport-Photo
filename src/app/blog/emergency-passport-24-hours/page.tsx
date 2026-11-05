import type { Metadata } from 'next';
import Link from 'next/link';

const CANONICAL = 'https://expresspassportphoto.com/blog/emergency-passport-24-hours';

export const metadata: Metadata = {
  title: 'How to Get an Emergency Passport in 24 Hours (2026 Guide)',
  description: 'Need a passport today or tomorrow? Here is exactly how to get an emergency US passport appointment, what documents to bring, how much it costs, and how to get a compliant passport photo the same day.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'How to Get an Emergency Passport in 24 Hours (2026 Guide)',
    description: 'Emergency passport appointments are available for life-or-death emergencies and urgent travel within 72 hours. Here is what you actually need — step by step.',
    url: CANONICAL,
    siteName: 'Express Passport Photo',
    type: 'article',
    publishedTime: '2026-11-06',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emergency Passport in 24 Hours: What You Actually Need',
    description: 'Life-or-death emergency or travel within 72 hours? Here is how to get a same-day passport appointment and what to bring.',
  },
};

const FAQ = [
  {
    q: 'Can I walk into a passport agency without an appointment?',
    a: 'No. All 26 US passport agencies require an appointment. You cannot walk in. Call 1-877-487-2778 to book, or use the online scheduling system at travel.state.gov. Appointments are limited — call as early as possible, even if it means calling before the agency opens.',
  },
  {
    q: 'What counts as a "life-or-death" emergency for a same-day passport?',
    a: 'The State Department defines a life-or-death emergency as a death, serious illness, or serious injury of an immediate family member (spouse, child, parent, sibling, or grandparent). You must provide supporting documentation — a death certificate, hospital letter, or doctor\'s letter on official letterhead — explaining the nature of the emergency and why international travel is required immediately.',
  },
  {
    q: 'What if I don\'t have an emergency but need to travel in 3 days?',
    a: 'If your travel is within 72 hours, you qualify for an urgent appointment even without a life-or-death emergency. You will need to prove your departure date with a flight itinerary or ticket. This is the most common type of emergency passport appointment and is available at all 26 regional agencies.',
  },
  {
    q: 'How much does an emergency passport cost in 2026?',
    a: 'An emergency or expedited passport costs $230 total: a $130 application fee plus a $60 expedite fee. If you are applying for the first time and need a passport book, that is the standard cost. There is no extra charge for getting it same-day at a passport agency — the $60 expedite fee covers it. Travel document fees (like a visa) are separate.',
  },
  {
    q: 'Can I get a passport photo at the passport agency?',
    a: 'Most passport agencies do not take photos on-site. You must bring two identical 2×2 inch photos with you to the appointment. The easiest option is to use an AI passport photo service like Express Passport Photo (upload, download in 30 seconds, print at any CVS or Walgreens near the agency) the morning of your appointment.',
  },
  {
    q: 'What if I need to travel internationally in less than 24 hours?',
    a: 'Call 1-877-487-2778 immediately — this is the National Passport Information Center, available Monday–Friday 8am–10pm ET and Saturday 10am–3pm ET. Explain your situation. For extreme last-minute cases, they may be able to fit you into a same-day cancellation slot. You will still need all required documents including photos, so prepare everything before you call.',
  },
  {
    q: 'Will my old expired passport work as proof of identity?',
    a: 'Yes. An expired US passport is accepted as primary evidence of citizenship at a passport agency, as long as it is undamaged and you can present it. You still need a government-issued photo ID. If your passport is damaged, you will also need to submit a DS-64 form declaring the damaged document.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'How to Get an Emergency Passport in 24 Hours (2026 Guide)',
      description: 'Need a passport today or tomorrow? Here is exactly how to get an emergency US passport appointment, what documents to bring, how much it costs, and how to get a compliant passport photo the same day.',
      datePublished: '2026-11-06',
      dateModified: '2026-11-06',
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
        { '@type': 'ListItem', position: 3, name: 'Emergency Passport in 24 Hours', item: CANONICAL },
      ],
    },
  ],
};

export default function EmergencyPassportPage() {
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
        .blog-h1 { font-family: var(--font-inter), system-ui, sans-serif; font-size: clamp(26px, 4.5vw, 40px); font-weight: 800; line-height: 1.2; color: #fff; margin: 0 0 18px; text-wrap: balance; }
        .blog-lead { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.8); margin: 0; max-width: 620px; }

        .stat-tiles { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 32px; }
        @media (max-width: 600px) { .stat-tiles { grid-template-columns: repeat(2,1fr); } }
        .stat-tile { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 14px 16px; }
        .stat-val { font-size: 22px; font-weight: 800; color: #fff; line-height: 1; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; line-height: 1.3; }

        .blog-body { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

        .urgent-banner { background: #FFF1F2; border: 1.5px solid #FECDD3; border-radius: 14px; padding: 18px 22px; margin: 32px 0; display: flex; gap: 14px; align-items: flex-start; }
        .urgent-icon { flex-shrink: 0; width: 36px; height: 36px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .urgent-title { font-size: 14px; font-weight: 800; color: #E11D48; margin-bottom: 4px; }
        .urgent-body { font-size: 14px; color: #4B5563; line-height: 1.6; }
        .urgent-phone { font-weight: 700; color: #E11D48; }

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

        .qualifier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        @media (max-width: 540px) { .qualifier-grid { grid-template-columns: 1fr; } }
        .qualifier-card { border-radius: 12px; padding: 16px 18px; }
        .qualifier-card.yes { background: #F0FDF4; border: 1px solid #BBF7D0; }
        .qualifier-card.no { background: #FFF1F2; border: 1px solid #FECDD3; }
        .qualifier-label { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
        .qualifier-card.yes .qualifier-label { color: #16A34A; }
        .qualifier-card.no .qualifier-label { color: #E11D48; }
        .qualifier-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #374151; line-height: 1.5; padding: 3px 0; }

        .agency-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .agency-table th { background: #F8FAFC; font-weight: 700; color: #1B3A6B; padding: 10px 14px; text-align: left; border-bottom: 2px solid #E2E8F0; font-size: 12px; letter-spacing: 0.04em; }
        .agency-table td { padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #374151; vertical-align: top; line-height: 1.5; }
        .agency-table tr:last-child td { border-bottom: none; }
        .agency-table tr:hover td { background: #F8FAFC; }
        .table-wrap { overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 12px; }

        .steps { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; }
        .step-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
        .step-n { flex-shrink: 0; width: 28px; height: 28px; background: #1B3A6B; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 1px; }
        .step-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 4px; }
        .step-body { font-size: 14px; line-height: 1.6; color: #4B5563; }

        .doc-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        @media (max-width: 540px) { .doc-list { grid-template-columns: 1fr; } }
        .doc-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; }
        .doc-check { flex-shrink: 0; width: 18px; height: 18px; background: #DCFCE7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
        .doc-check svg { width: 10px; height: 10px; stroke: #16A34A; stroke-width: 3; }
        .doc-name { font-size: 13px; font-weight: 700; color: #1B3A6B; }
        .doc-note { font-size: 12px; color: #6B7280; margin-top: 2px; line-height: 1.4; }

        .timeline { display: flex; flex-direction: column; gap: 0; margin: 20px 0; position: relative; }
        .timeline-item { display: flex; gap: 16px; padding-bottom: 20px; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 32px; }
        .timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: #2563EB; border: 2px solid #fff; box-shadow: 0 0 0 2px #2563EB; flex-shrink: 0; margin-top: 4px; }
        .timeline-line { flex: 1; width: 2px; background: #E2E8F0; margin-top: 4px; }
        .timeline-item:last-child .timeline-line { display: none; }
        .timeline-content { flex: 1; }
        .timeline-time { font-size: 11px; font-weight: 800; color: #2563EB; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
        .timeline-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 3px; }
        .timeline-body { font-size: 13px; color: #6B7280; line-height: 1.55; }

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
                <li style={{color:'rgba(255,255,255,0.8)',fontWeight:500}}>Emergency Passport</li>
              </ol>
            </nav>
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">Urgent Travel</span>
              <span className="blog-meta">November 6, 2026 · 8 min read</span>
            </div>
            <h1 className="blog-h1">How to Get an Emergency Passport in 24 Hours (2026 Guide)</h1>
            <p className="blog-lead">Emergency passport appointments are real — but only if you qualify and know exactly how to get one. Here is what actually works, what documents you must bring, and how to get a compliant photo the same morning.</p>
            <div className="stat-tiles">
              {[
                { val: '26', label: 'Regional agencies nationwide' },
                { val: '72 hrs', label: 'Max travel window to qualify' },
                { val: '$230', label: 'Emergency passport total cost' },
                { val: '30 sec', label: 'Passport photo — Express AI' },
              ].map(s => (
                <div key={s.val} className="stat-tile">
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="blog-body">

          <div className="urgent-banner">
            <div className="urgent-icon">
              <svg width="18" height="18" fill="none" stroke="#E11D48" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            </div>
            <div>
              <div className="urgent-title">Need a passport right now?</div>
              <div className="urgent-body">Call the National Passport Information Center: <span className="urgent-phone">1-877-487-2778</span> — open Mon–Fri 8am–10pm ET, Sat 10am–3pm ET. Have your travel date and reason ready before you call.</div>
            </div>
          </div>

          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>Do you qualify for an emergency passport?</li>
              <li>The 26 regional passport agencies</li>
              <li>Step-by-step: how to get an emergency passport</li>
              <li>Documents you must bring to your appointment</li>
              <li>Getting a compliant passport photo the same day</li>
              <li>Emergency passport timeline: what to expect</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          {/* Section 1 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">Do You Qualify for an Emergency Passport?</h2>
            </div>
            <p className="blog-p">Not everyone can get a same-day passport. The State Department has two tiers of urgency — and knowing which one applies to you determines what appointment you can get and what documentation you need to bring.</p>
            <div className="qualifier-grid">
              <div className="qualifier-card yes">
                <div className="qualifier-label">✓ You qualify — urgent travel</div>
                {[
                  'Flight departs within 72 hours',
                  'International travel for work emergency',
                  'Cruise departure within 72 hours',
                  'Connecting through international airport',
                ].map(item => (
                  <div key={item} className="qualifier-item">
                    <svg width="14" height="14" fill="none" stroke="#16A34A" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:2}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
              <div className="qualifier-card yes">
                <div className="qualifier-label">✓ You qualify — life or death</div>
                {[
                  'Death of immediate family member abroad',
                  'Serious illness of immediate family member',
                  'Serious injury requiring travel today',
                  'Medical emergency overseas',
                ].map(item => (
                  <div key={item} className="qualifier-item">
                    <svg width="14" height="14" fill="none" stroke="#16A34A" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:2}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="callout warning">
              <div className="callout-label">Important</div>
              <p>Vacation, tourism, and non-urgent travel do not qualify — even if you book a flight tomorrow. Emergency and urgent appointments are reserved for genuine emergencies. Attempting to book one without valid documentation will result in a denied appointment.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">The 26 Regional Passport Agencies</h2>
            </div>
            <p className="blog-p">Emergency and urgent passport appointments are only available at one of the 26 regional passport agencies. These are different from the thousands of passport acceptance facilities (post offices, CVS locations, etc.) — only regional agencies can issue a passport the same day or next day.</p>
            <div className="table-wrap">
              <table className="agency-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Agency Name</th>
                    <th>Serves</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Atlanta, GA', 'Atlanta Passport Agency', 'AL, FL, GA, MS, SC, TN'],
                    ['Boston, MA', 'Boston Passport Agency', 'CT, MA, ME, NH, RI, VT'],
                    ['Chicago, IL', 'Chicago Passport Agency', 'IL, IN, MI, WI'],
                    ['Dallas, TX', 'Dallas Passport Agency', 'AR, LA, NM, OK, TX'],
                    ['Denver, CO', 'Denver Passport Agency', 'CO, KS, MT, NE, ND, SD, UT, WY'],
                    ['Detroit, MI', 'Detroit Passport Agency', 'MI (additional)'],
                    ['El Paso, TX', 'El Paso Passport Agency', 'TX border region'],
                    ['Honolulu, HI', 'Honolulu Passport Agency', 'HI, Pacific Islands'],
                    ['Houston, TX', 'Houston Passport Agency', 'Gulf Coast region'],
                    ['Las Vegas, NV', 'Las Vegas Passport Agency', 'NV, UT (southern)'],
                    ['Los Angeles, CA', 'Los Angeles Passport Agency', 'Southern CA, NV'],
                    ['Miami, FL', 'Miami Passport Agency', 'South FL, Caribbean travel'],
                    ['Minneapolis, MN', 'Minneapolis Passport Agency', 'IA, MN, MO, ND, SD, WI'],
                    ['New Orleans, LA', 'New Orleans Passport Agency', 'Gulf Coast states'],
                    ['New York, NY', 'New York Passport Agency', 'NY, NJ, CT, PA'],
                    ['Philadelphia, PA', 'Philadelphia Passport Agency', 'PA, DE, MD, NJ'],
                    ['Phoenix, AZ', 'Phoenix Passport Agency', 'AZ, NM'],
                    ['San Diego, CA', 'San Diego Passport Agency', 'Southern CA border region'],
                    ['San Francisco, CA', 'San Francisco Passport Agency', 'Northern CA, NV, OR'],
                    ['Seattle, WA', 'Seattle Passport Agency', 'AK, ID, OR, WA'],
                    ['Washington, DC', 'DC Passport Agency', 'DC, MD, VA, WV'],
                  ].map(([city, name, serves]) => (
                    <tr key={city}>
                      <td style={{fontWeight:600,color:'#1B3A6B'}}>{city}</td>
                      <td>{name}</td>
                      <td style={{color:'#6B7280',fontSize:13}}>{serves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="callout tip">
              <div className="callout-label">Tip</div>
              <p>You do not have to use the agency that serves your state. You can book at any of the 26 agencies — whichever has the soonest availability. If the Atlanta agency is booked, check Dallas or Miami.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">Step-by-Step: How to Get an Emergency Passport</h2>
            </div>
            <div className="steps">
              {[
                {
                  title: 'Call 1-877-487-2778 immediately',
                  body: 'This is the National Passport Information Center. It is the only way to book an emergency or urgent appointment. Have your travel date, travel destination, and reason for travel ready. Be prepared to wait on hold — call during off-peak hours (early morning or evening) for shorter wait times.',
                },
                {
                  title: 'Gather your documents before the appointment',
                  body: 'You need to show up with everything complete. Missing a single document means you leave without a passport. See Section 4 for the full checklist.',
                },
                {
                  title: 'Get your passport photos the morning of your appointment',
                  body: 'Most agencies do not take photos on-site. Bring two identical 2×2 inch printed photos. Upload to Express Passport Photo the morning of your appointment, download in 30 seconds, and print at any CVS or Walgreens near the agency.',
                },
                {
                  title: 'Complete Form DS-11 or DS-82',
                  body: 'First-time applicants or those renewing after 15+ years or under 16 use DS-11. Those renewing an adult passport (issued after age 16, within the last 15 years) use DS-82. Download from travel.state.gov. Do not sign DS-11 before arriving — sign it in front of the agent.',
                },
                {
                  title: 'Arrive at the agency early with everything',
                  body: 'Arrive 15–30 minutes before your appointment. Bring originals of all documents — not photocopies alone. The agent will review your documents, collect your fees, and process your application. For same-day service, your passport may be ready within hours.',
                },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div>
                    <div className="step-title">{s.title}</div>
                    <div className="step-body">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">4</div>
              <h2 className="blog-h2">Documents You Must Bring to Your Appointment</h2>
            </div>
            <p className="blog-p">Missing any document means your appointment cannot proceed. Prepare all of these the night before — do not leave it to the morning.</p>
            <div className="doc-list">
              {[
                { name: 'Completed DS-11 or DS-82 form', note: 'Unsigned — sign in front of the passport agent (DS-11 only)' },
                { name: 'Proof of US citizenship', note: 'Birth certificate (certified copy), naturalization certificate, or previous US passport' },
                { name: 'Government-issued photo ID', note: "Driver's license, state ID, or military ID — must be current/valid" },
                { name: 'Photocopy of ID (front and back)', note: 'Bring a copy even if you have the original' },
                { name: '2 passport photos (2×2 inches)', note: 'Identical, taken within 6 months — white background, eyes open' },
                { name: 'Proof of travel', note: 'Flight itinerary, ticket, or booking confirmation showing departure within 72 hours' },
                { name: 'Application fee payment', note: '$130 application + $60 expedite fee = $190 by check/money order; some accept credit card' },
                { name: 'Emergency documentation (if applicable)', note: 'Death certificate, hospital letter, or doctor letter for life-or-death emergencies' },
                { name: 'Previous passport (if renewing)', note: 'Submit the old passport — it will be cancelled and returned to you' },
                { name: 'Name change documentation', note: 'Marriage certificate or court order if your name has changed since your last passport' },
              ].map(doc => (
                <div key={doc.name} className="doc-item">
                  <div className="doc-check">
                    <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-note">{doc.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="callout danger">
              <div className="callout-label">Common mistake</div>
              <p>Many people bring photocopies of their birth certificate but not the <strong>certified copy</strong> (the one with a raised seal or colored security paper). A regular photocopy of a birth certificate is not accepted. If you do not have your certified birth certificate, contact your state&apos;s vital records office — some states offer same-day or next-day processing.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">Getting a Compliant Passport Photo the Same Day</h2>
            </div>
            <p className="blog-p">Passport agencies do not take photos. You must bring two identical printed 2×2 inch photos that meet all government requirements. On the morning of an emergency appointment, the fastest way to get a compliant photo is:</p>
            <div className="steps">
              {[
                { title: 'Take the photo at home with your phone', body: 'Plain white wall, eyes open, face centered, no glasses. Use the rear camera in good natural light. Take 10–15 shots and pick the clearest one.' },
                { title: 'Upload to Express Passport Photo', body: 'AI removes the background, corrects the crop to 2×2 inches, verifies compliance, and delivers a print-ready file in 30 seconds. $0.99.' },
                { title: 'Print at CVS or Walgreens near the agency', body: "Open the email or link on your phone, go to any CVS or Walgreens, use the photo kiosk to print the 4×6 file. 2 passport photos print in one 4×6 print — costs $1–3. Ready in minutes. Many CVS locations open at 7am." },
              ].map((s, i) => (
                <div key={i} className="step-item">
                  <div className="step-n">{i + 1}</div>
                  <div>
                    <div className="step-title">{s.title}</div>
                    <div className="step-body">{s.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="callout success">
              <div className="callout-label">Total time</div>
              <p>Under 15 minutes from taking the photo to having two printed photos in hand. The whole process — upload, compliance check, download, print — takes less time than driving to a studio that may not be open yet.</p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">6</div>
              <h2 className="blog-h2">Emergency Passport Timeline: What to Expect</h2>
            </div>
            <p className="blog-p">Here is what a typical emergency passport appointment day looks like from start to finish.</p>
            <div className="timeline">
              {[
                { time: 'Night before', title: 'Gather all documents', body: 'Collect your birth certificate, ID, completed DS form, proof of travel, and payment. Set everything in one folder.' },
                { time: 'Morning of — 7:00 am', title: 'Get your passport photo', body: 'Take a photo at home, upload to Express Passport Photo, download the file, and print at the nearest CVS or Walgreens. Have 2 printed photos in hand before 7:30am.' },
                { time: 'Morning of — before appointment', title: 'Review your documents one more time', body: 'DS form complete? ID valid? Certified birth certificate present? Two photos? Payment ready? Flight itinerary or ticket printed or on your phone?' },
                { time: 'At the agency', title: 'Sign DS-11 in front of the agent (if applicable)', body: 'Do not sign DS-11 before arriving. The agent will review your documents, witness your signature, collect your fees, and process your application.' },
                { time: 'Same day — 2–4 hours later', title: 'Pick up your passport', body: 'For same-day service at a passport agency, your passport is typically ready the same afternoon. The agent will tell you the pickup time when you submit.' },
                { time: 'Same day — evening', title: 'Verify everything before you fly', body: 'Check that your name, date of birth, and passport number are correct. Keep the passport in your carry-on — never checked luggage.' },
              ].map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-left">
                    <div className="timeline-dot" />
                    <div className="timeline-line" />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-body">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <hr className="blog-divider"/>
          <div className="blog-section">
            <h2 className="blog-h2" style={{marginBottom:8}}>7. Frequently Asked Questions</h2>
            <div className="faq-list">
              {FAQ.map(item => (
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

          <div className="related-links">
            <div className="related-links-title">Related guides</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { href:'/blog/how-to-take-passport-photo-at-home', label:'How to Take a Passport Photo at Home' },
                { href:'/blog/passport-photo-cost-2026', label:'How Much Does a Passport Photo Cost in 2026?' },
                { href:'/blog/passport-photo-rejected', label:'What Happens If Your Passport Photo Gets Rejected?' },
                { href:'/blog/how-to-renew-us-passport-2026', label:'How to Renew a US Passport in 2026' },
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
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. Every photo is verified against State Department requirements before you download — so your photo passes the first time, even when time is short.</div>
          </div>

          <div className="blog-cta">
            <h2>Need a passport photo right now?</h2>
            <p>Upload a selfie. AI verifies compliance and delivers a print-ready file in 30 seconds. $0.99 — print at any CVS or Walgreens this morning.</p>
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
