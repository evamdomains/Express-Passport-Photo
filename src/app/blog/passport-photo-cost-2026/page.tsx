import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Much Does a Passport Photo Cost in 2026? Honest Price Guide',
  description: 'Passport photo prices in 2026 range from $0.99 to $19.99. Compare CVS, Walgreens, UPS Store and AI services. Find the cheapest option that\'s still government-compliant.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog/passport-photo-cost-2026' },
};

const PRICES = [
  { store: 'Express Passport Photo (AI)', price: '$0.99', wait: '30 seconds', check: 'Automatic AI check', highlight: true },
  { store: 'CVS Studio', price: '$14.99', wait: '10–30 min', check: 'Manual check' },
  { store: 'Walgreens Studio', price: '$16.99', wait: '10–30 min', check: 'Manual check' },
  { store: 'FedEx Office', price: '$17.99', wait: '5–15 min', check: 'Manual check' },
  { store: 'USPS', price: '$15.00', wait: '10–20 min', check: 'Manual check' },
  { store: 'UPS Store', price: '$19.99', wait: '5–15 min', check: 'Manual check' },
  { store: 'AAA (members only)', price: 'Free', wait: '10–20 min', check: 'Manual check' },
];

const FAQ = [
  {
    q: 'How much does a passport photo cost at CVS?',
    a: 'CVS charges $14.99 for a passport photo in 2026. This includes two printed 2×2 inch photos. Not all CVS locations have a photo studio, so call ahead to confirm availability.',
  },
  {
    q: 'How much does a passport photo cost at Walgreens?',
    a: 'Walgreens charges $16.99 for a passport photo in 2026. This includes two printed photos. Wait times vary from 10 to 45 minutes depending on the location and time of day.',
  },
  {
    q: 'What is the cheapest way to get a passport photo?',
    a: 'The cheapest option in 2026 is an AI passport photo service like Express Passport Photo at $0.99. It is also the fastest option — your compliant photo is ready in 30 seconds. AAA members can also get free passport photos at AAA branches.',
  },
  {
    q: 'Can I take my own passport photo at home?',
    a: 'Yes. US government rules allow self-taken passport photos. The photo must meet strict requirements: white background, correct head size and positioning, neutral expression, eyes open, no glasses. An AI service handles all of these automatically.',
  },
  {
    q: 'Does a passport photo need to be professionally taken?',
    a: 'No. The US government does not require passport photos to be taken by a professional photographer. You can take a selfie on your phone and use an AI tool to make it compliant. The photo just needs to meet the technical specifications.',
  },
];

export default function PassportPhotoCostPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="px-4 py-14 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold mb-6 hover:underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            All guides
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Cost &amp; Pricing</span>
            <span className="text-xs text-gray-400">September 8, 2026 · 6 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            How Much Does a Passport Photo Cost in 2026? Honest Price Guide
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Passport photo prices in 2026 range from $0.99 to $19.99. Before you drive to Walgreens or CVS, read this guide to understand exactly what you&apos;re paying for — and where to get the best value without risking rejection.
          </p>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '$0.99', label: 'AI Service' },
            { value: '$14.99', label: 'CVS Studio' },
            { value: '$16.99', label: 'Walgreens Studio' },
            { value: '$19.99', label: 'UPS Store' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <div className="text-xl sm:text-2xl font-extrabold text-brand-600">{s.value}</div>
              <div className="mt-1 text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TOC */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto rounded-2xl bg-gray-50 border border-gray-100 p-6">
          <p className="text-sm font-bold text-gray-800 mb-3">Table of Contents</p>
          <ol className="space-y-1.5 text-sm text-brand-600">
            {[
              'Quick answer: What does a passport photo cost in 2026?',
              'Passport photo prices by provider — full comparison',
              'CVS passport photo cost',
              'Walgreens passport photo cost',
              'UPS Store and FedEx passport photo cost',
              'AI passport photo services — the cheapest compliant option',
              'Hidden costs nobody tells you about',
              'Frequently asked questions',
            ].map((item, i) => (
              <li key={item} className="hover:underline cursor-default">{i + 1}. {item}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Article body */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto space-y-10">

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Quick Answer: What Does a Passport Photo Cost in 2026?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              In 2026, a standard US passport photo (2×2 inches, white background, ICAO-compliant) costs between <strong>$0.99 and $19.99</strong> depending on where you go. AI-powered services are the most affordable option and just as compliant as studio photos. In-store studios at CVS and Walgreens charge $14–17 and typically require a 10–30 minute wait.
            </p>
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <p className="text-sm font-bold text-brand-800 mb-1">TIP</p>
              <p className="text-sm text-brand-700 leading-relaxed">
                If your priority is speed and price, an AI passport photo service like Express Passport Photo gives you a government-compliant photo in 30 seconds for $0.99 — with CVS pickup available if you want a physical print.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Passport Photo Prices by Provider — Full Comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Price</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Wait Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Compliance Check</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICES.map((row, i) => (
                    <tr key={row.store} className={`border-b border-gray-50 last:border-0 ${row.highlight ? 'bg-brand-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">
                        {row.highlight ? (
                          <span className="flex items-center gap-2 flex-wrap">
                            {row.store}
                            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">BEST VALUE</span>
                          </span>
                        ) : row.store}
                      </td>
                      <td className={`px-4 py-3.5 font-bold ${row.highlight ? 'text-brand-600' : 'text-gray-900'}`}>{row.price}</td>
                      <td className="px-4 py-3.5 text-gray-600 hidden sm:table-cell">{row.wait}</td>
                      <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{row.check}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">Prices current as of September 2026. In-store prices may vary by location.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. CVS Passport Photo Cost</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CVS charges <strong>$14.99</strong> for a passport photo in 2026. This includes two printed 2×2 inch photos. Most CVS locations offer passport photo services during pharmacy hours, but not all locations have a dedicated photo studio — call ahead to confirm.
            </p>
            <p className="text-gray-600 leading-relaxed">
              With Express Passport Photo, you can order a digital file for $0.99 and send it directly to your nearest CVS for printing the same day. This gives you the CVS pickup convenience at a fraction of the studio price.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Walgreens Passport Photo Cost</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Walgreens charges <strong>$16.99</strong> for a passport photo in 2026. Like CVS, this includes two printed photos. Walgreens photo studios are available at most locations but wait times can vary significantly — up to 45 minutes during busy periods.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Walgreens also offers an online photo service, but you still need to upload a compliant photo yourself. Using an AI service to create the compliant photo first and then sending it to Walgreens for printing is a faster and cheaper combined approach.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. UPS Store and FedEx Passport Photo Cost</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              UPS Store charges <strong>$19.99</strong> and FedEx Office charges <strong>$17.99</strong> for passport photos in 2026. These are the most expensive options on the list. The advantage is that most locations are open longer hours than pharmacy photo studios, and the wait is usually shorter.
            </p>
            <p className="text-gray-600 leading-relaxed">
              However, at $19.99 for two printed photos, UPS Store is the most expensive way to get a passport photo — and not guaranteed compliant.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">6. AI Passport Photo Services — The Cheapest Compliant Option</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              AI passport photo services like Express Passport Photo have become the fastest-growing option in 2026. Here is how the process works:
            </p>
            <div className="space-y-3 mb-6">
              {[
                'You upload a selfie from your phone — any background, any lighting',
                'The AI removes the background and replaces it with the required white background',
                'The AI checks head position, eye openness, face centering, and lighting automatically',
                'You download a government-compliant photo in 30 seconds',
                'You can send the file to CVS or Walgreens for printing, or download the digital file for your online application',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <p className="text-sm text-brand-700 leading-relaxed">
                <strong>Express Passport Photo charges $0.99</strong> for a digital download and $0.99 for CVS/Walgreens print pickup. The photo comes with a 100% acceptance guarantee — if it gets rejected, you get a full refund.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Hidden Costs Nobody Tells You About</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Before choosing based on price alone, consider these hidden costs of in-store passport photo services:</p>
            <div className="space-y-2">
              {[
                'Driving time and gas — a 20-minute round trip adds real cost',
                'Wait time — 10–45 minutes at a studio, vs 30 seconds at home',
                'Rejection risk — if the studio photo does not meet government specs, you pay again',
                'Reprint fees — some studios charge for a retake if the first attempt fails',
                'Parking — at busy pharmacy locations this is often paid parking',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <p className="text-sm text-brand-700 leading-relaxed">
                When you factor in time and travel, an AI service at $0.99 is not just cheaper — it saves 45 minutes to an hour of your day.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors open:border-brand-200 open:bg-brand-50/30">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm sm:text-base font-semibold text-gray-900 list-none">
                  {item.q}
                  <svg className="w-5 h-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Author */}
      <section className="px-4 py-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Written by</p>
          <p className="text-sm font-semibold text-gray-800">The Express Passport Photo Team</p>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Express Passport Photo is a US-based AI passport photo service available at expresspassportphoto.com. Our AI is trained on US government passport photo specifications and ICAO international standards. We wrote this pricing guide to help travelers make an informed decision before spending $15–20 at a studio.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Get your passport photo for $0.99</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-xl mx-auto">ICAO-compliant. AI-verified. Ready in 30 seconds. Money-back guarantee.</p>
          <Link href="/upload" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5">
            Get started — $0.99
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
