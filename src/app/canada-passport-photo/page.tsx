import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PhotoUploadFlow from '@/components/PhotoUploadFlow';

// ─── Hero side images (configurable) ───────────────────────────────────────
// To swap either image later: drop a new file in public/images/backgrounds/
// and change ONLY the path below. No other code changes required.
const CA_HERO_LEFT_IMAGE = '/images/backgrounds/canadian_passport.png';
const CA_HERO_RIGHT_IMAGE = '/images/backgrounds/canadian_pr_card.png';
// Native size of the side images (all 768×512) — used by next/image to keep
// aspect ratio and avoid layout shift. Update if a replacement differs.
const CA_HERO_IMAGE_WIDTH = 768;
const CA_HERO_IMAGE_HEIGHT = 512;

export const metadata: Metadata = {
  title: 'Canadian Passport Photo Online — $4.99 | 50×70mm, IRCC Compliant',
  description:
    'Get a compliant Canadian passport photo in 60 seconds. 50×70mm, white background, face height 31–36mm. Meets IRCC requirements. Instant download $4.99.',
  alternates: { canonical: 'https://expresspassportphoto.com/canada-passport-photo' },
  openGraph: {
    title: 'Canadian Passport Photo — $4.99 | Express Passport Photo',
    description: 'IRCC-compliant Canadian passport photos. 50×70mm, white background. Instant download.',
    images: [{ url: '/og-canada-passport.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  { q: 'What size is a Canadian passport photo?', a: 'Canadian passport photos must be 50×70mm (approximately 2×2.75 inches). The face height — chin to crown — must be 31–36mm, taking up 44–51% of the image height.' },
  { q: 'What background is required for a Canadian passport photo?', a: 'A plain white background. No patterns, shadows, or other people. The subject must be clearly separated from the background.' },
  { q: 'Can I wear glasses in a Canadian passport photo?', a: 'No. IRCC requires no glasses in passport photos, including prescription glasses.' },
  { q: 'What is the face height requirement?', a: 'The face height — chin to crown — must be 31–36mm in a 70mm tall photo. Our AI measures this automatically and alerts you if it\'s out of range.' },
  { q: 'Does a Canadian passport photo need to be taken professionally?', a: 'No, but it must meet all technical requirements. Our AI checks compliance automatically, so any clear smartphone photo can work.' },
  { q: 'How recent does the photo need to be?', a: 'Taken within the last 6 months, accurately representing your current appearance.' },
  { q: 'Can I smile in a Canadian passport photo?', a: 'No. IRCC requires a neutral expression with mouth closed. Unlike US rules, a natural smile is not accepted for Canadian passports.' },
  { q: 'Can the same photo be used for a Canadian PR Card?', a: 'Yes. The Canadian PR Card uses identical specs: 50×70mm, white background, face height 31–36mm. One set of photos covers both.' },
  { q: 'Does someone need to sign the back of the photo?', a: 'For a new Canadian passport, a guarantor must sign the back of one photo. For renewals and PR Cards, no signature is required.' },
  { q: 'What files do I receive?', a: 'A high-resolution JPEG and a print-ready 4×6 PDF with 4 copies tiled. Take the PDF to any CVS or Walgreens for a standard 4×6 print.' },
  { q: 'What if my photo is rejected?', a: 'We offer a 100% refund if your photo is rejected by a government agency for any compliance reason covered by our checks.' },
  { q: 'Can I use a filter on my Canadian passport photo?', a: 'No. Filters, edits, and color corrections are not permitted. The photo must accurately represent your current appearance.' },
  { q: 'Does my Canadian passport photo need to show my ears?', a: 'Ears do not need to be visible. The focus is on the face being clearly lit and the correct face height being met.' },
  { q: 'Can I wear a headscarf or turban in a Canadian passport photo?', a: 'Religious head coverings are permitted as long as the full face is visible from chin to forehead and ear-to-ear.' },
  { q: 'How long does it take to get my photo?', a: 'About 60 seconds from upload to download. The AI handles background removal, compliance checking, and file generation automatically.' },
];

export default function CanadaPassportPhotoPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-gray-600">Canadian Passport Photo</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white py-16 px-4 mt-2">
        <div className="max-w-[88rem] mx-auto flex items-center justify-center gap-6 lg:gap-8 xl:gap-12">
          {/* Left image — hidden below lg so tablet/mobile layout is unchanged */}
          <div className="hidden lg:block flex-1 max-w-lg perspective-1000">
            <div className="group relative preserve-3d">
              {/* Pulsing halo */}
              <div
                aria-hidden="true"
                className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-sky-400/40 via-brand-400/30 to-cyan-300/40 blur-2xl animate-glow-pulse"
              />
              {/* Floating 3D card */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 animate-float-3d transition-all duration-500 ease-out will-change-transform group-hover:scale-105 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
                <Image
                  src={CA_HERO_LEFT_IMAGE}
                  width={CA_HERO_IMAGE_WIDTH}
                  height={CA_HERO_IMAGE_HEIGHT}
                  alt="Example of a compliant Canadian passport photo"
                  sizes="(min-width: 1024px) 38vw, 1px"
                  className="block w-full h-auto"
                />
                {/* Light sweep */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shine"
                />
              </div>
            </div>
          </div>

          {/* Center content (unchanged) */}
          <div className="shrink-0 w-full max-w-lg text-center">
          <div className="text-5xl mb-4">🇨🇦</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Canadian Passport Photo Online
          </h1>
          <p className="text-brand-200 text-base mb-2">50×70mm · White background · IRCC compliant</p>
          <p className="text-brand-300 text-sm mb-8">Face height 31–36mm · Also valid for Canadian PR Card</p>
          <Link
            href="/upload?type=canadian_passport"
            className="inline-flex items-center gap-2 bg-white text-brand-800 font-extrabold px-8 py-4 rounded-2xl text-lg shadow-xl hover:bg-brand-50 transition-colors"
          >
            Get My Passport Photo — $4.99
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
          </Link>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-brand-300 flex-wrap">
            <span>✓ No account required</span>
            <span>✓ Money-back guarantee</span>
            <span>✓ Instant download</span>
          </div>
          </div>

          {/* Right image — hidden below lg so tablet/mobile layout is unchanged */}
          <div className="hidden lg:block flex-1 max-w-lg perspective-1000">
            <div className="group relative preserve-3d">
              {/* Pulsing halo */}
              <div
                aria-hidden="true"
                className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-cyan-300/40 via-brand-400/30 to-sky-400/40 blur-2xl animate-glow-pulse"
              />
              {/* Floating 3D card */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 animate-float-3d-alt transition-all duration-500 ease-out will-change-transform group-hover:scale-105 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
                <Image
                  src={CA_HERO_RIGHT_IMAGE}
                  width={CA_HERO_IMAGE_WIDTH}
                  height={CA_HERO_IMAGE_HEIGHT}
                  alt="Example of a compliant Canadian PR Card photo"
                  sizes="(min-width: 1024px) 38vw, 1px"
                  className="block w-full h-auto"
                />
                {/* Light sweep */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shine"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload widget */}
      <section className="max-w-2xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center mb-8">Upload your photo</h2>
        <PhotoUploadFlow allowedTypes={['canadian_passport', 'canadian_pr_card']} />
      </section>

      {/* Official specs */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Official IRCC requirements</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Size', value: '50×70mm (2×2.75 in)' },
              { label: 'Resolution', value: '591×827px, 300 DPI' },
              { label: 'Background', value: 'Plain white' },
              { label: 'Face height', value: '31–36mm (chin to crown)' },
              { label: 'Expression', value: 'Neutral, mouth closed' },
              { label: 'Eyes', value: 'Open, directly at camera' },
              { label: 'Glasses', value: 'Not permitted' },
              { label: 'Photo age', value: 'Within last 6 months' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <a
            href="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
            Official IRCC Canadian passport photo requirements ↗
          </a>
        </div>
      </section>

      {/* Photo tips */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-8">Tips for a great Canadian passport photo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: '💡', title: 'Even, natural lighting', tip: 'Face a window for soft, even light. Avoid shadows on the background or under your nose.' },
            { icon: '📐', title: 'Keep your head straight', tip: 'Eyes level, facing directly forward. The photo is taller than a US passport photo, so posture matters more.' },
            { icon: '😐', title: 'Strict neutral expression', tip: 'Canadian requirements are stricter than US — mouth closed, no smile, eyes open and level.' },
            { icon: '🎽', title: 'Avoid white clothing', tip: 'Against the white background, white shirts can cause issues. A dark top creates clear contrast.' },
            { icon: '🕶️', title: 'No accessories', tip: 'Remove glasses, hats, and large jewelry. Religious head coverings are permitted.' },
            { icon: '📏', title: 'Fill the frame correctly', tip: 'Your face should occupy 44–51% of the photo height. Our AI measures this and alerts you automatically.' },
          ].map(({ icon, title, tip }) => (
            <div key={title} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Common rejection reasons */}
      <section className="bg-red-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Common Canadian passport photo rejections</h2>
          <p className="text-gray-500 text-sm mb-8">Our AI catches all of these automatically.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Glasses (including prescription)',
              'Non-white background',
              'Face height outside 31–36mm',
              'Smiling or open mouth',
              'Eyes not looking at camera',
              'Shadows on face or background',
              'Photo older than 6 months',
              'Hat or head covering (non-religious)',
              'Heavy filters or digital editing',
              'Multiple people in the photo',
              'Head tilted or turned',
              'Poor focus or motion blur',
            ].map((reason) => (
              <div key={reason} className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 text-sm">
                <span className="text-red-500 font-bold shrink-0">✗</span>
                <span className="text-gray-700">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-gray-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 list-none">
                {q}
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0">▾</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
