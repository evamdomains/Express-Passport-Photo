import type { Metadata } from 'next';
import Image from 'next/image';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import TrustBar from '@/components/TrustBar';
import StickyMobileCTA from '@/components/StickyMobileCTA';
import MainNav from '@/components/MainNav';
import './globals.css';

// Brand logo: the original logo.jpeg, trimmed of its large white margins and
// with the surrounding white made transparent (interior silhouette preserved),
// so it fills the space and sits cleanly on both the white header and gray
// footer. `unoptimized` keeps Next from re-encoding to WebP and flattening the
// alpha onto white. Intrinsic size of the processed PNG below.
const LOGO_SRC = '/images/backgrounds/logo-mark.png';
const LOGO_W = 922;
const LOGO_H = 788;

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Passport Photo Online — $0.99 | ICAO Compliant | Express Passport Photo',
    template: '%s | Express Passport Photo',
  },
  description:
    'ICAO-compliant passport photos in 30 seconds. AI removes background, checks compliance. Digital download $0.99. CVS/Walgreens pickup $0.99. Money-back guarantee.',
  metadataBase: new URL('https://expresspassportphoto.com'),
  alternates: {
    canonical: 'https://expresspassportphoto.com',
  },
  verification: {
    google: 'jEtgw3CtKWI9Uvk5XWVr5JZ4WE-abIX7PHq34g3T8Kw',
  },
  icons: {
    icon: '/images/backgrounds/favicon.png',
    shortcut: '/images/backgrounds/favicon.png',
    apple: '/images/backgrounds/favicon.png',
  },
  openGraph: {
    siteName: 'Express Passport Photo',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body>
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
            <a href="/" className="shrink-0 flex items-center" aria-label="Express Passport Photo — home">
              <Image
                src={LOGO_SRC}
                alt="Express Passport Photo"
                width={LOGO_W}
                height={LOGO_H}
                priority
                unoptimized
                className="h-11 w-auto sm:h-12"
              />
            </a>
            <MainNav />
          </div>
        </header>

        <TrustBar />

        {/* pb-20 md:pb-0 reserves space for sticky mobile CTA */}
        <main className="pb-20 md:pb-0">{children}</main>

        <footer className="border-t border-gray-200 mt-16 sm:mt-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
              {/* Brand */}
              <div className="lg:col-span-4 lg:pr-8">
                <a href="/" aria-label="Express Passport Photo — home" className="inline-flex">
                  <Image
                    src={LOGO_SRC}
                    alt="Express Passport Photo"
                    width={LOGO_W}
                    height={LOGO_H}
                    unoptimized
                    className="h-14 w-auto"
                  />
                </a>
                <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xs">
                  Professional, government-compliant passport &amp; ID photos in 30 seconds — AI background removal and
                  automatic compliance checking, from any selfie.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-brand-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                    Photos deleted in 48h
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1.5 rounded-lg">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Money-back guarantee
                  </span>
                </div>

                {/* Social */}
                <div className="mt-6">
                  <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-3">Connect with us on</p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.instagram.com/expresspassportphoto/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Express Passport Photo on Instagram"
                      className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.41-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.17.42-.36 1.04-.41 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.41 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.17 1.04.36 2.19.41 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.41.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.17-.42.36-1.04.41-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.41-2.19a3.6 3.6 0 00-.88-1.35 3.6 3.6 0 00-1.35-.88c-.42-.17-1.04-.36-2.19-.41-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.46 5.46 0 110 10.92 5.46 5.46 0 010-10.92zm0 9a3.54 3.54 0 100-7.08 3.54 3.54 0 000 7.08zm6.95-9.22a1.27 1.27 0 11-2.55 0 1.27 1.27 0 012.55 0z" />
                      </svg>
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61590395594175"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Express Passport Photo on Facebook"
                      className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#1877F2] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Document types */}
              <div className="lg:col-span-3">
                <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4">Document types</p>
                <ul className="space-y-2.5 text-sm text-gray-500">
                  <li><a href="/us-passport-photo" className="hover:text-brand-600 transition-colors">US Passport Photo</a></li>
                  <li><a href="/canada-passport-photo" className="hover:text-brand-600 transition-colors">Canadian Passport Photo</a></li>
                  <li><a href="/baby-passport-photo" className="hover:text-brand-600 transition-colors">Baby Passport Photo</a></li>
                  <li><a href="/photo-requirements" className="hover:text-brand-600 transition-colors">Photo Requirements</a></li>
                  <li><a href="/upload?type=us_visa" className="hover:text-brand-600 transition-colors">US Visa Photo</a></li>
                  <li><a href="/upload?type=canadian_pr_card" className="hover:text-brand-600 transition-colors">Canadian PR Card Photo</a></li>
                </ul>
              </div>

              {/* Company */}
              <div className="lg:col-span-2">
                <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4">Company</p>
                <ul className="space-y-2.5 text-sm text-gray-500">
                  <li><a href="/" className="hover:text-brand-600 transition-colors">Home</a></li>
                  <li><a href="/about" className="hover:text-brand-600 transition-colors">About Us</a></li>
                  <li><a href="/reviews" className="hover:text-brand-600 transition-colors">Reviews</a></li>
                  <li><a href="/contact" className="hover:text-brand-600 transition-colors">Contact Us</a></li>
                  <li><a href="/store-locator" className="hover:text-brand-600 transition-colors">Find a Store</a></li>
                  <li><a href="/refund-policy" className="hover:text-brand-600 transition-colors">Refund Policy</a></li>
                  <li><a href="/privacy-policy" className="hover:text-brand-600 transition-colors">Privacy Policy</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div className="lg:col-span-3">
                <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4">Contact</p>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li>
                    <a href="mailto:info@expresspassportphoto.com" className="inline-flex items-start gap-2 hover:text-brand-600 transition-colors">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l9 6 9-6M3 8a2 2 0 012-2h14a2 2 0 012 2M3 8v8a2 2 0 002 2h14a2 2 0 002-2V8" /></svg>
                      info@expresspassportphoto.com
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>11175 Cicero Drive, Suite 100<br />Alpharetta, GA 30022</span>
                  </li>
                </ul>
                <a
                  href="/upload"
                  className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-sm hover:bg-brand-700 transition-colors mt-5"
                >
                  From $0.99
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <p>© 2026 Express Passport Photo. All rights reserved.</p>
              <p>Not affiliated with, or endorsed by, any government agency.</p>
            </div>
          </div>
        </footer>

        <StickyMobileCTA />

        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Express Passport Photo',
              image: 'https://expresspassportphoto.com/og-image.png',
              url: 'https://expresspassportphoto.com',
              telephone: '',
              email: 'info@expresspassportphoto.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '11175 Cicero Drive, Suite 100',
                addressLocality: 'Alpharetta',
                addressRegion: 'GA',
                postalCode: '30022',
                addressCountry: 'US',
              },
              priceRange: '$',
              description:
                'AI-powered passport photo service. Get a government-compliant passport photo in 30 seconds. Digital download or CVS/Walgreens pickup. Money-back guarantee.',
              sameAs: [
                'https://www.instagram.com/expresspassportphoto/',
                'https://www.facebook.com/profile.php?id=61590395594175',
              ],
            }),
          }}
        />

        {/* HubSpot live chat — loads only when the portal ID is configured, so it
            stays inert until you set NEXT_PUBLIC_HUBSPOT_PORTAL_ID. The widget
            is used both as a trust/enquiry chat and as the channel our review
            team uses to confirm pass/fail on human-review orders. */}
        {process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && (
          <Script
            id="hs-script-loader"
            strategy="afterInteractive"
            src={`//js.hs-scripts.com/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID}.js`}
          />
        )}
      </body>
    </html>
  );
}
