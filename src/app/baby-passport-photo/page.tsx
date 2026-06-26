import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PhotoUploadFlow from '@/components/PhotoUploadFlow';

// ─── Hero side images (configurable) ───────────────────────────────────────
// Left = infant passport examples; right = US passport example. Both float as
// animated 3D cards (glow halo + float motion + shine sweep), mirroring the
// US Passport / US Visa hero treatment. To swap either, change only the path.
const BABY_HERO_LEFT_IMAGE = '/images/backgrounds/baby_left_card.png';
const BABY_HERO_LEFT_WIDTH = 800;
const BABY_HERO_LEFT_HEIGHT = 660;
const BABY_HERO_RIGHT_IMAGE = '/images/backgrounds/baby_right_card.png';
const BABY_HERO_RIGHT_WIDTH = 794;
const BABY_HERO_RIGHT_HEIGHT = 658;

export const metadata: Metadata = {
  title: 'Baby Passport Photo Online — $0.99 | 2×2 Inches, ICAO Compliant',
  description:
    'Get a compliant baby or infant passport photo in 60 seconds. 2×2 inches, white background, State Department compliant. AI removes the background — no studio needed. Instant download $0.99.',
  keywords: [
    'baby passport photo',
    'infant passport photo',
    'newborn passport photo',
    'baby passport photo online',
    'child passport photo',
    'passport photo for baby',
    '2x2 baby passport photo',
    'baby passport photo at home',
  ],
  alternates: { canonical: 'https://expresspassportphoto.com/baby-passport-photo' },
  openGraph: {
    title: 'Baby Passport Photo — $0.99 | Express Passport Photo',
    description: 'ICAO-compliant baby & infant passport photos. 2×2 inches, white background. Take it at home, no studio needed.',
    images: [{ url: '/og-baby-passport.png', width: 1200, height: 630 }],
  },
};

const FAQS = [
  { q: 'What size is a baby passport photo?', a: 'A baby passport photo is the same size as an adult US passport photo: exactly 2×2 inches (51×51mm), printed at 300 DPI (600×600 pixels). The head should be centered and sized like any other passport photo — our AI checks this automatically.' },
  { q: 'Does my baby need to have their eyes open?', a: 'Ideally yes, but the US State Department makes an exception for infants and very young children who cannot reliably keep their eyes open. A natural, relaxed photo with eyes mostly open is best — our checker will flag closed eyes so you can retake if needed.' },
  { q: 'Can I hold my baby for the photo?', a: 'No hands, arms, or other people may be visible. Lay your baby on their back on a plain white sheet and take the photo from directly above, or prop them in a car seat with a white blanket. Our AI replaces the background with compliant white automatically.' },
  { q: 'What background do I need for a baby passport photo?', a: 'Plain white or off-white with no shadows, patterns, or toys. The easiest method is laying the baby on a white sheet — our AI then removes and replaces the background with a compliant white automatically.' },
  { q: 'Can my baby have a pacifier or toy in the photo?', a: 'No. Pacifiers, bottles, toys, and hands must not be visible. The baby must be alone in the frame with nothing covering the face.' },
  { q: 'Does my baby need a neutral expression?', a: 'A neutral expression is preferred, but the rules are relaxed for infants. The most important things are a clear, front-facing view of the face with eyes open if possible and mouth closed.' },
  { q: 'How do I take a passport photo of a newborn?', a: 'Lay the newborn on their back on a plain white sheet and photograph from directly above in soft, even light. Make sure no hands support the head within the frame. Upload it and our AI handles the background and compliance checks.' },
  { q: 'How recent does the baby photo need to be?', a: 'Within the last 6 months. Babies change quickly, so use a recent photo that represents your child\'s current appearance.' },
  { q: 'What if my baby photo is rejected?', a: 'We offer a 100% refund if your photo is rejected by a government agency for any compliance reason covered by our checks. See our refund policy for full details.' },
  { q: 'What format do I receive the files in?', a: 'A high-res JPEG plus a print-ready 4×6 PDF with multiple copies tiled. Take the PDF to any CVS, Walgreens, or photo lab for a standard 4×6 print.' },
  { q: 'Is a baby passport photo different from an adult one?', a: 'The technical specs are identical (2×2 inches, white background, head sizing). The only differences are relaxed expression/eyes-open rules and that the baby must be photographed alone with no hands or props visible.' },
  { q: 'How long does the whole process take?', a: 'About 60 seconds from upload to download. Background removal, compliance checking, and PDF generation happen automatically after you upload.' },
];

export default function BabyPassportPhotoPage() {
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
          <span className="text-gray-600">Baby Passport Photo</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white py-16 px-4 mt-2">
        <div className="max-w-[88rem] mx-auto flex items-center justify-center gap-6 lg:gap-8 xl:gap-12">
          {/* Left image — infant passport photo (hidden below lg) */}
          <div className="hidden lg:block flex-1 max-w-lg perspective-1000">
            <div className="group relative preserve-3d">
              {/* Pulsing halo */}
              <div
                aria-hidden="true"
                className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-sky-400/40 via-brand-400/30 to-cyan-300/40 blur-2xl animate-glow-pulse"
              />
              {/* Floating 3D card */}
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-2xl animate-float-3d transition-all duration-500 ease-out will-change-transform group-hover:scale-105 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
                <Image
                  src={BABY_HERO_LEFT_IMAGE}
                  width={BABY_HERO_LEFT_WIDTH}
                  height={BABY_HERO_LEFT_HEIGHT}
                  alt="Examples of compliant infant and baby passport photos"
                  priority
                  unoptimized
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

          {/* Center content */}
          <div className="shrink-0 w-full max-w-lg text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Baby Passport Photo Online
            </h1>
            <p className="text-brand-200 text-base mb-2">2×2 inches · White background · State Department compliant</p>
            <p className="text-brand-300 text-sm mb-8">For infants &amp; children · 600×600px at 300 DPI · Take it at home</p>
            <div className="flex items-center justify-center gap-4 text-xs text-brand-300 flex-wrap">
              <span>✓ No account required</span>
              <span>✓ Money-back guarantee</span>
              <span>✓ Instant download</span>
            </div>
          </div>

          {/* Right image — US passport example (hidden below lg) */}
          <div className="hidden lg:block flex-1 max-w-lg perspective-1000">
            <div className="group relative preserve-3d">
              {/* Pulsing halo */}
              <div
                aria-hidden="true"
                className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-cyan-300/40 via-brand-400/30 to-sky-400/40 blur-2xl animate-glow-pulse"
              />
              {/* Floating 3D card */}
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-2xl animate-float-3d-alt transition-all duration-500 ease-out will-change-transform group-hover:scale-105 group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
                <Image
                  src={BABY_HERO_RIGHT_IMAGE}
                  width={BABY_HERO_RIGHT_WIDTH}
                  height={BABY_HERO_RIGHT_HEIGHT}
                  alt="Example of a compliant US passport photo"
                  unoptimized
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
        <h2 className="text-2xl font-bold text-center mb-8">Choose your document type</h2>
        <PhotoUploadFlow allowedTypes={['baby_passport']} />
      </section>

      {/* Official specs */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Official baby passport photo requirements</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Size', value: '2×2 in (51×51mm)' },
              { label: 'Resolution', value: '600×600px, 300 DPI' },
              { label: 'Background', value: 'Plain white/off-white' },
              { label: 'Who\'s in frame', value: 'Baby alone — no hands' },
              { label: 'Expression', value: 'Neutral (relaxed for infants)' },
              { label: 'Eyes', value: 'Open if possible' },
              { label: 'Props', value: 'No pacifiers or toys' },
              { label: 'Photo age', value: 'Within last 6 months' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
          <a
            href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
            Official US State Department baby photo requirements ↗
          </a>
        </div>
      </section>

      {/* Photo tips */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold mb-8">Tips for taking your baby&apos;s passport photo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: '🛏️', title: 'Lay them on a white sheet', tip: 'Place your baby on their back on a plain white sheet or blanket and shoot from directly above. Our AI handles the background.' },
            { icon: '🙌', title: 'Keep hands out of frame', tip: 'No one may be touching or holding the baby in the photo. Support them just outside the camera view.' },
            { icon: '💡', title: 'Soft, even lighting', tip: 'Use natural daylight near a window. Avoid harsh overhead light and shadows on the face or background.' },
            { icon: '👀', title: 'Eyes open if you can', tip: 'Try to catch your baby alert with eyes open. The rules are relaxed for infants who can\'t keep them open.' },
            { icon: '🍼', title: 'No pacifiers or toys', tip: 'Remove pacifiers, bottles, and toys. Nothing should cover or distract from the face.' },
            { icon: '📱', title: 'Shoot straight-on', tip: 'Hold the camera level and centered over the face — not tilted. Our AI checks head position automatically.' },
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
          <h2 className="text-2xl font-bold mb-2">What makes a baby passport photo get rejected</h2>
          <p className="text-gray-500 text-sm mb-8">Our AI catches all of these before you pay.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Hands or another person visible',
              'Pacifier, bottle, or toy in frame',
              'Colored or patterned background',
              'Heavy shadows on face or background',
              'Head tilted or turned to the side',
              'Face too small or too large in frame',
              'Photo older than 6 months',
              'Hat or head covering (non-religious)',
              'Toys or props beside the baby',
              'More than one person in the photo',
              'Heavy photo editing or filters',
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
