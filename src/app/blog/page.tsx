import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Passport Photo Tips & Guides | Blog',
  description: 'Expert guides on passport photo requirements, costs, and how to take a compliant photo at home. Save time and money with Express Passport Photo.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog' },
};

const POSTS = [
  {
    slug: 'passport-photo-cost-2026',
    title: 'How Much Does a Passport Photo Cost in 2026? (CVS, Walgreens, UPS vs. AI)',
    excerpt: 'CVS charges $14.99. Walgreens charges $16.99. UPS charges $19.99. AI costs $0.99. Here\'s a full breakdown of every option — and which one is actually worth it.',
    date: 'September 8, 2026',
    readTime: '6 min read',
    category: 'Cost & Pricing',
  },
  {
    slug: 'how-to-take-passport-photo-at-home',
    title: 'How to Take a Passport Photo at Home (Step-by-Step Guide)',
    excerpt: 'You don\'t need a studio to get a government-compliant passport photo. With the right background, lighting, and a phone camera, you can do it yourself in minutes.',
    date: 'September 8, 2026',
    readTime: '7 min read',
    category: 'How-To Guide',
  },
];

export default function BlogPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Passport Photo Tips & Guides
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Everything you need to know about <span className="text-brand-600">passport photos</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Expert guides to help you get a compliant photo — without the confusion, the trip to the store, or the high price.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-6">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.date}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{post.readTime}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{post.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                Read article
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to get your passport photo?</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-xl mx-auto">
            Skip the store. Get a government-compliant photo in 30 seconds for just $0.99.
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
