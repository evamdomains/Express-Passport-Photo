'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '/store-locator', label: 'Find a Store', visibility: 'hidden lg:block' },
  { href: '/reviews', label: 'Reviews', visibility: 'hidden sm:block' },
];

type DropdownItem = { href: string; label: string; desc: string };

const DOCUMENT_ITEMS: DropdownItem[] = [
  { href: '/us-passport-photo', label: 'US Passport', desc: '2×2 in · White background' },
  { href: '/canada-passport-photo', label: 'Canada Passport', desc: '50×70mm · White background' },
  { href: '/baby-passport-photo', label: 'Baby Passport', desc: 'Infant & newborn photos' },
  { href: '/photo-requirements', label: 'Photo Requirements', desc: 'What passes & what gets rejected' },
];

const ABOUT_ITEMS: DropdownItem[] = [
  { href: '/about', label: 'About Us', desc: 'Who we are & what we do' },
  { href: '/ai-instant-photo', label: 'AI Instant Photo', desc: 'Three steps, under 5 minutes' },
  { href: '/human-review', label: 'Human Review', desc: 'How expert review works' },
  { href: '/contact', label: 'Contact Us', desc: 'Get in touch with our team' },
];

/** Hover- or click-to-open nav dropdown. Closes on outside click, Escape, or
 *  selecting an item. Shared by the Documents and About menus. */
function NavDropdown({
  label,
  items,
  align = 'left',
}: {
  label: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = items.some((i) => pathname === i.href);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 transition-colors ${
          active ? 'text-brand-700 font-semibold' : 'hover:text-gray-900'
        }`}
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50`}
        >
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 transition-colors ${
                  isActive ? 'bg-brand-50' : 'hover:bg-brand-50'
                }`}
              >
                <span className={`block text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-gray-900'}`}>
                  {item.label}
                </span>
                <span className="block text-xs text-gray-500">{item.desc}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3 sm:gap-6 text-sm text-gray-600">
      <NavDropdown label="Documents" items={DOCUMENT_ITEMS} align="left" />

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

      <NavDropdown label="About" items={ABOUT_ITEMS} align="right" />

      <NavStatusLookup />
    </nav>
  );
}

/** Compact Order ID status lookup that replaces the old "Get Started" button. */
function NavStatusLookup() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;
    router.push(`/review-status?orderId=${encodeURIComponent(id)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="hidden sm:flex items-center gap-2">
      <input
        type="text"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        placeholder="Paste your Order ID"
        aria-label="Order ID"
        className="w-36 lg:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Check status
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
