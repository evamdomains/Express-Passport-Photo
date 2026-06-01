import type { Metadata } from 'next';
import PhotoUploadFlow from '@/components/PhotoUploadFlow';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upload Your Photo — Get a Compliant Passport Photo in 60 Seconds',
  description: 'Upload your selfie and get a print-ready, government-accepted passport photo in under 60 seconds.',
};

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Upload your photo</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Select your document type, upload a clear selfie, and we'll handle the rest.
        </p>
      </div>

      {/* Processing time notice */}
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 text-sm text-brand-700">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        <span>Your photo will be ready in <strong>~45 seconds</strong></span>
      </div>

      <PhotoUploadFlow />

      {/* Tips */}
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          { icon: '💡', title: 'Good lighting', tip: 'Face a window or bright lamp. Avoid harsh shadows.' },
          { icon: '📐', title: 'Face the camera', tip: 'Look straight ahead. No tilting or turning.' },
          { icon: '😐', title: 'Neutral expression', tip: 'Relax your face. Closed mouth, eyes open.' },
          { icon: '👕', title: 'Any background', tip: 'Stand anywhere — we replace the background automatically.' },
        ].map(({ icon, title, tip }) => (
          <div key={title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="text-xl shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tip}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust signals */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
          SSL Secured
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm3.707 6.293a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          No account required
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd"/></svg>
          100% money-back guarantee
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2z"/></svg>
          Photos deleted in 48hrs
        </span>
      </div>
    </div>
  );
}
