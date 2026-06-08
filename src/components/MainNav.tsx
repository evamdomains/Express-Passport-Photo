'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/us-passport-photo', label: 'US Passport', visibility: 'hidden lg:block' },
  { href: '/canada-passport-photo', label: 'Canada Passport', visibility: 'hidden lg:block' },
  { href: '/baby-passport-photo', label: 'Baby Passport', visibility: 'hidden lg:block' },
  { href: '/store-locator', label: 'Find a Store', visibility: 'hidden sm:block' },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3 sm:gap-6 text-sm text-gray-600">
      {LINKS.map(({ href, label, visibility }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`${visibility} transition-colors ${
              active
                ? 'text-brand-700 font-semibold underline decoration-2 decoration-brand-600 underline-offset-8'
                : 'hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        );
      })}
      <Link
        href="/upload"
        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-semibold text-sm"
      >
        Get Started
      </Link>
    </nav>
  );
}
