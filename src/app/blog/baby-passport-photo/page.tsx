import type { Metadata } from 'next';
import Link from 'next/link';

const CANONICAL = 'https://expresspassportphoto.com/blog/baby-passport-photo';

export const metadata: Metadata = {
  title: 'Baby Passport Photo Requirements 2026: How to Get One That Passes',
  description: 'Baby passport photos must meet the exact same US government requirements as adult photos. Here is how to take a compliant photo of a newborn or infant at home — and avoid the most common rejection reasons.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Baby Passport Photo Requirements 2026: How to Get One That Passes',
    description: 'Babies need passport photos too — and the requirements are identical to adults. Here is the setup that works for newborns, and how AI makes the technical parts automatic.',
    url: CANONICAL,
    siteName: 'Express Passport Photo',
    type: 'article',
    publishedTime: '2026-10-30',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baby Passport Photo: How to Get One That Passes',
    description: 'White background, eyes open, no parent in frame. Here is how to get a government-compliant photo of a newborn in under 10 minutes.',
  },
};

const FAQ = [
  { q: 'Can a parent\'s hands be visible in a baby\'s passport photo?', a: 'No. The State Department requires that no other person appear in the photo — including hands, arms, or any part of a parent or guardian. Lay the baby on a flat surface instead of holding them. If hands are accidentally in frame, the photo will be rejected.' },
  { q: 'Does my baby\'s eyes need to be open in the passport photo?', a: 'Yes. The eyes must be open and visible, looking toward the camera. This is one of the most common rejection reasons for infant photos. Take 20 or more shots and choose the frame with the clearest, most open eyes.' },
  { q: 'What if my baby is too young to hold their head up?', a: 'Use the laying-down method. Place the baby on a flat white surface — a white bedsheet or foam board works perfectly. The camera shoots from above (or at a slight angle). The baby does not need to hold their head up, and the background is automatically white.' },
  { q: 'Can I use a car seat for the baby\'s passport photo?', a: 'No. Car seats are almost always gray or beige, which does not meet the plain white background requirement. The State Department will reject any photo where the background is not plain white with no visible pattern or color.' },
  { q: 'How long is a baby\'s US passport valid?', a: 'A US passport issued to a child under 16 is valid for 5 years (not 10 years like adult passports). You will need to apply for a new passport with a new photo when it expires. Both parents or guardians must consent and typically must appear in person for minor passport applications.' },
  { q: 'Can I take a baby passport photo myself at home?', a: 'Yes. You do not need a studio. Lay the baby on a white surface, use natural window light (no flash), and take photos from above with your phone camera. Upload the best shot to Express Passport Photo — AI removes the background, corrects the crop, and verifies all requirements automatically. The whole process takes under 10 minutes.' },
  { q: 'What expression is required for a baby passport photo?', a: 'The photo should show a neutral expression or natural smile — whatever the baby naturally does. Unlike adults, babies are not expected to maintain a strict neutral expression. The key requirements are eyes open, mouth closed or slightly open naturally, and face clearly visible.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Baby Passport Photo Requirements 2026: How to Get One That Passes',
      description: 'Baby passport photos must meet the exact same US government requirements as adult photos. Here is how to take a compliant photo of a newborn or infant at home.',
      datePublished: '2026-10-30',
      dateModified: '2026-10-30',
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
        { '@type': 'ListItem', position: 3, name: 'Baby Passport Photo', item: CANONICAL },
      ],
    },
  ],
};

export default function BabyPassportPhotoPage() {
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

        .req-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin: 20px 0; }
        @media (max-width: 560px) { .req-grid { grid-template-columns: 1fr; } }
        .req-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; }
        .req-icon { font-size: 18px; margin-bottom: 6px; }
        .req-label { font-size: 13px; font-weight: 700; color: #1B3A6B; margin-bottom: 3px; }
        .req-desc { font-size: 12px; color: #6B7280; line-height: 1.5; }

        .steps { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; }
        .step-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
        .step-n { flex-shrink: 0; width: 28px; height: 28px; background: #1B3A6B; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 1px; }
        .step-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 4px; }
        .step-body { font-size: 14px; line-height: 1.6; color: #4B5563; }

        .age-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 20px 0; }
        @media (max-width: 600px) { .age-grid { grid-template-columns: 1fr; } }
        .age-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
        .age-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563EB; margin-bottom: 8px; }
        .age-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 6px; }
        .age-tips { font-size: 13px; color: #4B5563; line-height: 1.6; }

        .rejection-list { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
        .rejection-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
        .rejection-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .rejection-x { flex-shrink: 0; width: 22px; height: 22px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .rejection-x svg { width: 10px; height: 10px; stroke: #EF4444; stroke-width: 3; }
        .rejection-reason { font-size: 14px; font-weight: 700; color: #1B3A6B; }
        .rejection-fix { padding: 0 16px 14px 50px; font-size: 13px; color: #6B7280; line-height: 1.55; }
        .rejection-fix-label { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #16A34A; margin-right: 6px; }

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
                <li style={{color:'rgba(255,255,255,0.8)',fontWeight:500}}>Baby Passport Photo</li>
              </ol>
            </nav>
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">Family Travel</span>
              <span className="blog-meta">October 30, 2026 · 7 min read</span>
            </div>
            <h1 className="blog-h1">Baby Passport Photo Requirements 2026: How to Get One That Passes (Every Time)</h1>
            <p className="blog-lead">Babies need passports too — and the government holds their photos to the exact same standards as adults. Here is the setup that works for newborns and infants, and how to avoid the rejection reasons that trip most parents up.</p>
            <div className="stat-tiles">
              {[
                { val: '5 yrs', label: 'Infant passport validity' },
                { val: '10 min', label: 'Typical home photo session' },
                { val: '$0.99', label: 'AI compliance check' },
                { val: '100%', label: 'Acceptance guarantee' },
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
          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>US passport photo requirements for babies</li>
              <li>The laying-down method (best for newborns)</li>
              <li>Step-by-step: how to take the photo at home</li>
              <li>Tips by age: newborn, 3–6 months, 6 months+</li>
              <li>The 6 most common rejection reasons for baby photos</li>
              <li>How AI makes baby passport photos easier</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          {/* Section 1 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">US Passport Photo Requirements for Babies</h2>
            </div>
            <p className="blog-p">The US State Department does not have a separate set of rules for infant passport photos. A baby&apos;s photo must meet every requirement that an adult photo must meet. The only difference is in how you physically get the shot — not what the photo must show.</p>
            <div className="req-grid">
              {[
                { icon: '📐', label: '2×2 inches', desc: 'Standard US passport photo size — same as adult photos' },
                { icon: '⬜', label: 'Plain white background', desc: 'No shadows, patterns, or color behind the baby' },
                { icon: '👁️', label: 'Eyes open and visible', desc: 'Looking toward the camera, not at an angle' },
                { icon: '🚫', label: 'No other person in frame', desc: 'No hands, arms, or clothing of a parent or holder' },
                { icon: '😐', label: 'Natural expression', desc: 'Neutral or natural smile — babies aren\'t held to strict neutrality' },
                { icon: '💡', label: 'Even lighting', desc: 'No harsh shadows on face or background from flash or overhead lights' },
                { icon: '📷', label: 'High resolution', desc: 'Crisp and in focus — no blurry prints accepted' },
                { icon: '📅', label: 'Taken within 6 months', desc: 'Babies change quickly — the photo must be recent' },
              ].map(r => (
                <div key={r.label} className="req-card">
                  <div className="req-icon">{r.icon}</div>
                  <div className="req-label">{r.label}</div>
                  <div className="req-desc">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="callout warning">
              <div className="callout-label">Important</div>
              <p>A baby passport is valid for only <strong>5 years</strong>, not the standard 10 years for adults. Both parents or legal guardians must consent to the passport application — minor passports cannot be issued with only one parent present in most circumstances.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">The Laying-Down Method (Best for Newborns)</h2>
            </div>
            <p className="blog-p">The most reliable way to photograph a newborn or young infant is to lay them flat on a white surface and shoot from above. This solves the three biggest problems: the baby doesn&apos;t need to hold their head up, the background is automatically white, and no parent needs to hold them — meaning no hands appear in frame.</p>
            <div className="callout tip">
              <div className="callout-label">The setup</div>
              <p><strong>White surface:</strong> a white fitted bedsheet or white foam board. <strong>Light source:</strong> soft natural window light from the side — not overhead, not flash. <strong>Camera position:</strong> directly above or at a slight forward angle. <strong>Distance:</strong> 2–3 feet from the baby. Use your phone&apos;s rear camera, not the front-facing selfie camera.</p>
            </div>
            <p className="blog-p">The laying-down method works for babies up to about 4–5 months. Once your baby can sit up on their own with a stable head, you can switch to propping them upright against a white wall or white foam board — the same approach used for adult at-home passport photos.</p>
          </div>

          {/* Section 3 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">Step-by-Step: How to Take the Photo at Home</h2>
            </div>
            <div className="steps">
              {[
                { title: 'Set up a white surface', body: 'Lay a white bedsheet flat on the floor or a bed. A white foam board from a craft store works even better — it stays flat, doesn\'t wrinkle, and gives a consistent background. Avoid off-white, cream, or patterned surfaces.' },
                { title: 'Choose the right light', body: 'Natural window light is ideal. Place the baby near a window with indirect daylight — not in direct sunlight (too harsh, causes shadows). If using a lamp, position it to the side rather than directly above. Never use camera flash: it blows out the baby\'s face and can create red-eye.' },
                { title: 'Position the baby', body: 'Lay the baby on their back on the white surface. Make sure their head, face, and a small amount of shoulder are visible. Their face should be centered in the frame. Check that no hands, feet, or pillows are visible at the edges of the shot.' },
                { title: 'Get their attention and take many shots', body: 'To get the baby to look toward the camera, make a sound above the lens — a gentle coo, a soft noise, or have someone stand behind you and make eye contact with the baby. Take at least 20–30 photos in quick succession. Babies blink, look away, and shift constantly. You only need one good frame.' },
                { title: 'Check the best shot before uploading', body: 'Look for: eyes open and visible, face centered, no hands in frame, white background visible, photo is in focus. A slightly imperfect photo (minor head tilt) is fixable by AI. A photo with a parent\'s hand in frame is not.' },
                { title: 'Upload to Express Passport Photo', body: 'Upload your best shot. The AI removes the background, corrects the crop to exactly 2×2 inches, verifies head size (70–80% of frame), checks lighting balance, and confirms resolution. Your compliant photo is ready to download in 30 seconds.' },
                { title: 'Print and submit', body: 'Send the file to CVS or Walgreens for same-day printing ($1–3). The printed photo is your baby\'s passport photo — attach it to the DS-11 application form and submit at a passport acceptance facility.' },
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
              <h2 className="blog-h2">Tips by Age: Newborn, 3–6 Months, 6 Months+</h2>
            </div>
            <p className="blog-p">Each age group presents different challenges. Here is what works best at each stage.</p>
            <div className="age-grid">
              {[
                { label: 'Newborn — 0 to 3 months', title: 'Laying-down method only', tips: 'No head control — always photograph flat on a white surface from above. Best time is during a calm alert period, not when crying or drowsy. A second person to hold attention above the lens helps.' },
                { label: '3 to 6 months', title: 'Transition age — both methods', tips: 'Some babies can sit supported at this age. Try propping against a white surface with support behind them (hidden from the camera). If the head still wobbles, use the laying-down method.' },
                { label: '6 months and older', title: 'Upright against white wall', tips: 'Once the baby has stable head control, photograph sitting up against a plain white wall or foam board — the same setup as adult at-home photos. Easier to get eyes forward at this age.' },
              ].map(a => (
                <div key={a.label} className="age-card">
                  <div className="age-label">{a.label}</div>
                  <div className="age-title">{a.title}</div>
                  <div className="age-tips">{a.tips}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">The 6 Most Common Rejection Reasons for Baby Photos</h2>
            </div>
            <div className="rejection-list">
              {[
                { reason: 'Parent\'s hands visible in frame', fix: 'Use the laying-down method — lay the baby flat on a white surface and shoot from above. No one needs to hold them.' },
                { reason: 'Eyes closed or not visible', fix: 'Take 30+ shots during an alert, awake period. Make sounds above the camera lens to draw eye contact. Pick the frame with the clearest, most open eyes.' },
                { reason: 'Background is not plain white', fix: 'Use a white bedsheet or white foam board. Beige, cream, gray, or any patterned surface will be rejected. The background must be pure white with no shadows.' },
                { reason: 'Shadow on the background or face', fix: 'Use soft window light, not overhead lights or flash. Shoot with the light source to the side of the baby, not directly above. If using the laying-down method, open window blinds partway for even light.' },
                { reason: 'Head too small or too large in frame', fix: 'The baby\'s head should fill 70–80% of the photo frame. Step closer if the head is too small, or back up if it fills the entire frame. AI auto-corrects this during the crop — upload and let it handle sizing.' },
                { reason: 'Photo is blurry or out of focus', fix: 'Use the rear camera on your phone, not the front selfie camera. Tap the baby\'s face on the screen to lock focus before taking the shot. Ensure there is enough light — dark rooms cause blur.' },
              ].map(item => (
                <div key={item.reason} className="rejection-item">
                  <div className="rejection-header">
                    <div className="rejection-x">
                      <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </div>
                    <div className="rejection-reason">{item.reason}</div>
                  </div>
                  <div className="rejection-fix">
                    <span className="rejection-fix-label">Fix:</span>
                    {item.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">6</div>
              <h2 className="blog-h2">How AI Makes Baby Passport Photos Easier</h2>
            </div>
            <p className="blog-p">The hardest part of a baby passport photo is the logistics — getting the baby in position, getting their eyes open, keeping the background clean. The technical corrections (background removal, exact crop sizing, resolution check) are the easy part — and AI handles all of them automatically.</p>
            <div className="steps">
              {[
                { title: 'Upload any clear photo of your baby\'s face', body: 'It doesn\'t need to be perfect. Any background, any room. The AI will fix what it can and flag what it can\'t.' },
                { title: 'AI removes and replaces the background', body: 'Whatever surface you photographed your baby on gets replaced with the correct government-standard white background. No need to find a perfect white wall.' },
                { title: 'AI crops to the exact required size', body: 'Head size, centering, and frame dimensions are all corrected automatically. You don\'t need to know the measurement specs.' },
                { title: 'Compliance is verified before download', body: 'The system checks eye visibility, lighting, resolution, and head size before giving you the final file. If something fails, you see exactly what to fix before you resubmit.' },
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
              <div className="callout-label">Bottom line</div>
              <p>The one thing AI cannot fix is a parent&apos;s hand in frame or closed eyes — those require a new photo. Everything else (background, crop, lighting balance, resolution) is corrected automatically. <strong>Total cost: $0.99.</strong></p>
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
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. Every photo is verified against State Department requirements before you download — so your baby&apos;s photo passes the first time.</div>
          </div>

          <div className="blog-cta">
            <h2>Get your baby&apos;s passport photo in 30 seconds</h2>
            <p>Upload a photo from your phone. AI removes the background, corrects the crop, and verifies compliance. $0.99 — money-back guarantee.</p>
            <Link href="/upload" className="blog-cta-btn">
              Get my baby&apos;s passport photo — $0.99
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
