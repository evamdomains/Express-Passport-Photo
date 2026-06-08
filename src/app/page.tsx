import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Flag from '@/components/Flag';
import BeforeAfterShowcase from '@/components/BeforeAfterShowcase';

export const metadata: Metadata = {
  title: 'Passport Photo Online — $6.99 | ICAO Compliant | 60 Seconds',
  description:
    'Get a government-accepted passport photo in 60 seconds. AI removes background, checks compliance. Instant digital download $6.99. CVS/Walgreens pickup $12.99.',
};

// Compliance example passport photos — one person per card, sliced from the
// 3-up reference image (male · female · male). `position` picks the panel:
// '0%' = left, '50%' = center (female), '100%' = right.
const COMPLIANT_EXAMPLES_IMAGE = '/images/backgrounds/background_4.png';

function PassportPhotoExample({ position }: { position: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        role="img"
        aria-label="Example of a compliant passport photo"
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-gray-100 shadow-sm bg-white"
        style={{
          backgroundImage: `url('${COMPLIANT_EXAMPLES_IMAGE}')`,
          backgroundSize: '300% auto', // 3 panels across; height keeps aspect (cover-style)
          backgroundPosition: `${position} 50%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
      <ul className="mt-3 space-y-1 text-xs text-green-600">
        {['White background', 'Correct size', 'Face centered', 'ICAO compliant'].map((c) => (
          <li key={c} className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

const REVIEWS = [
  {
    name: 'Sarah M.',
    location: 'New York',
    text: 'Got my passport photo done in under 2 minutes. The post office accepted it without any issues. Way easier than driving to CVS.',
  },
  {
    name: 'James T.',
    location: 'Austin',
    text: 'Needed photos on a Sunday night. Downloaded, went to Walgreens, printed for $0.35. Perfect experience start to finish.',
  },
  {
    name: 'Priya K.',
    location: 'Toronto',
    text: 'Needed a Canadian passport photo and was dreading the process. The AI background removal was spot-on and it was accepted first try.',
  },
  {
    name: 'Michael R.',
    location: 'Chicago',
    text: 'Used it for a US visa application. Compliance checker flagged my slight head tilt, I retook it, and it passed. Worth every penny.',
  },
  {
    name: 'Elena D.',
    location: 'Los Angeles',
    text: "The CVS pickup option is genuinely convenient. I placed the order on my phone, got an email an hour later, picked up my prints. So easy.",
  },
];

const FAQ_ITEMS = [
  {
    q: 'What documents do I need a passport photo for?',
    a: 'Passport applications and renewals, US visa applications, Canadian PR Card, Global Entry/TSA PreCheck, Real ID, and most government ID applications.',
  },
  {
    q: 'How long does the whole process take?',
    a: 'About 60 seconds from upload to your digital download. Background removal, compliance checking, and PDF generation happen automatically.',
  },
  {
    q: 'What makes a passport photo get rejected?',
    a: 'The most common reasons: incorrect size, head too small or too large in the frame, glasses, shadows on face or background, non-white background, eyes not fully open, and photos older than 6 months.',
  },
  {
    q: 'Can I use a selfie?',
    a: "Yes. Take a selfie against any background — we automatically replace it with a compliant white background. Make sure you're in good light, facing the camera directly.",
  },
  {
    q: 'What format do I receive my photos in?',
    a: 'A high-resolution JPEG plus a print-ready 4×6 PDF with multiple copies tiled. The PDF is optimized for pharmacy printing.',
  },
  {
    q: 'How does the CVS/Walgreens pickup work?',
    a: 'During checkout, enter your zip code and select a nearby store with photo printing. We upload your photos to that store. You get an email when ready — usually within an hour.',
  },
  {
    q: 'Is my photo stored permanently?',
    a: 'No. All uploaded and processed photos are automatically deleted within 48 hours of your order being fulfilled.',
  },
  {
    q: 'Do you guarantee compliance?',
    a: "Yes. We check face size, head position, eye state, and background. If a government agency rejects your photo for a covered compliance reason, we issue a full refund.",
  },
];

// ─── "How it works" banner image ───────────────────────────────────────────
// To swap this banner later: drop a new file in public/images/backgrounds/
// and change ONLY this path. No other code changes are required.
const SECTION_BACKGROUND_IMAGE = '/images/backgrounds/background_1.png';
// Intrinsic dimensions of the image above — used by next/image to reserve
// space and preserve aspect ratio (prevents layout shift). Update these only
// if a replacement image has a different native size.
const SECTION_BACKGROUND_WIDTH = 1672;
const SECTION_BACKGROUND_HEIGHT = 941;

export default function HomePage() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Express Passport Photo — Digital Download',
      description: 'ICAO-compliant passport photo, instant digital download.',
      offers: {
        '@type': 'Offer',
        price: '6.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://expresspassportphoto.com/upload',
      },
    },
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <div>
            {/* Tagline badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-brand-100 px-3 py-1.5 rounded-full text-sm font-medium mb-5 border border-white/20">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Government-compliant photos from your phone
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
              Government-accepted<br className="hidden sm:block" /> passport photos<br className="hidden sm:block" />
              <span className="text-brand-200">in 60 seconds</span>
            </h1>
            <p className="text-brand-100 text-lg mb-8 max-w-lg">
              Upload any selfie. AI removes the background, checks compliance, and delivers a
              print-ready photo. Starting at $6.99.
            </p>

            {/* CTA */}
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-white text-brand-800 font-extrabold px-8 py-4 rounded-2xl text-lg shadow-xl hover:bg-brand-50 transition-colors"
            >
              Get My Passport Photo Now — $6.99
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <div className="flex flex-wrap gap-4 mt-5 text-sm text-brand-200">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Money-back guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                ICAO compliant
              </span>
            </div>
          </div>

          {/* Right: before/after */}
          <div className="flex justify-center">
            <BeforeAfterShowcase />
          </div>
        </div>
      </section>

      {/* ── How it works (full-width banner) ─────────────────────────────── */}
      <section className="w-full">
        <Image
          src={SECTION_BACKGROUND_IMAGE}
          width={SECTION_BACKGROUND_WIDTH}
          height={SECTION_BACKGROUND_HEIGHT}
          alt="Three steps to a compliant passport photo in under 5 minutes: upload your selfie, our AI checks compliance, then download or pick up your prints."
          sizes="100vw"
          className="w-full h-auto"
          priority={false}
        />
      </section>

      {/* ── Document types ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Works for these documents</h2>
          <p className="text-center text-gray-500 text-sm mb-10">Select your document type to get started</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'us_passport', country: 'US' as const, name: 'US Passport', size: '2×2 in', href: '/us-passport-photo' },
              { id: 'us_visa', country: 'US' as const, name: 'US Visa', size: '2×2 in', href: '/upload?type=us_visa' },
              { id: 'baby_passport', country: 'US' as const, name: 'Baby Passport', size: '2×2 in', href: '/baby-passport-photo' },
              { id: 'canadian_passport', country: 'Canada' as const, name: 'Canadian Passport', size: '50×70mm', href: '/canada-passport-photo' },
              { id: 'canadian_pr_card', country: 'Canada' as const, name: 'Canadian PR Card', size: '50×70mm', href: '/upload?type=canadian_pr_card' },
            ].map(({ country, name, size, href }) => (
              <Link
                key={name}
                href={href}
                className="group bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-gray-100 hover:border-brand-200 transition-all text-center"
              >
                <div className="flex justify-center mb-3">
                  <Flag country={country} className="h-9 w-14" />
                </div>
                <p className="font-semibold text-sm sm:text-base group-hover:text-brand-600 transition-colors leading-snug">{name}</p>
                <p className="text-xs text-gray-400 mt-1">{size} · White bg</p>
                <div className="mt-3 text-xs text-brand-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance examples ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">What a compliant photo looks like</h2>
        <p className="text-center text-gray-500 text-sm mb-10">Every photo we produce meets these standards automatically</p>
        <div className="flex justify-center gap-8 sm:gap-16 flex-wrap">
          <PassportPhotoExample position="0%" />
          <PassportPhotoExample position="50%" />
          <PassportPhotoExample position="100%" />
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <section className="bg-brand-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-200 text-sm font-semibold uppercase tracking-widest mb-2">What Customers Say</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Passport photos that actually get approved</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.slice(0, 6).map(({ name, location, text }) => (
              <div key={name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="text-yellow-400 text-sm mb-2">★★★★★</div>
                <p className="text-brand-100 text-sm leading-relaxed mb-3">"{text}"</p>
                <p className="text-white font-semibold text-sm">{name}</p>
                <p className="text-brand-300 text-xs">{location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Why choose Express Passport Photo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: '🤖', title: 'AI-Powered', desc: 'Automatic background removal and compliance checking on every photo.' },
            { icon: '⚡', title: 'Instant Download', desc: 'Get your print-ready files in under 60 seconds — any time, any day.' },
            { icon: '🏪', title: 'CVS/Walgreens Pickup', desc: 'Prefer physical prints? Pick up from 8,000+ locations near you.' },
            { icon: '🛡️', title: 'Money-Back Guarantee', desc: 'Government rejects it for compliance? We refund 100%, no questions.' },
            { icon: '👤', title: 'No Account Needed', desc: 'Just upload, pay, and download. Nothing to sign up for.' },
            { icon: '🔒', title: 'Photos Deleted in 48hrs', desc: 'Your images are automatically removed after your order is fulfilled.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">How we compare</h2>
          <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-500 w-40">Feature</th>
                  <th className="p-4 font-bold text-brand-700 bg-brand-50 border-x border-brand-100">
                    <div className="text-center">Express Passport Photo</div>
                    <div className="text-xs font-normal text-brand-500 text-center mt-0.5">from $6.99</div>
                  </th>
                  <th className="p-4 font-semibold text-gray-600 text-center">At a Pharmacy</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">Other Online</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Price', '$6.99', '$15–$20', '$10–$15'],
                  ['Wait time', '60 seconds', '30–60 min', '15–60 min'],
                  ['Available 24/7', true, false, true],
                  ['AI compliance check', true, false, '~50%'],
                  ['Instant download', true, false, true],
                  ['Store pickup option', true, '(you\'re already there)', false],
                  ['Money-back guarantee', true, false, '~20%'],
                  ['No account required', true, true, false],
                ].map(([feature, us, store, other], i) => {
                  const renderCell = (val: string | boolean) => {
                    if (typeof val === 'boolean') {
                      return val
                        ? <span className="text-green-500 font-bold text-base">✓</span>
                        : <span className="text-red-400">✗</span>;
                    }
                    return <span className="text-gray-700">{val}</span>;
                  };
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="p-4 text-gray-600 font-medium">{feature}</td>
                      <td className="p-4 text-center bg-brand-50/50 border-x border-brand-100 font-semibold">
                        {renderCell(us)}
                      </td>
                      <td className="p-4 text-center">{renderCell(store)}</td>
                      <td className="p-4 text-center">{renderCell(other)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Simple, transparent pricing</h2>
        <p className="text-center text-gray-500 text-sm mb-10">No subscriptions. No surprises. No account required.</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="border border-gray-200 rounded-2xl p-7 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Digital Download</p>
            <p className="text-5xl font-extrabold mb-1">$6.99</p>
            <p className="text-gray-400 text-sm mb-5">High-res JPEG + print-ready 4×6 PDF</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-7 flex-1">
              {['Instant email delivery', 'Print at any pharmacy or lab', 'Unlimited reprints'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/upload" className="block text-center bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
              Get My Photo — $6.99
            </Link>
          </div>

          <div className="border-2 border-brand-600 rounded-2xl p-7 flex flex-col relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              MOST POPULAR
            </span>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Printed &amp; Ready</p>
            <p className="text-5xl font-extrabold mb-1">$12.99</p>
            <p className="text-gray-400 text-sm mb-5">2 prints ready at CVS or Walgreens</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-7 flex-1">
              {['Ready for pickup in ~1 hour', 'Professional photo paper', 'Digital copy included'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/upload" className="block text-center bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
              Get Prints — $12.99
            </Link>
          </div>
        </div>

        {/* Guarantee badge */}
        <div className="flex items-center justify-center gap-3 mt-8 p-4 bg-green-50 border border-green-100 rounded-2xl max-w-sm mx-auto">
          <div className="text-3xl">🛡️</div>
          <div>
            <p className="font-semibold text-green-800 text-sm">100% Money-Back Guarantee</p>
            <p className="text-green-600 text-xs mt-0.5">Rejected by the government? Full refund, no questions asked.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details key={q} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 list-none">
                  <span>{q}</span>
                  <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0">▾</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-brand-800 text-white py-16 px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to get your passport photo?</h2>
        <p className="text-brand-200 mb-8 text-sm">Takes 60 seconds. ICAO compliant. Money-back guarantee.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-white text-brand-800 font-extrabold px-10 py-4 rounded-2xl text-lg shadow-xl hover:bg-brand-50 transition-colors"
        >
          Get My Passport Photo Now — $6.99
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
        <p className="text-brand-300 text-xs mt-4">No account required · Instant download · Stripe secured</p>
      </section>
    </>
  );
}
