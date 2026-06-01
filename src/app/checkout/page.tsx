import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Choose your delivery method and complete your passport photo order.',
};

export default function CheckoutPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your delivery</h1>
        <p className="text-gray-500 text-sm">
          Instant digital download or pickup at CVS / Walgreens near you.
        </p>
      </div>

      {/* Trust strip */}
      <div className="flex items-center justify-center gap-5 text-xs text-gray-400 mb-8 flex-wrap">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          SSL Secured
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
          Powered by Stripe
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Money-back guarantee
        </span>
      </div>

      <CheckoutForm />
    </div>
  );
}
