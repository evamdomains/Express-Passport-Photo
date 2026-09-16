import type { Metadata } from 'next';
import Link from 'next/link';

const CANONICAL = 'https://expresspassportphoto.com/blog/passport-photo-rejected';

export const metadata: Metadata = {
  title: 'What Happens If Your Passport Photo Gets Rejected? (And How to Fix It Fast)',
  description: 'Passport photo rejected by the State Department or post office? Here is exactly what happens next, the most common rejection reasons, and how to get a compliant replacement in 30 seconds.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'What Happens If Your Passport Photo Gets Rejected?',
    description: 'A rejected photo delays your passport by 2–4 weeks. Here is what to do immediately, the most common reasons photos fail, and how to fix it fast.',
    url: CANONICAL,
    siteName: 'Express Passport Photo',
    type: 'article',
    publishedTime: '2026-09-16',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Passport Photo Rejected? Here\'s What to Do',
    description: 'Most common rejection reasons and how to fix your photo fast — without going back to CVS or Walgreens.',
  },
};

const REJECTION_REASONS = [
  { reason: 'Shadow on face or background', fix: 'Use two light sources facing you — a window plus a lamp on the other side. Or use AI to correct lighting automatically.' },
  { reason: 'Background is not plain white', fix: 'Use a plain white wall or white foam board. AI services remove any background automatically and replace it with the correct white.' },
  { reason: 'Eyes not fully open or looking off-camera', fix: 'Look directly at the camera lens, not the screen. Take 10+ shots and choose the clearest one.' },
  { reason: 'Glasses on face', fix: 'Glasses have not been permitted in US passport photos since 2016 — remove them entirely, even clear frames.' },
  { reason: 'Head tilted or turned', fix: 'Face the camera straight on. Have someone else take the photo so you can focus on keeping your head level.' },
  { reason: 'Expression too strong or mouth open', fix: 'Neutral expression, mouth closed. Relax your face — imagine looking at someone you mildly like, not someone you love.' },
  { reason: 'Head too large or too small in frame', fix: 'Your head should fill 70–80% of the frame. Stand 3–4 feet from the camera. An AI service auto-crops to the correct size.' },
  { reason: 'Photo older than 6 months', fix: 'A new photo is required every time you apply. Your old passport photo cannot be reused.' },
  { reason: 'Photo is blurry or pixelated', fix: 'Use your phone\'s rear camera (not the selfie camera). Make sure there is enough light. AI services check resolution before approval.' },
  { reason: 'Photo was digitally altered', fix: 'Do not use filters or skin-smoothing apps. AI passport photo services make only compliant adjustments (background removal, crop).' },
];

const FAQ = [
  { q: 'What happens if my passport photo is rejected?', a: 'If your photo is rejected at a post office or acceptance facility, you will be asked to provide a new photo on the spot or return with one. If the State Department rejects it after you mail your application, they will return your entire application by mail with a letter explaining why. You must then resubmit with a new photo, which resets processing time.' },
  { q: 'How long does a passport photo rejection delay my application?', a: 'A rejection at the acceptance facility means same-day delay — you just need a new photo. A rejection after mailing delays your application by 2–4 weeks: 1–2 weeks for your package to return, plus restarting the processing queue. If you had an expedited application, you will need to pay the expedite fee again.' },
  { q: 'Can a post office reject my passport photo?', a: 'Yes. Postal acceptance agents are trained to check photos against State Department guidelines before accepting your application. They will reject photos that have obvious issues: wrong background color, glasses, visible shadows, or a photo that looks older than 6 months. This rejection is actually helpful — better to fix it before mailing than have the State Department return your entire application.' },
  { q: 'Can I use the same photo for a second application after rejection?', a: 'No. Once a photo is rejected, you should not reuse it. If it was rejected for a specific reason, that reason is still present in the photo. Get a new compliant photo and submit fresh.' },
  { q: 'Does a rejected passport photo mean my application is denied?', a: 'No. A photo rejection is not a denial of your passport application. It is a request to provide a correct photo. Your application remains open. Fix the photo and resubmit — your eligibility for a passport is not affected.' },
  { q: 'How do I know if my photo will be rejected before I submit?', a: 'Use an AI passport photo service like Express Passport Photo. It automatically checks head size, background color, lighting, eye position, and resolution before you download. If any check fails, you are shown exactly what to fix. The service comes with a 100% acceptance guarantee.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'What Happens If Your Passport Photo Gets Rejected?',
      description: 'A rejected passport photo delays your application by 2–4 weeks. Here is what to do and how to fix it fast.',
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
        { '@type': 'ListItem', position: 3, name: 'Passport Photo Rejected', item: CANONICAL },
      ],
    },
  ],
};

export default function PassportPhotoRejectedPage() {
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

        .blog-alert { background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); border-radius: 12px; padding: 16px 20px; margin-top: 28px; display: flex; gap: 12px; align-items: flex-start; }
        .blog-alert-icon { font-size: 18px; flex-shrink: 0; }
        .blog-alert-text { font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5; }
        .blog-alert-text strong { color: #fff; }

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
                <li style={{color:'rgba(255,255,255,0.8)',fontWeight:500}}>Passport Photo Rejected</li>
              </ol>
            </nav>
            <Link href="/blog" className="blog-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
              All guides
            </Link>
            <div className="blog-eyebrow">
              <span className="blog-tag">Troubleshooting</span>
              <span className="blog-meta">September 16, 2026 · 6 min read</span>
            </div>
            <h1 className="blog-h1">What Happens If Your Passport Photo Gets Rejected? (And How to Fix It Fast)</h1>
            <p className="blog-lead">A photo rejection at the post office means same-day delay. A rejection after mailing means 2–4 extra weeks. Here is exactly what happens and how to get a replacement photo in 30 seconds.</p>
            <div className="blog-alert">
              <div className="blog-alert-icon">⚡</div>
              <div className="blog-alert-text"><strong>Just got rejected?</strong> Skip to Section 2 — it covers exactly what to do right now, step by step.</div>
            </div>
          </div>
        </div>

        <div className="blog-body">
          <div className="blog-toc">
            <div className="blog-toc-title">Table of Contents</div>
            <ol>
              <li>The two types of passport photo rejection</li>
              <li>What to do immediately after rejection</li>
              <li>The 10 most common rejection reasons — and how to fix each one</li>
              <li>How to guarantee your replacement photo is accepted</li>
              <li>How to avoid rejection on your first try</li>
              <li>Frequently asked questions</li>
            </ol>
          </div>

          {/* Section 1 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">1</div>
              <h2 className="blog-h2">The Two Types of Passport Photo Rejection</h2>
            </div>
            <p className="blog-p">A passport photo can be rejected at two different points in the process. Each has very different consequences.</p>
            <div className="steps">
              {[
                { title: 'Rejected at the acceptance facility (post office, library, clerk of court)', body: 'The postal agent reviews your photo before accepting your application. If they flag a problem, they will tell you on the spot. You can get a new photo and return the same day — your application is not submitted yet, so there is no delay to processing time.' },
                { title: 'Rejected by the State Department after mailing', body: 'If the photo passes the post office check but is later rejected by the National Passport Processing Center, your entire application is mailed back to you with a rejection letter. You must resubmit with a new photo — and your place in the processing queue resets. This typically adds 2–4 weeks.' },
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
              <div className="callout-label">Key point</div>
              <p>A photo rejection is <strong>not</strong> a denial of your passport. It is only a request to provide a correct photo. Your eligibility is unaffected — just fix the photo and resubmit.</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">2</div>
              <h2 className="blog-h2">What to Do Immediately After Rejection</h2>
            </div>
            <p className="blog-p">Follow these steps in order. The faster you act, the less time your application loses.</p>
            <div className="steps">
              {[
                { title: 'Read the rejection reason carefully', body: 'If rejected at the post office, ask the agent to be specific. If rejected by mail, read the State Department letter — it will name the exact reason. Knowing the reason tells you exactly what to fix.' },
                { title: 'Do not resubmit the same photo', body: 'The rejected photo has a flaw. Resubmitting it will result in another rejection. You need a completely new photo.' },
                { title: 'Get a new compliant photo — immediately', body: 'Upload a selfie to Express Passport Photo. The AI automatically checks all requirements and produces a compliant 2×2 photo in 30 seconds for $0.99. Download it and print at CVS or Walgreens.' },
                { title: 'Resubmit your application with the new photo', body: 'If rejected at the post office: bring the new photo back and resubmit the same day. If rejected by mail: complete a new DS-82 or DS-11, attach the new photo, and remail. Your previous payment is forfeited — you will need to pay again.' },
                { title: 'Request expedited processing on resubmission', body: 'If your travel date is approaching, add the $60 expedited fee when you resubmit. A post-rejection resubmission goes back to the end of the queue — expedited processing recovers some of the lost time.' },
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

          {/* Section 3 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">3</div>
              <h2 className="blog-h2">The 10 Most Common Rejection Reasons — and How to Fix Each One</h2>
            </div>
            <p className="blog-p">These are the rejection reasons cited most often by the US State Department. Find yours and apply the fix.</p>
            <div className="rejection-list">
              {REJECTION_REASONS.map((item) => (
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

          {/* Section 4 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">4</div>
              <h2 className="blog-h2">How to Guarantee Your Replacement Photo Is Accepted</h2>
            </div>
            <p className="blog-p">After a rejection, the last thing you want is a second one. An AI passport photo service eliminates the guesswork — it checks your photo against every State Department requirement before you download it.</p>
            <div className="steps">
              {[
                { title: 'Upload any selfie to Express Passport Photo', body: 'Any photo from your phone camera works — any background, any room. The AI handles the technical corrections.' },
                { title: 'AI removes the background and checks compliance', body: 'Background is replaced with the correct white. Head size, centering, eye openness, and lighting are all verified automatically.' },
                { title: 'Download your compliant photo in 30 seconds', body: 'You get a print-ready 2×2 inch file. Send it to CVS or Walgreens for same-day printing ($1–3) or submit digitally for online applications.' },
                { title: 'Submit with confidence — 100% guarantee', body: 'Express Passport Photo guarantees acceptance. If the photo is rejected by the government, you get a full refund. No questions asked.' },
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
              <div className="callout-label">Total cost after rejection</div>
              <p>New compliant photo: <strong>$0.99</strong>. CVS print: ~$2. Resubmission government fee: $130. Compare this to $16.99 for another Walgreens studio photo that might get rejected again.</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="blog-section">
            <div className="blog-section-header">
              <div className="blog-section-num">5</div>
              <h2 className="blog-h2">How to Avoid Rejection on Your First Try</h2>
            </div>
            <p className="blog-p">The best outcome is never having a rejection in the first place. Here is what to check before you submit your application.</p>
            <div className="callout danger">
              <div className="callout-label">Most rejected</div>
              <p>Shadows, wrong background, and glasses account for over 60% of all passport photo rejections. Check these three things first.</p>
            </div>
            <div className="steps">
              {[
                { title: 'Use an AI service with an automatic compliance check', body: 'Express Passport Photo checks head size, background, eye openness, lighting, and resolution before you download. You get a pass/fail on every requirement — not a guess.' },
                { title: 'Take the photo in good daylight', body: 'Soft natural light from a window is the best setup. Avoid overhead lights that create shadows on your face, and avoid camera flash.' },
                { title: 'Stand at least 2 feet from any wall', body: 'Distance between you and the wall prevents your shadow from appearing on the background. Even on a white wall, a shadow will cause rejection.' },
                { title: 'Remove glasses — even clear ones', body: 'This has been a rule since 2016. Many people forget. The State Department will reject any photo with glasses, regardless of prescription or frame thickness.' },
                { title: 'Print at a photo lab, not on a home printer', body: 'Home printers rarely produce the correct glossy finish at the right color profile. CVS and Walgreens use calibrated photo printers that meet the State Department\'s standards.' },
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

          {/* FAQ */}
          <hr className="blog-divider"/>
          <div className="blog-section">
            <h2 className="blog-h2" style={{marginBottom:8}}>6. Frequently Asked Questions</h2>
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
                { href:'/blog/how-to-take-passport-photo-at-home', label:'How to Take a Passport Photo at Home' },
                { href:'/blog/passport-photo-cost-2026', label:'How Much Does a Passport Photo Cost in 2026?' },
                { href:'/blog/how-to-renew-us-passport-2026', label:'How to Renew a US Passport in 2026' },
                { href:'/photo-requirements', label:'US Passport Photo Requirements' },
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
            <div className="blog-author-bio">Express Passport Photo is a US-based AI passport photo service. Our AI checks every photo against the State Department&apos;s requirements before you download — so you never face a rejection.</div>
          </div>

          <div className="blog-cta">
            <h2>Replace your rejected photo in 30 seconds</h2>
            <p>Upload a selfie. AI corrects the background, checks all requirements, and delivers a guaranteed-compliant photo. $0.99 — money-back guarantee.</p>
            <Link href="/upload" className="blog-cta-btn">
              Get my replacement photo — $0.99
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
