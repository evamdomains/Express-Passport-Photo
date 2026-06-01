import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import TrustBar from '@/components/TrustBar';
import StickyMobileCTA from '@/components/StickyMobileCTA';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Passport Photo Online — $6.99 | ICAO Compliant | Express Passport Photo',
    template: '%s | Express Passport Photo',
  },
  description:
    'ICAO-compliant passport photos in 60 seconds. AI removes background, checks compliance. Digital download $6.99. CVS/Walgreens pickup $12.99. Money-back guarantee.',
  metadataBase: new URL('https://expresspassportphoto.com'),
  openGraph: {
    siteName: 'Express Passport Photo',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <a href="/" className="shrink-0 font-bold text-lg text-brand-900 tracking-tight">
              Express Passport Photo
            </a>
            <nav className="flex items-center gap-3 sm:gap-6 text-sm text-gray-600">
              <a href="/us-passport-photo" className="hidden lg:block hover:text-gray-900 transition-colors">
                US Passport
              </a>
              <a href="/canada-passport-photo" className="hidden lg:block hover:text-gray-900 transition-colors">
                Canada Passport
              </a>
              <a href="/store-locator" className="hidden sm:block hover:text-gray-900 transition-colors">
                Find a Store
              </a>
              <a
                href="/upload"
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-semibold text-sm"
              >
                Get Started
              </a>
            </nav>
          </div>
        </header>

        <TrustBar />

        {/* pb-20 md:pb-0 reserves space for sticky mobile CTA */}
        <main className="pb-20 md:pb-0">{children}</main>

        <footer className="border-t border-gray-200 mt-16 sm:mt-24 py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid sm:grid-cols-3 gap-8 mb-10">
              <div>
                <a href="/" className="font-bold text-base text-brand-900 tracking-tight">
                  Express Passport Photo
                </a>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  Professional passport photos that meet official government requirements. AI-powered compliance checking.
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                  Photos deleted within 48 hours of order
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">Document types</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/us-passport-photo" className="hover:text-brand-600 transition-colors">US Passport Photo</a></li>
                  <li><a href="/canada-passport-photo" className="hover:text-brand-600 transition-colors">Canadian Passport Photo</a></li>
                  <li><a href="/upload?type=us_visa" className="hover:text-brand-600 transition-colors">US Visa Photo</a></li>
                  <li><a href="/upload?type=canadian_pr_card" className="hover:text-brand-600 transition-colors">Canadian PR Card Photo</a></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">Company</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/" className="hover:text-brand-600 transition-colors">Home</a></li>
                  <li><a href="/store-locator" className="hover:text-brand-600 transition-colors">Find a Store</a></li>
                  <li><a href="/refund-policy" className="hover:text-brand-600 transition-colors">Refund Policy</a></li>
                  <li><a href="/privacy-policy" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <p>© 2025 Express Passport Photo. All rights reserved.</p>
              <p>Not affiliated with any government agency.</p>
            </div>
          </div>
        </footer>

        <StickyMobileCTA />
      </body>
    </html>
  );
}
