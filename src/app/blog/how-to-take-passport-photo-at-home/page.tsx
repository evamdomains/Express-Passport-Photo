import type { Metadata } from 'next';
import Link from 'next/link';

const CANONICAL = 'https://expresspassportphoto.com/blog/how-to-take-passport-photo-at-home';

export const metadata: Metadata = {
  title: 'How to Take a Passport Photo at Home (Step-by-Step)',
  description: 'Take a government-compliant passport photo at home using your phone. Follow these exact steps for background, lighting, framing, and pass the State Department\'s requirements on the first try.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'How to Take a Passport Photo at Home (Step-by-Step Guide)',
    description: 'You don\'t need a studio. With a plain wall, decent light, and your phone you can get a government-compliant photo in minutes.',
    url: CANONICAL,
    siteName: 'Express Passport Photo',
    type: 'article',
    publishedTime: '2026-09-08',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Take a Passport Photo at Home',
    description: 'Step-by-step guide: background, lighting, camera position, compliance check. No studio needed.',
  },
};

const REQUIREMENTS = [
  { label: 'Size', value: '2×2 inches (51×51 mm)' },
  { label: 'Head size', value: '1 to 1⅜ inches from chin to top of head' },
  { label: 'Background', value: 'Plain white or off-white — no patterns, no shadows' },
  { label: 'Expression', value: 'Neutral — mouth closed, no smiling' },
  { label: 'Eyes', value: 'Open and looking directly at the camera' },
  { label: 'Glasses', value: 'Not permitted (since 2016)' },
  { label: 'Head covering', value: 'Not permitted unless for religious reasons' },
  { label: 'Taken within', value: 'Last 6 months' },
];

const REJECTION_REASONS = [
  'Shadow on face or background',
  'Eyes not fully open or looking off-camera',
  'Head tilted or turned',
  'Glasses on face',
  'Mouth open or expression too strong',
  'Background is not pure white or off-white',
  'Head too large or too small in frame',
  'Photo is blurry or pixelated',
];

const FAQ = [
  { q: 'Can I take my own passport photo at home?', a: 'Yes. The US Department of State explicitly allows self-taken passport photos. The photo just needs to meet technical specifications. An AI service ensures your selfie is automatically made compliant.' },
  { q: 'What is the best background for a passport photo at home?', a: 'A plain white wall is ideal. If your wall has a slight texture or color, use an AI tool to remove the background automatically — it will replace it with the correct white. Avoid patterned wallpaper, colored walls, or anything that creates shadows.' },
  { q: 'Can I use my phone camera for a passport photo?', a: 'Yes. Modern smartphone cameras take high enough quality photos for passport use. Use the rear camera (not the front/selfie camera) for best image quality. Portrait mode is fine, but turn off filters.' },
  { q: 'Can I smile in a passport photo?', a: 'No. The US government requires a neutral expression with your mouth closed. A slight natural expression is acceptable, but an open smile is not.' },
  { q: 'What should I wear for a passport photo?', a: 'Wear everyday clothing. Uniforms are not permitted. Do not wear anything white that blends into the white background. Avoid hats and head coverings unless worn daily for religious reasons.' },
  { q: 'How do I know if my photo meets US passport requirements?', a: 'You can use an AI passport photo service that automatically checks compliance. Express Passport Photo checks head size, positioning, background, lighting, and eye openness before you download.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'How to Take a Passport Photo at Home (Step-by-Step Guide)',
      description: 'Take a government-compliant passport photo at home using your phone.',
      datePublished: '2026-09-08',
      dateModified: '2026-09-08',
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
        { '@type': 'ListItem', position: 3, name: 'How to Take a Passport Photo at Home', item: CANONICAL },
      ],
    },
  ],
};

export default function PassportPhotoAtHomePage() {
  return (
    <>
      <style>{`
        .blog-page { font-family: var(--font-inter), system-ui, sans-serif; background: #fff; min-height: 100vh; color: #374151; }

        .blog-hero { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); padding: 56px 24px 64px; color: #fff; }
        .blog-hero-inner { max-width: 760px; margin: 0 auto; }
        .blog-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.65); font-size: 13px; font-weight: 500; text-decoration: none; margin-bottom: 28px; transition: color 0.15s; }
        .blog-back:hover { color: #fff; }
        .blog-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .blog-tag { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
        .blog-meta { color: rgba(255,255,255,0.55); font-size: 13px; }
        .blog-h1 { font-family: var(--font-inter), system-ui, sans-serif;font-size: clamp(28px, 5vw, 42px); font-weight: 800; line-height: 1.2; color: #fff; margin: 0 0 18px; text-wrap: balance; }
        .blog-lead { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.8); margin: 0; max-width: 600px; }

        .blog-prereqs { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 32px; }
        .blog-prereq { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 14px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
        .blog-prereq-dot { width: 6px; height: 6px; background: #60A5FA; border-radius: 50%; flex-shrink: 0; }

        .blog-body { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

        .blog-toc { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px 28px; margin: 40px 0; }
        .blog-toc-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748B; margin-bottom: 14px; }
        .blog-toc ol { margin: 0; padding: 0 0 0 18px; }
        .blog-toc li { font-size: 14px; color: #2563EB; padding: 3px 0; line-height: 1.5; }
        .blog-toc li::marker { color: #94A3B8; font-size: 12px; }

        .blog-section { margin-top: 52px; }
        .blog-section-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
        .blog-section-num { flex-shrink: 0; width: 32px; height: 32px; background: #EFF6FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2563EB; margin-top: 4px; }
        .blog-h2 { font-family: var(--font-inter), system-ui, sans-serif;font-size: clamp(20px, 3.5vw, 26px); font-weight: 700; color: #1B3A6B; line-height: 1.3; margin: 0; text-wrap: balance; }
        .blog-p { font-size: 16px; line-height: 1.75; color: #374151; margin: 0 0 16px; }
        .blog-p:last-child { margin-bottom: 0; }

        .req-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0; }
        @media (max-width: 540px) { .req-grid { grid-template-columns: 1fr; } }
        .req-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; }
        .req-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px; }
        .req-value { font-size: 14px; font-weight: 600; color: #1B3A6B; line-height: 1.4; }

        .steps { display: flex; flex-direction: column; gap: 12px; margin: 20px 0; }
        .step-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
        .step-n { flex-shrink: 0; width: 28px; height: 28px; background: #1B3A6B; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; margin-top: 1px; }
        .step-content { flex: 1; }
        .step-title { font-size: 14px; font-weight: 700; color: #1B3A6B; margin-bottom: 4px; }
        .step-body { font-size: 14px; line-height: 1.6; color: #4B5563; }

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

        .rejection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
        @media (max-width: 540px) { .rejection-grid { grid-template-columns: 1fr; } }
        .rejection-item { display: flex; align-items: center; gap: 10px; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 10px; padding: 10px 14px; }
        .rejection-x { flex-shrink: 0; width: 18px; height: 18px; background: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .rejection-x svg { width: 8px; height: 8px; stroke: #EF4444; stroke-width: 3; }
        .rejection-item span { font-size: 13px; color: #9F1239; font-weight: 500; line-height: 1.3; }

        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        @media (max-width: 480px) { .compare-grid { grid-template-columns: 1fr; } }
        .compare-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; }
        .compare-card-head { padding: 14px 18px; font-size: 13px; font-weight: 700; }
        .compare-card.pro .compare-card-head { background: #EFF6FF; color: #1D4ED8; }
        .compare-card.studio .compare-card-head { background: #F8FAFC; color: #475569; }
        .compare-card-body { padding: 14px 18px; }
        .compare-row { display: flex; gap: 10px; align-items: center; font-size: 13px; color: #374151; padding: 5px 0; }
        .compare-row::before { content: ''; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .compare-card.pro .compare-row::before { background: #22C55E; }
        .compare-card.studio .compare-row::before { background: #94A3B8; }

        .lighting-diagram { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 24px; margin: 20px 0; text-align: center; }
        .lighting-diagram-title { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94A3B8; margin-bottom: 16px; }
        .lighting-scene { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .light-source { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .light-bulb { width: 40px; height: 40px; background: #FEF9C3; border: 2px solid #FCD34D; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .light-label { font-size: 11px; color: #6B7280; font-weight: 600; }
        .light-arrows { font-size: 22px; color: #FCD34D; letter-spacing: -4px; }
        .light-person { width: 48px; height: 48px; background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .lighting-note { font-size: 12px; color: #94A3B8; margin-top: 14px; }

        .faq-list { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        details.faq-item { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
        details.faq-item[open] { border-color: #BFDBFE; }
        details.faq-item summary { list-style: none; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; cursor: pointer; font-size: 15px; font-weight: 600; color: #1B3A6B; line-height: 1.4; }
        details.faq-item summary::-webkit-details-marker { display: none; }
        .faq-chevron { flex-shrink: 0; width: 20px; height: 20px; stroke: #2563EB; transition: transform 0.2s; }
        details.faq-item[open] .faq-chevron { transform: rotate(180deg); }
        .faq-answer { padding: 0 20px 18px; font-size: 15px; line-height: 1.7; color: #4B5563; }

        .blog-author { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 22px 24px; margin-top: 48px; }
        .blog-author-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; }
        .blog-author-name { font-size: 15px; font-weight: 700; color: #1B3A6B; margin-bottom: 6px; }
        .blog-author-bio { font-size: 14px; color: #6B7280; line-height: 1.65; }

        .blog-cta { background: linear-gradient(135deg, #1B3A6B 0%, #1e4d9b 100%); border-radius: 20px; padding: 44px 36px; text-align: center; margin-top: 48px; }
        .blog-cta h2 { font-family: var(--font-inter), system-ui, sans-serif;font-size: clamp(22px, 4vw, 30px); font-weight: 800; color: #fff; margin: 0 0 12px; }
        .blog-cta p { font-size: 16px; color: rgba(255,255,255,0.75); margin: 0 0 28px; }
        .blog-cta-btn { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #1B3A6B; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
        .blog-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

        .blog-divider { border: none; border-top: 1px solid #E2E8F0; margin: 48px 0 0; }

      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="blog-page">
        <div className="blog-hero">
          <div className="blog-hero-inner">
            <nav aria-label="Breadcrumb" style={{marginBottom: 20}}>
              <ol style={{display:'flex', gap:6, fontSize:13, color:'rgba(255,255,255,0.55)', listStyle:'none', padding:0, margin:0, flexWrap:'wrap'}}>
                <li><Link href="/" style={{color:'rgba(255,255,255,0.55)', textDecoration:'none'}}>Home</Link></li>
                <li style={{opacity:0.4}}>›</li>
                <li><Link href="/blog" style={{color:'rgba(255,255,255,0.55)', textDecoration:'none'}}>Blog</Link></li>
                <li style={{opacity:0.4}}>›</li>
                <li style={{color:'rgba(255,255,255,0.8)', fontWeight:500}}>How to Take a Passport Photo at Home</li>
              </ol>
            </nav>
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">How-To Guide</span>
              <span className="blog-meta">September 8, 2026 · 7 min read</span>
            </div>
            <h1 className="blog-h1">How to Take a Passport Photo at Home (Step-by-Step Guide)</h1>
            <p className="blog-lead">You don&apos;t need a studio. With a plain wall, decent light, and your phone, you can take a government-compliant passport photo in minutes. This guide walks you through each step.</p>
            <div className="blog-prereqs">
              <div className="blog-prereq"><div className="blog-prereq-dot"></div>Smartphone camera</div>
              <div className="blog-prereq"><div className="blog-prereq-dot"></div>White or light-colored wall</div>
              <div className="blog-prereq"><div className="blog-prereq-dot"></div>Natural or indoor light</div>
              <div className="blog-prereq"><div className="blog-prereq-dot"></div>About 10 minutes</div>
            </div>
          </div>
        </div>

        <div className="blog-body">
          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>US passport photo requirements — the quick version</li>
              <li>Set up your background</li>
              <li>Get your lighting right</li>
              <li>Position your camera correctly</li>
              <li>Take the photo</li>
              <li>Run the photo through an AI compliance check</li>
              <li>Print or submit digitally</li>
              <li>Common reasons passport photos get rejected</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">US Passport Photo Requirements — The Quick Version</h2>
            </div>
            <p className="blog-p">Before picking up your phone, know what the US State Department requires. These are the rules your photo must meet:</p>
            <div className="req-grid">
              {REQUIREMENTS.map((r) => (
                <div key={r.label} className="req-item">
                  <div className="req-label">{r.label}</div>
                  <div className="req-value">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="callout tip">
              <div className="callout-label">Why this matters</div>
              <p>If any single requirement is off — even a shadow on the background — your application may be delayed or returned. An AI tool catches these issues before you print.</p>
            </div>
          </div>

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">Set Up Your Background</h2>
            </div>
            <p className="blog-p">The background must be plain white or off-white with no patterns, shadows, or visible texture. Here is how to set this up at home:</p>
            <div className="steps">
              {[
                { title: 'Use a plain white wall', body: 'Stand 2–3 feet in front of a white or off-white wall. The gap between you and the wall prevents your shadow from appearing behind you.' },
                { title: 'Use a white bedsheet or foam board', body: 'If you do not have a plain white wall, hang a white bedsheet flat and wrinkle-free, or tape a large white foam board behind you.' },
                { title: 'Do not use a patterned background', body: 'Floral wallpaper, colored walls, or even a light gray wall will cause a rejection. White only.' },
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
            <div className="callout warning">
              <div className="callout-label">Shortcut</div>
              <p>If you can&apos;t get a clean white background, use Express Passport Photo — it automatically removes and replaces your background with the correct white. You can photograph in front of any color.</p>
            </div>
          </div>

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">Get Your Lighting Right</h2>
            </div>
            <p className="blog-p">Lighting is the most common reason home passport photos get rejected. Shadows on the face or background are an automatic rejection.</p>
            <div className="lighting-diagram">
              <div className="lighting-diagram-title">Ideal lighting setup</div>
              <div className="lighting-scene">
                <div className="light-source">
                  <div className="light-bulb">
                    <svg width="20" height="20" fill="#FCD34D" viewBox="0 0 24 24"><path d="M9 21h6m-3-18a7 7 0 00-3.5 13.07V18h7v-1.93A7 7 0 0012 3z"/></svg>
                  </div>
                  <div className="light-label">Window / lamp</div>
                </div>
                <div className="light-arrows">→→</div>
                <div className="light-person">👤</div>
                <div className="light-arrows">←←</div>
                <div className="light-source">
                  <div className="light-bulb">
                    <svg width="20" height="20" fill="#FCD34D" viewBox="0 0 24 24"><path d="M9 21h6m-3-18a7 7 0 00-3.5 13.07V18h7v-1.93A7 7 0 0012 3z"/></svg>
                  </div>
                  <div className="light-label">Second source</div>
                </div>
              </div>
              <div className="lighting-note">Light hits both sides of your face evenly. No shadows on face or background.</div>
            </div>
            <div className="steps">
              {[
                { title: 'Face a window for natural light', body: 'Soft, diffused daylight is the best light for passport photos. Face toward the window so the light hits your face evenly. Avoid direct harsh sunlight.' },
                { title: 'Do not use flash directly', body: 'Camera flash creates harsh shadows and hotspots on the face. Turn off flash and rely on ambient light instead.' },
                { title: 'Use two light sources to eliminate shadows', body: 'One light creates a shadow on the opposite side. Two lights (a window plus a lamp on the other side) cancel each other out for a shadow-free result.' },
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

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">4</div>
              <h2 className="blog-h2">Position Your Camera Correctly</h2>
            </div>
            <p className="blog-p">Correct framing is essential. Your head must fill 70–80% of the frame. Here is the setup to get there:</p>
            <div className="steps">
              {[
                { title: 'Use the rear camera, not the front camera', body: 'The rear camera takes higher-quality photos and has less distortion. Have a family member or friend take the photo, or use a timer and place your phone on a surface.' },
                { title: 'Position camera at eye level', body: 'The camera lens should be exactly at eye level, not above or below. A tilted angle creates a perspective that can cause head size or centering issues.' },
                { title: 'Stand 3–4 feet from the camera', body: 'This distance gives you the right head-to-frame ratio. Much closer and your head will be too large; much further and it will be too small.' },
                { title: 'Center your head in the frame', body: 'Your head should be centered horizontally. Leave roughly equal space above your head and below your chin. Do not cut off the top of your head.' },
                { title: 'Look directly into the lens', body: 'Your eyes must be open and looking directly at the camera. Looking even slightly to the side can cause a rejection.' },
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

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">Take the Photo</h2>
            </div>
            <p className="blog-p">With everything set up, follow these rules when you press the shutter:</p>
            <div className="steps">
              {[
                { title: 'Neutral expression, mouth closed', body: 'No smiling. Your mouth should be closed. A natural, relaxed expression is correct — think of your face at rest.' },
                { title: 'Remove glasses', body: 'Glasses are not permitted in US passport photos as of 2016, even if you wear them daily.' },
                { title: 'Hair away from face', body: 'Your face must be fully visible. If your hair covers part of your face, pull it back or to the side.' },
                { title: 'Take 5–10 shots', body: 'Eyes blink, heads tilt, expressions shift. Take multiple shots and choose the one where you are most centered and relaxed.' },
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

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">6</div>
              <h2 className="blog-h2">Run the Photo Through an AI Compliance Check</h2>
            </div>
            <p className="blog-p">Even a well-taken photo can fail on small technical details. An AI passport photo service checks everything automatically and fixes common issues — background removal, head centering, lighting normalization — before you submit.</p>
            <div className="compare-grid">
              <div className="compare-card pro">
                <div className="compare-card-head">AI service (Express Passport Photo)</div>
                <div className="compare-card-body">
                  {['Automatic background removal', 'Head size check', 'Eye openness check', 'Lighting correction', '100% acceptance guarantee', '30 seconds, $0.99'].map((t) => (
                    <div key={t} className="compare-row">{t}</div>
                  ))}
                </div>
              </div>
              <div className="compare-card studio">
                <div className="compare-card-head">Printing without a check</div>
                <div className="compare-card-body">
                  {['Manual background setup required', 'No head size verification', 'No technical compliance check', 'Risk of rejection at submission', 'Reprint cost if rejected', 'CVS/Walgreens: $14–17'].map((t) => (
                    <div key={t} className="compare-row">{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">7</div>
              <h2 className="blog-h2">Print or Submit Digitally</h2>
            </div>
            <p className="blog-p">Once you have your compliant photo, you have two options:</p>
            <div className="steps">
              {[
                { title: 'Digital submission (fastest)', body: 'If you are applying for a US passport online or renewing by mail, you can upload the digital photo file directly. No printing required. Express Passport Photo gives you a digital file optimized for online submission.' },
                { title: 'Physical print at CVS or Walgreens', body: 'If your application requires a printed photo, send the digital file to your nearest CVS or Walgreens photo center for same-day printing. Two 2×2 inch prints typically cost $1–3 when you supply the digital file.' },
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
            <div className="callout success">
              <div className="callout-label">Pro tip</div>
              <p>Order your AI-processed photo first ($0.99), then send it to CVS for printing. Total cost: under $5. Compare this to the $14.99 CVS studio charges to do it for you.</p>
            </div>
          </div>

          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">8</div>
              <h2 className="blog-h2">Common Reasons Passport Photos Get Rejected</h2>
            </div>
            <p className="blog-p">These are the most frequent rejection reasons reported by the US State Department. Check your photo against each one before submitting:</p>
            <div className="rejection-grid">
              {REJECTION_REASONS.map((r) => (
                <div key={r} className="rejection-item">
                  <div className="rejection-x">
                    <svg fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </div>
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div className="callout danger" style={{marginTop: 20}}>
              <div className="callout-label">Important</div>
              <p>A rejected passport photo delays your application by 2–4 weeks. If your travel date is firm, use an AI service with a guarantee rather than risking rejection with an unverified photo.</p>
            </div>
          </div>

          <hr className="blog-divider"/>
          <div className="blog-section">
            <h2 className="blog-h2" style={{marginBottom: 8}}>9. Frequently Asked Questions</h2>
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

          {/* Internal links */}
          <div style={{background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:14, padding:'20px 24px', marginTop:40}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:12}}>Related guides</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <Link href="/blog/passport-photo-cost-2026" style={{display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color:'#2563EB', textDecoration:'none'}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                How Much Does a Passport Photo Cost in 2026?
              </Link>
              <Link href="/us-passport-photo" style={{display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color:'#2563EB', textDecoration:'none'}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                US Passport Photo Requirements
              </Link>
              <Link href="/upload" style={{display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, color:'#2563EB', textDecoration:'none'}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                Get your AI passport photo — $0.99
              </Link>
            </div>
          </div>

          <div className="blog-author">
            <div className="blog-author-label">Written by</div>
            <div className="blog-author-name">The Express Passport Photo Team</div>
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. Our AI is trained on the US State Department&apos;s passport photo guidelines and ICAO international standards. We wrote this guide to help travelers avoid the most common rejection reasons and get a compliant photo from home.</div>
          </div>

          <div className="blog-cta">
            <h2>Skip the setup — let AI handle it</h2>
            <p>Upload any selfie. We&apos;ll remove the background, check compliance, and deliver a government-ready photo in 30 seconds.</p>
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
