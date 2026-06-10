import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PhotoUploadFlow from '@/components/PhotoUploadFlow';

// ─── Hero side images (configurable) ───────────────────────────────────────
// To swap either image later: drop a new file in public/images/backgrounds/
// and change ONLY the path below. No other code changes required.
const US_HERO_LEFT_IMAGE = '/images/backgrounds/us_passport.png';
const US_HERO_RIGHT_IMAGE = '/images/backgrounds/us_visa.png';
// Native size of the side images (all 768×512) — used by next/image to keep
// aspect ratio and avoid layout shift. Update if a replacement differs.
const US_HERO_IMAGE_WIDTH = 768;
const US_HERO_IMAGE_HEIGHT = 512;

export const metadata: Metadata = {
  title: 'US Passport Photo Online — $0.99 | 2×2 Inches, ICAO Compliant',
  description:
    'Get a compliant US passport photo in 60 seconds. 2×2 inches, white background, ICAO compliant. Instant download $0.99. Meets all State Department requirements.',
  alternates: { canonical: 'https://expresspassportphoto.com/us-passport-photo' },
  openGraph: {
    title: 'US Passport Photo — $0.99 | Express Passport Photo',
    description: 'ICAO-compliant US passport photos. 2×2 inches, white background. Instant download.',
    images: [{ url: '/og-us-passport.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  { q: 'What size is a US passport photo?', a: 'US passport photos must be exactly 2×2 inches (51×51mm), printed at 300 DPI (600×600 pixels). The head height — chin to top of hair — must be between 1 inch and 1⅜ inches, occupying 50–69% of the image.' },
  { q: 'What background color is required for a US passport photo?', a: 'Plain white or off-white with no patterns, shadows, or other people. Our AI automatically replaces any background with a compliant white background.' },
  { q: 'Can I wear glasses in my US passport photo?', a: 'No. The State Department has required no glasses since November 1, 2016. Prescription glasses, sunglasses, and tinted lenses are all prohibited.' },
  { q: 'Can I smile in my US passport photo?', a: 'A natural closed-mouth expression is safest. A natural smile is technically permitted if it does not distort facial features. Wide smiles showing teeth may cause rejection.' },
  { q: 'How recent does my passport photo need to be?', a: 'Within the last 6 months. The photo must represent your current appearance. Significant changes (new beard, major weight change) may require a retake.' },
  { q: 'Can I take my own passport photo at home?', a: 'Yes. Take a selfie against any background — we replace it automatically with compliant white. Good lighting and a neutral expression are all you need.' },
  { q: 'What if my passport photo is rejected by the government?', a: 'We offer a 100% refund if your photo is rejected for any compliance reason covered by our checks. See our refund policy for full details.' },
  { q: 'What format do I receive my files in?', a: 'Digital Download ($0.99): a high-res JPEG plus a print-ready 4×6 PDF with multiple copies tiled. Printed & Ready ($0.99): six physical pics at a nearby CVS or Walgreens.' },
  { q: 'How do I print my digital passport photo?', a: 'Take the 4×6 PDF to any CVS, Walgreens, or photo lab and ask for a standard 4×6 print. Cut out the photos. Printing typically costs $0.35–$0.50.' },
  { q: 'Is a US passport photo the same as a US visa photo?', a: 'Yes — identical specifications: 2×2 inches, white background, head 50–69% of frame. One set of photos works for both a passport and a US visa application.' },
  { q: 'Can babies and infants have passport photos taken?', a: 'Yes, but the same rules apply. Eyes must be open and looking at the camera. The infant must be alone in the photo — no hands or car seats visible.' },
  { q: 'Do I need to print my passport photo at a specific size?', a: 'Print the 4×6 PDF as a standard 4×6 photo. The photos are pre-sized and positioned — just cut along the white lines after printing.' },
  { q: 'What happens if my photo is too dark or blurry?', a: 'Our AI checks image quality and will alert you before you pay if your photo is too dark or blurry. You can retake and re-upload for free.' },
  { q: 'Can I use a filter or edit my passport photo?', a: 'No. Filters, edits, and color corrections are not permitted. The photo must accurately represent your current appearance.' },
  { q: 'How long does the whole process take?', a: 'About 60 seconds from upload to download. Background removal, compliance checking, and PDF generation happen automatically after you upload.' },
];

export default function USPassportPhotoPage() {
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
          <span className="text-gray-600">US Passport Photo</span>
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
                  src={US_HERO_LEFT_IMAGE}
                  width={US_HERO_IMAGE_WIDTH}
                  height={US_HERO_IMAGE_HEIGHT}
                  alt="Example of a compliant US passport photo"
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
          <div className="text-5xl mb-4">🇺🇸</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            US Passport Photo Online
          </h1>
          <p className="text-brand-200 text-base mb-2">2×2 inches · White background · State Department compliant</p>
          <p className="text-brand-300 text-sm mb-8">ICAO standard · 600×600px at 300 DPI · Head 50–69% of frame</p>
          <Link
            href="/upload?type=us_passport"
            className="inline-flex items-center gap-2 bg-white text-brand-800 font-extrabold px-8 py-4 rounded-2xl text-lg shadow-xl hover:bg-brand-50 transition-colors"
          >
            Get My Passport Photo — $0.99
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
                  src={US_HERO_RIGHT_IMAGE}
                  width={US_HERO_IMAGE_WIDTH}
                  height={US_HERO_IMAGE_HEIGHT}
                  alt="Example of a compliant US visa photo"
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
        <PhotoUploadFlow allowedTypes={['us_passport', 'us_visa']} />
      </section>

      {/* Official specs */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Official State Department requirements</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Size', value: '2×2 in (51×51mm)' },
              { label: 'Resolution', value: '600×600px, 300 DPI' },
              { label: 'Background', value: 'Plain white/off-white' },
              { label: 'Head height', value: '1"–1⅜" (50–69%)' },
              { label: 'Expression', value: 'Neutral or natural smile' },
              { label: 'Eyes', value: 'Open, no glasses' },
              { label: 'Head coverings', value: 'None (religious OK)' },
              { label: 'Photo age', value: 'Within last 6 months' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <a
            href="https://travel.state.gov/content/travel/en/passports/need-passport/photos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
            Official US State Department photo requirements ↗
          </a>
        </div>
      </section>

      {/* Photo tips */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-8">Tips for taking a great passport photo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: '💡', title: 'Use natural light', tip: 'Stand facing a window. Avoid harsh overhead lighting that creates shadows under your nose or chin.' },
            { icon: '📐', title: 'Face directly forward', tip: 'Your head should be straight — no tilting left/right or up/down. Imagine aligning your nose with the center of the frame.' },
            { icon: '😐', title: 'Neutral expression', tip: 'Relax your face. Mouth closed, eyes open and looking directly at the camera. Avoid squinting or raising eyebrows.' },
            { icon: '👕', title: 'Any background works', tip: 'Stand against any wall — our AI automatically replaces the background with compliant white. Avoid white shirts (they blend in).' },
            { icon: '🕶️', title: 'Remove accessories', tip: 'Take off glasses, hats, and heavy jewelry. Hearing aids are allowed. Religious head coverings are allowed.' },
            { icon: '📱', title: 'Use portrait mode', tip: 'Hold your phone at eye level, arm extended. Portrait mode on modern smartphones produces excellent results.' },
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
          <h2 className="text-2xl font-bold mb-2">What makes a passport photo get rejected</h2>
          <p className="text-gray-500 text-sm mb-8">Our AI catches all of these before you pay.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Glasses (even prescription)',
              'Colored or patterned background',
              'Head too small in frame (under 50%)',
              'Head too large in frame (over 69%)',
              'Eyes closed or squinting',
              'Heavy shadows on face or background',
              'Photo older than 6 months',
              'Hat or head covering (non-religious)',
              'Heavy photo editing or filters',
              'Multiple people in the photo',
              'Head tilted more than ~10 degrees',
              'Mouth open or unusual expression',
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
