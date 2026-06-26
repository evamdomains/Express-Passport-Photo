import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Express Passport Photo helps you get government-compliant passport and ID photos in seconds — AI processing, optional human expert review, a money-back guarantee, and photos deleted within 48 hours.',
};

const TRUST_BADGES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.6 1.1A8.4 8.4 0 11 12 3.6" /></svg>
    ),
    label: 'Government-standard compliant',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    ),
    label: 'Photos deleted in 48 hours',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    label: 'Money-back guarantee',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ),
    label: 'Secure checkout by Stripe',
  },
];

const VALUES = [
  {
    icon: '⚡',
    title: 'Fast by default',
    desc: 'AI removes the background, fits the document spec, and checks compliance in seconds — no studio trip required.',
  },
  {
    icon: '🧑‍💼',
    title: 'Human when it matters',
    desc: 'Tricky lighting or a baby photo? A real passport photo specialist can review your image before you pay.',
  },
  {
    icon: '🛡️',
    title: 'Compliance guaranteed',
    desc: 'Every photo is built to official government standards. If it does not pass, we make it right — guaranteed.',
  },
  {
    icon: '🔒',
    title: 'Private by design',
    desc: 'Your photos are used only to produce your order and are automatically deleted within 48 hours.',
  },
];

const STATS = [
  { value: '$0.99', label: 'Starting price' },
  { value: '60s', label: 'Typical turnaround' },
  { value: '4.9★', label: 'Average rating' },
  { value: '24/7', label: 'Always available' },
];

const PROCESS = [
  {
    step: '01',
    title: 'Built to the exact spec',
    desc: 'US 2×2 in, Canadian 50×70 mm, baby and visa formats — sized to the millimeter with the correct head ratio and a true-white background.',
  },
  {
    step: '02',
    title: 'Checked, not guessed',
    desc: 'We verify face position, head size, lighting, and background against published requirements, and flag issues before you pay.',
  },
  {
    step: '03',
    title: 'A human in the loop',
    desc: 'Choose Human Expert Review and a trained specialist personally confirms your photo will be accepted — or tells you exactly how to fix it.',
  },
];

const FAQ = [
  {
    q: 'What if my photo is rejected by the government?',
    a: 'It should not be — our photos are built to official specifications. But if a compliant photo we produced is ever rejected, our money-back guarantee has you covered.',
  },
  {
    q: 'What happens to my photo after I order?',
    a: 'Your image is used only to produce your order and is automatically deleted within 48 hours. We never sell or share your photos.',
  },
  {
    q: 'How is the Human Expert Review different from AI?',
    a: 'AI is instant and ideal for straightforward photos. Human Expert Review adds a real specialist who reviews your image and guides you to a compliant result — perfect for babies, difficult lighting, or extra peace of mind.',
  },
  {
    q: 'Is payment secure?',
    a: 'Yes. Checkout is handled by Stripe, a PCI-compliant payment processor. We never see or store your card details.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            About Express Passport Photo
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Compliant passport &amp; ID photos, <span className="text-brand-600">without the hassle</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed">
            We started Express Passport Photo to remove the friction from one of the most frustrating errands: getting a
            passport photo that actually passes. Upload any selfie and our AI does the rest — and when you want a human
            in the loop, our experts review your photo before you commit.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Get started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/human-review"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-6 py-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100"
            >
              How human review works
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRUST_BADGES.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm"
            >
              <span className="text-brand-600 shrink-0">{b.icon}</span>
              <span className="text-xs sm:text-[13px] font-semibold text-gray-700 leading-snug">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-gray-50 p-5 text-center ring-1 ring-gray-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-600">{s.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-14 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Our mission</h2>
          <p className="mt-5 text-gray-600 leading-relaxed text-center">
            Government photo requirements are strict, confusing, and unforgiving — a few millimeters or the wrong
            background can mean a rejected application and weeks of delay. Our mission is simple: make a compliant photo
            something anyone can produce from home in under a minute, with the confidence that it will be accepted.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 px-4 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we keep it compliant */}
      <section className="px-4 py-14 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Why our photos pass</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">Compliance is the whole point</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROCESS.map((p) => (
              <div key={p.step} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="text-3xl font-extrabold text-brand-100">{p.step}</span>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews CTA → dedicated reviews page */}
      <section className="px-4 py-14 sm:py-16">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gray-50 px-6 py-10 text-center ring-1 ring-gray-100">
          <span className="text-2xl">★★★★★</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">Loved by our customers</h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Read real reviews from people who got compliant photos with us — and leave your own rating.
          </p>
          <Link
            href="/reviews"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Read &amp; write reviews
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Money-back guarantee band */}
      <section className="px-4 py-14 sm:py-16">
        <div className="max-w-4xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Our money-back guarantee</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-2xl mx-auto">
            We stand behind every photo. If a compliant photo we produced is rejected by the issuing authority, we&apos;ll
            make it right or refund you. No fine print, no runaround.
          </p>
          <Link
            href="/upload"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Create your photo from $0.99
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors open:border-brand-200 open:bg-brand-50/30"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm sm:text-base font-semibold text-gray-900 list-none">
                  {item.q}
                  <svg
                    className="w-5 h-5 shrink-0 text-brand-600 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-50 px-4 py-14 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Questions? We&apos;re here to help.</h2>
          <p className="mt-3 text-gray-600">
            Reach our team at{' '}
            <a href="mailto:info@expresspassportphoto.com" className="font-semibold text-brand-700 hover:underline">
              info@expresspassportphoto.com
            </a>
            .
          </p>
          <p className="mt-2 text-sm text-gray-500">11175 Cicero Drive, Suite 100, Alpharetta, GA 30022</p>
        </div>
      </section>
    </div>
  );
}
