import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Express Passport Photo team. Ask about compliance, difficult photos, or baby passport help — a real expert will reply to you.',
};

const HIGHLIGHTS = [
  {
    icon: '🧑‍💼',
    title: 'Talk to a real expert',
    desc: 'Your message goes straight to a passport photo specialist — not a bot.',
  },
  {
    icon: '⏱️',
    title: 'Fast response',
    desc: 'We aim to reply to every enquiry quickly, by email or live chat.',
  },
  {
    icon: '👶',
    title: 'Tricky photos welcome',
    desc: 'Babies, difficult lighting, unusual requirements — this is what we do.',
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white">
      <section className="px-4 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              Contact Us
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              We&apos;re here to <span className="text-brand-600">help</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
              Have a question about your photo, compliance, or an order? Fill out the form and one of our experts will get
              back to you.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            {/* Highlights / contact details */}
            <div className="lg:col-span-2 space-y-4">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {h.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{h.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-bold text-gray-900">Prefer email?</h3>
                <a
                  href="mailto:info@expresspassportphoto.com"
                  className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
                >
                  info@expresspassportphoto.com
                </a>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  11175 Cicero Drive, Suite 100<br />
                  Alpharetta, GA 30022
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
