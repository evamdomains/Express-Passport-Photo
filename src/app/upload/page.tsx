import type { Metadata } from 'next';
import PhotoUploadFlow from '@/components/PhotoUploadFlow';
import AiPreviewDemo from '@/components/AiPreviewDemo';
import AutoScrollToStart from '@/components/AutoScrollToStart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upload Your Photo — Get a Compliant Passport Photo in 60 Seconds',
  description: 'Upload your selfie and get a print-ready, government-accepted passport photo in under 60 seconds.',
};

const HERO_TRUST = [
  'ICAO Compliant',
  'Government Accepted',
  'AI Background Removal',
  'Ready in Under 60 Seconds',
];

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: '📷',
    title: 'Upload Your Selfie',
    desc: 'Use any smartphone photo — any background works.',
  },
  {
    step: '2',
    icon: '🤖',
    title: 'AI Compliance Check',
    desc: 'Automatic background removal and validation.',
  },
  {
    step: '3',
    icon: '⬇️',
    title: 'Download Passport Photo',
    desc: 'Print-ready files, ready in seconds.',
  },
];

const TRUST_SIGNALS = [
  { icon: '🏛️', label: 'Government Accepted' },
  { icon: '✅', label: 'ICAO Compliant' },
  { icon: '🛡️', label: 'Money-Back Guarantee' },
  { icon: '⚡', label: 'Ready in Under 60 Seconds' },
  { icon: '👤', label: 'No Account Required' },
  { icon: '🔒', label: 'Photos Deleted Within 48 Hours' },
];

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ document?: string; type?: string }>;
}) {
  const sp = await searchParams;
  // No document selected yet → show the selection grid (wide); otherwise the upload step.
  const choosing = !(sp.document ?? sp.type);
  return (
    <>
      {/* From the homepage CTA (?autoscroll=1): show the hero, then slide down
          to the document picker after 5s. */}
      <AutoScrollToStart />

      {/* ── SECTION 1 · PREMIUM HERO (only while choosing — a selected document
            lands straight on the upload widget) ──────────────────────────── */}
      {choosing && (
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/50 to-white">
        {/* Decorative blurred blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1.5 text-xs font-semibold ring-1 ring-brand-100 mb-5">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-powered · Done in under a minute
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-4">
              Government-Accepted Passport Photos in{' '}
              <span className="text-brand-600">60 Seconds</span>
            </h1>

            <p className="text-gray-500 text-base sm:text-lg mb-6 max-w-lg leading-relaxed">
              Upload any selfie. Our AI removes the background, checks compliance, and generates a
              print-ready passport photo.
            </p>

            {/* Trust indicators */}
            <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5 mb-8 max-w-md">
              {HERO_TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg className="h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>

            {/* Secondary text */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">Starting at $0.99</span>
              <span className="text-gray-300">·</span>
              <span>No Account Required</span>
              <span className="text-gray-300">·</span>
              <span>100% Money-Back Guarantee</span>
            </div>
          </div>

          {/* Right: animated hero "video" */}
          <div className="lg:pl-4">
            <AiPreviewDemo />
          </div>
        </div>
      </section>
      )}

      {/* ── SECTION 2 · DOCUMENT SELECTION + UPLOAD ──────────────────────── */}
      <section id="start" className={`scroll-mt-28 mx-auto px-4 py-12 sm:py-16 ${choosing ? 'max-w-6xl' : 'max-w-2xl'}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {choosing ? 'Choose your document type' : 'Upload your photo'}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            {choosing
              ? 'Select the document you need and upload your photo on the next step.'
              : "Upload a clear, front-facing selfie and we'll handle the rest."}
          </p>
        </div>

        {/* Processing time notice */}
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 text-sm text-brand-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Your photo will be ready in <strong>~45 seconds</strong></span>
        </div>

        {/* Help customers pass first time: link to the requirements guide. */}
        <a
          href="/photo-requirements"
          className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <span className="flex items-center gap-2 text-gray-700">
            <svg className="w-4 h-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z" />
            </svg>
            Not sure what’s accepted? <strong className="font-semibold text-brand-700">View Photo Requirements</strong>
          </span>
          <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <PhotoUploadFlow />
      </section>

      {/* ── SECTION 3 · HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-gray-50 py-14 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 relative">
            {/* Connector line (desktop) */}
            <div aria-hidden="true" className="hidden sm:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-brand-100 z-0" />
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="group relative z-10 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl ring-2 ring-brand-100 transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>
                <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-brand-600 px-2 text-[11px] font-bold text-white">
                  Step {step}
                </span>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-14 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {TRUST_SIGNALS.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-brand-200"
            >
              <span className="text-2xl shrink-0" aria-hidden="true">{icon}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
