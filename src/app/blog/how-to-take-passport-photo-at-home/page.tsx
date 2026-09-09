import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Take a Passport Photo at Home (Step-by-Step Guide 2026)',
  description: 'Learn how to take a government-compliant passport photo at home using just your phone. Background setup, lighting tips, camera settings, and AI processing explained.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog/how-to-take-passport-photo-at-home' },
};

const STEPS = [
  {
    number: '01',
    title: 'Find a plain white or off-white background',
    body: 'The US government requires a plain white or off-white background with no patterns, shadows, or objects. A white wall, a white bedsheet taped flat, or a large piece of white poster board all work well. Make sure the background is evenly lit — no shadows falling on it from you or nearby objects.',
  },
  {
    number: '02',
    title: 'Set up good lighting',
    body: 'Natural light from a window is ideal — position yourself facing the window so the light falls evenly on your face. Avoid overhead lighting that creates shadows under your eyes or nose. If you\'re using indoor lighting, use two lamps on either side of your face at roughly the same height as your head.',
  },
  {
    number: '03',
    title: 'Position your camera at eye level',
    body: 'The camera should be at eye level, not angled up or down. Use a tripod or prop your phone against something stable. Keep the camera about 4-6 feet away from you — this reduces lens distortion that can make your face look unnatural.',
  },
  {
    number: '04',
    title: 'Follow the pose requirements',
    body: 'Look straight at the camera with a neutral expression or a natural smile (mouth closed). Both eyes must be open and clearly visible. Face the camera directly — no turning to the side. No glasses (US passports have not allowed glasses since 2016). If you wear a head covering for religious reasons, it is allowed as long as your face is fully visible.',
  },
  {
    number: '05',
    title: 'Take multiple shots',
    body: 'Take at least 10-15 photos and pick the best one. Minor variations in expression, lighting, or slight head position changes can make a big difference. The more options you have, the better your chances of getting one that passes compliance checks.',
  },
  {
    number: '06',
    title: 'Upload to an AI passport photo tool',
    body: 'Upload your best photo to Express Passport Photo. Our AI removes the background, applies a compliant white background, checks head size and position, verifies lighting, and produces a print-ready 2×2 inch photo — all in about 30 seconds. You pay $0.99 only if the result meets government standards.',
  },
];

const MISTAKES = [
  'Wearing glasses (not allowed for US passports)',
  'Shadows on the background or face',
  'Head turned to the side',
  'Eyes not fully open',
  'Background with patterns, colors, or objects',
  'Photo taken at an angle (camera above or below eye level)',
  'Too much or too little head in the frame',
  'Flash causing red-eye or harsh shadows',
];

const FAQ = [
  {
    q: 'Can I take my own passport photo with my phone?',
    a: 'Yes. Modern smartphone cameras produce more than enough resolution for passport photos. The key is good lighting, a plain white background, and the correct head position. Using an AI tool to process the photo ensures it meets the exact size and background specifications.',
  },
  {
    q: 'Does the background have to be pure white?',
    a: 'It must be white or off-white — no patterns, colors, or visible objects. If you use an AI passport photo service, the background is automatically replaced with a compliant white background, so even if your background isn\'t perfect, the final photo will be.',
  },
  {
    q: 'Can I smile in my passport photo?',
    a: 'You can have a natural, relaxed expression with a slight smile — but your mouth must be closed. A big open-mouth smile is not allowed. A neutral expression is always the safest choice.',
  },
  {
    q: 'What size does a passport photo need to be?',
    a: 'For a US passport, the photo must be exactly 2×2 inches (51×51 mm). Your head must be between 1 inch and 1⅜ inches (25-35 mm) from the bottom of the chin to the top of the head. AI tools handle this sizing automatically.',
  },
  {
    q: 'Can I wear makeup in a passport photo?',
    a: 'Yes, you can wear everyday makeup. The photo just needs to be a true likeness of your current appearance. Heavy filters or editing that significantly changes your appearance are not allowed.',
  },
  {
    q: 'How do I print my home passport photo?',
    a: 'Our AI tool provides a print-ready 4×6 PDF with 4 passport photos tiled on it. You can print this at any CVS Photo, Walgreens Photo, or photo lab for about $0.35 — getting you 4 prints for under $1.35 total.',
  },
];

export default function HomePassportPhotoPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="px-4 py-14 sm:py-18">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold mb-6 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            All guides
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">How-To Guide</span>
            <span className="text-xs text-gray-400">September 8, 2026</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">7 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            How to Take a Passport Photo at Home
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            You don&apos;t need a studio to get a government-compliant passport photo. With the right background, lighting, and a phone camera, you can do it yourself in minutes.
          </p>
        </div>
      </section>

      {/* Quick requirements box */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto rounded-2xl bg-brand-50 border border-brand-100 p-6">
          <p className="text-sm font-bold text-brand-800 mb-3">US Passport Photo Requirements at a Glance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-brand-700">
            {[
              'Size: 2×2 inches (51×51 mm)',
              'Head: 1–1⅜ inches from chin to top',
              'Background: Plain white or off-white',
              'Expression: Neutral or natural smile',
              'Eyes: Open, clearly visible',
              'Glasses: Not permitted',
              'Taken within last 6 months',
              'No hats or head coverings (except religious)',
            ].map((req) => (
              <div key={req} className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {req}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Step-by-step guide</h2>
          <div className="space-y-5">
            {STEPS.map((step) => (
              <div key={step.number} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-extrabold text-brand-100 shrink-0 leading-none">{step.number}</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common mistakes */}
      <section className="px-4 pb-14 bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common mistakes to avoid</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MISTAKES.map((mistake) => (
              <div key={mistake} className="flex items-start gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-sm text-gray-700">{mistake}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors open:border-brand-200 open:bg-brand-50/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm sm:text-base font-semibold text-gray-900 list-none">
                  {item.q}
                  <svg className="w-5 h-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready? Upload your selfie now</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-xl mx-auto">
            AI removes the background, checks compliance, and delivers a print-ready photo in 30 seconds. $0.99. Money-back guarantee.
          </p>
          <Link
            href="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get my passport photo — $0.99
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
