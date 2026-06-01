'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const HIDDEN_ON = ['/checkout', '/order-confirmation', '/admin', '/editor', '/upload'];

export default function StickyMobileCTA() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl">
      <Link
        href="/upload"
        className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-base active:bg-brand-700 transition-colors"
      >
        Get Passport Photo — $6.99
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  );
}
