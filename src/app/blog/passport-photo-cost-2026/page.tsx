import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Much Does a Passport Photo Cost in 2026? CVS vs Walgreens vs AI',
  description: 'Compare passport photo prices at CVS ($14.99), Walgreens ($16.99), UPS ($19.99), and AI services ($0.99). Find out which option saves you the most time and money.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog/passport-photo-cost-2026' },
};

const PRICES = [
  { store: 'CVS Pharmacy', price: '$14.99', time: '~20 min trip', notes: 'Staff-assisted, in-store only' },
  { store: 'Walgreens', price: '$16.99', time: '~20 min trip', notes: 'Staff-assisted, in-store only' },
  { store: 'UPS Store', price: '$19.99', time: '~25 min trip', notes: 'May vary by location' },
  { store: 'USPS Post Office', price: '$15.00', time: '~30 min trip', notes: 'Limited hours, long lines' },
  { store: 'AAA', price: '$15.00', time: '~20 min trip', notes: 'Members only' },
  { store: 'Express Passport Photo (AI)', price: '$0.99', time: '30 seconds', notes: 'From home, any time', highlight: true },
];

const FAQ = [
  {
    q: 'Why do CVS and Walgreens charge so much for passport photos?',
    a: 'The cost covers staff time, equipment, physical photo printing, and overhead. You\'re paying for a service, not just paper. AI services eliminate all of those costs, which is why the price drops from $15+ to under $1.',
  },
  {
    q: 'Are AI passport photos accepted by the US government?',
    a: 'Yes — as long as the photo meets ICAO and State Department specifications (2×2 inches, white background, proper head size, no glasses). Our AI processes every photo to these exact standards and checks compliance before you pay.',
  },
  {
    q: 'Can I print my digital passport photo at CVS or Walgreens?',
    a: 'Yes. You can upload your digital photo to CVS Photo or Walgreens Photo and print a 4×6 sheet for around $0.35. This gives you 4 passport-sized prints for less than $1 total — far cheaper than paying for their in-store service.',
  },
  {
    q: 'What if my AI passport photo is rejected?',
    a: 'Express Passport Photo offers a money-back guarantee. If a compliant photo we produced is rejected by the issuing authority, we\'ll make it right or refund you.',
  },
  {
    q: 'How many passport photos do I need?',
    a: 'A US passport application requires 2 photos. A renewal requires 1. Most services sell you 2 prints. Our digital download gives you a print-ready PDF you can print as many times as you need.',
  },
];

export default function PassportPhotoCostPage() {
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
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Cost & Pricing</span>
            <span className="text-xs text-gray-400">September 8, 2026</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400">6 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            How Much Does a Passport Photo Cost in 2026?
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            CVS charges $14.99. Walgreens charges $16.99. UPS charges $19.99. AI costs $0.99. Here&apos;s a full breakdown of every option — and which one is actually worth it.
          </p>
        </div>
      </section>

      {/* Price comparison table */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Passport photo prices at a glance</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Provider</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Price</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Time</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700 hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {PRICES.map((row, i) => (
                  <tr
                    key={row.store}
                    className={`border-b border-gray-50 last:border-0 ${row.highlight ? 'bg-brand-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {row.highlight ? (
                        <span className="flex items-center gap-2">
                          {row.store}
                          <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">BEST VALUE</span>
                        </span>
                      ) : row.store}
                    </td>
                    <td className={`px-5 py-3.5 font-bold ${row.highlight ? 'text-brand-600' : 'text-gray-900'}`}>{row.price}</td>
                    <td className="px-5 py-3.5 text-gray-600">{row.time}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-400">Prices current as of September 2026. In-store prices may vary by location.</p>
        </div>
      </section>

      {/* Article body */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto prose prose-gray prose-sm sm:prose-base max-w-none">

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">CVS Passport Photo — $14.99</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CVS is the most convenient in-store option for most Americans — there are over 9,000 locations nationwide. A staff member takes your photo, prints two 2×2 passport photos, and you&apos;re done in about 20 minutes.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            The downside: you have to go to the store during business hours, wait in line, and pay $14.99 for what is essentially two small photos. Quality can vary by location depending on the staff member and lighting setup.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Walgreens Passport Photo — $16.99</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Walgreens offers a similar in-store experience to CVS but charges $2 more. Like CVS, staff take the photo and print two passport-sized prints on the spot. Some locations have a dedicated photo area with consistent lighting; others don&apos;t.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Walgreens also offers an online option where you upload your own photo and pick up prints — but you still need to drive to the store, and the service isn&apos;t available at all locations.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">UPS Store Passport Photo — $19.99</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The UPS Store is the most expensive option at $19.99, and for no obvious reason — the process and result are essentially identical to CVS or Walgreens. The only advantage is that some UPS locations have longer hours than pharmacies.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">AI Passport Photo — $0.99</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            AI passport photo services like Express Passport Photo charge $0.99 for a digital download — a 95%+ saving over in-store options. You upload a selfie from your phone, the AI removes the background, checks compliance against government standards, and delivers a print-ready JPEG and PDF within 30 seconds.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You can then print the 4×6 PDF at CVS or Walgreens Photo for around $0.35, giving you 4 prints for a total of about $1.34 — compared to $14.99+ for the same thing done in-store.
          </p>

          <div className="my-8 rounded-2xl bg-brand-50 border border-brand-100 p-6">
            <p className="text-sm font-bold text-brand-800 mb-1">The math</p>
            <p className="text-sm text-brand-700 leading-relaxed">
              AI photo ($0.99) + CVS Photo print ($0.35) = <strong>$1.34 total</strong> vs. $14.99 in-store. You save $13.65 — and you never leave your house.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Which option should you choose?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you&apos;re comfortable using your phone and want to save time and money, an AI service is the clear winner. It&apos;s faster, cheaper, available 24/7, and produces photos that meet the exact same government standards as any store.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you&apos;re not comfortable uploading photos online or don&apos;t have a good camera, CVS is your best in-store option — it&apos;s the cheapest of the physical options and has the widest availability.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-14 bg-gray-50 py-14">
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
      <section className="px-4 py-14">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Get your passport photo for $0.99</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-xl mx-auto">
            ICAO-compliant. AI-verified. Ready in 30 seconds. Money-back guarantee.
          </p>
          <Link
            href="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get started — $0.99
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
