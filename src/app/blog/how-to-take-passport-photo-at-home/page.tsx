import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Take a Perfect Passport Photo at Home (Step-by-Step Guide)',
  description: 'Learn how to take a perfect passport photo at home in 2026. Step-by-step guide covering lighting, background, phone settings and common mistakes to avoid.',
  alternates: { canonical: 'https://expresspassportphoto.com/blog/how-to-take-passport-photo-at-home' },
};

const REQUIREMENTS = [
  'Size: exactly 2×2 inches (51×51 mm)',
  'Head size: 1 inch to 1⅜ inches from chin to top of head',
  'Background: plain white or off-white — no patterns, shadows, or objects',
  'Expression: neutral expression, mouth closed',
  'Eyes: open, clearly visible, looking directly at the camera',
  'Glasses: not allowed since 2016',
  'Head coverings: only allowed for religious reasons',
  'Lighting: even lighting, no shadows on face or background',
  'Recency: photo must be taken within the last 6 months',
];

const FAQ = [
  {
    q: 'Can I take my own passport photo at home?',
    a: 'Yes. The US Department of State allows self-taken passport photos. The photo must meet all technical requirements — correct size, white background, proper head position, eyes open. Using an AI service like Express Passport Photo ensures all requirements are met automatically.',
  },
  {
    q: 'What background do I need for a passport photo?',
    a: 'You need a plain white or off-white background with no patterns, shadows, or objects. If you do not have a suitable wall, AI passport photo services can remove and replace any background automatically.',
  },
  {
    q: 'Can I smile in my passport photo?',
    a: 'No. US passport photos require a neutral expression with your mouth closed. A slight natural expression is acceptable, but a big smile is not allowed. The neutral expression requirement helps facial recognition systems at airports work correctly.',
  },
  {
    q: 'What should I wear for a passport photo?',
    a: 'Wear everyday clothing in any color except white (which can blend with the background). No uniforms, camouflage, or military clothing. Remove glasses, hats, and head coverings unless worn for religious reasons.',
  },
  {
    q: 'How recent does my passport photo have to be?',
    a: 'Your passport photo must have been taken within the last 6 months. This is strictly enforced. If your photo is older than 6 months, your application will be returned and you will need to reapply with a new photo.',
  },
  {
    q: 'Can I use my iPhone to take a passport photo?',
    a: 'Yes. Any modern smartphone camera produces high enough quality for a passport photo. Use the rear camera rather than the selfie camera for better image quality and less distortion. Make sure the photo is in sharp focus and good lighting.',
  },
];

export default function HomePassportPhotoPage() {
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
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">How-To Guide</span>
            <span className="text-xs text-gray-400">September 8, 2026 · 7 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            How to Take a Perfect Passport Photo at Home (Step-by-Step Guide)
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            You do not need a professional photographer or a trip to CVS to get a great passport photo. With the right setup and a smartphone, you can take a government-compliant passport photo at home in under 5 minutes.
          </p>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {[
            { value: '2×2 in', label: 'Required photo size' },
            { value: 'White', label: 'Required background' },
            { value: '30 sec', label: 'Time with AI service' },
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
              'What the US government requires in a passport photo',
              'What you need before you start',
              'How to set up your background',
              'How to get the lighting right',
              'How to take the photo — camera settings and positioning',
              'How to check if your photo meets requirements',
              'How to use AI to fix your photo automatically',
              'Frequently asked questions',
            ].map((item, i) => (
              <li key={item} className="cursor-default">{i + 1}. {item}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Article body */}
      <section className="px-4 pb-10">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What the US Government Requires in a Passport Photo</h2>
            <p className="text-gray-600 leading-relaxed mb-5">Before you pick up your phone, understand exactly what the US Department of State requires. These are non-negotiable — if any requirement is not met, your application will be rejected.</p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2">
              {REQUIREMENTS.map((req) => (
                <div key={req} className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  {req}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm text-brand-700 leading-relaxed">
                <strong>NOTE:</strong> The US government accepts both digital and printed passport photos. If applying online you submit a digital file. If applying by mail you need two printed 2×2 inch photos.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. What You Need Before You Start</h2>
            <p className="text-gray-600 leading-relaxed mb-5">You only need three things to take a compliant passport photo at home:</p>
            <div className="space-y-4">
              {[
                { num: '1', title: 'A smartphone with a decent camera', desc: 'Any iPhone from the last 5 years or Android phone with at least a 12MP camera works perfectly. You do not need to use the selfie camera — the rear camera produces better quality.' },
                { num: '2', title: 'A plain white wall or white background', desc: 'A white wall, white door, white foam board, or even a white bedsheet pinned flat works. The background must be completely plain with no shadows behind you.' },
                { num: '3', title: 'Natural window light or a ring light', desc: 'Good lighting is the most important factor. Natural light from a window is ideal. A $20 ring light from Amazon also works well.' },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{item.num}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How to Set Up Your Background</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Your background is the most common reason passport photos fail. Here is exactly how to set it up:</p>
            <div className="space-y-2 mb-5">
              {[
                'Stand in front of a plain white wall — the flatter and more matte the better',
                'Stand 12 to 18 inches away from the wall — this prevents your shadow from falling on the background',
                'If your wall has texture, move further away — the camera will blur the texture slightly',
                'If you do not have a white wall, tape a white sheet of paper or foam board to a flat surface',
                'Make sure nothing is visible behind you — no furniture, pictures, doors, or windows',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm font-bold text-brand-800 mb-1">TIP</p>
              <p className="text-sm text-brand-700 leading-relaxed">Do not worry if your background is not perfectly white. AI services like Express Passport Photo will automatically remove and replace the background with a clean government-compliant white — so you can focus on getting a good photo of your face.</p>
            </div>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Get the Lighting Right</h2>
            <p className="text-gray-600 leading-relaxed mb-5">Lighting is the second most common reason photos get rejected. Follow these steps:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="font-semibold text-gray-900 mb-3">Natural light setup (best option)</p>
                <div className="space-y-2">
                  {[
                    'Stand facing a window so the light falls directly on your face',
                    'Do not stand with the window behind you — this creates a silhouette',
                    'Overcast days produce the most even light',
                    'Take the photo in the morning or afternoon',
                  ].map((item) => (
                    <p key={item} className="text-sm text-gray-600 flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="font-semibold text-gray-900 mb-3">Indoor light setup</p>
                <div className="space-y-2">
                  {[
                    'Turn on all lights in the room and face them',
                    'If using a ring light, position it at face level, directly in front of you',
                    'Check that there are no shadows on one side of your face',
                    'Hold a white piece of paper below your face to bounce light upward if too harsh',
                  ].map((item) => (
                    <p key={item} className="text-sm text-gray-600 flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How to Take the Photo — Camera Settings and Positioning</h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Camera setup',
                  items: [
                    'Use the rear camera, not the selfie camera — it produces higher quality',
                    'Have someone else take the photo if possible — selfies often cause distortion',
                    'If taking a selfie, use a tripod or prop your phone against a stack of books',
                    'Use the timer function so you are not reaching for the phone',
                  ],
                },
                {
                  title: 'Positioning',
                  items: [
                    'Stand or sit up straight and face directly at the camera',
                    'The camera should be at eye level — not above or below your face',
                    'Your full face, top of shoulders, and area above your head should be visible',
                    'Keep your expression neutral — relaxed, mouth closed',
                  ],
                },
                {
                  title: 'What to wear',
                  items: [
                    'Wear everyday clothing — no uniforms, camouflage, or white tops',
                    'White tops can blend into a white background — choose a different color',
                    'Remove glasses — they are not allowed in US passport photos since 2016',
                    'Keep hair away from your face so your full face is visible',
                  ],
                },
              ].map((block) => (
                <div key={block.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-gray-900 mb-3">{block.title}</p>
                  <div className="space-y-2">
                    {block.items.map((item) => (
                      <p key={item} className="text-sm text-gray-600 flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. How to Check If Your Photo Meets Requirements</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Before submitting your photo, check these items yourself:</p>
            <div className="space-y-2">
              {[
                'Is the background plain white with no shadows?',
                'Is your full face visible from chin to top of head?',
                'Are both eyes fully open and visible?',
                'Is your expression neutral with mouth closed?',
                'Is the photo in sharp focus — not blurry?',
                'Is the lighting even on both sides of your face?',
                'Are you not wearing glasses?',
                'Is the photo in color, not black and white?',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <svg className="w-4 h-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. How to Use AI to Fix Your Photo Automatically</h2>
            <p className="text-gray-600 leading-relaxed mb-5">If your background is not perfect, or if you are not sure your photo meets all the requirements, an AI passport photo service can fix it automatically. Here is how Express Passport Photo works:</p>
            <div className="space-y-3 mb-5">
              {[
                { num: '1', title: 'Upload your selfie', desc: 'Any background, any lighting. Just take the best photo you can of your face.' },
                { num: '2', title: 'AI removes and replaces the background', desc: 'The AI detects your face and hair, removes the existing background, and replaces it with a clean government-compliant white background.' },
                { num: '3', title: 'AI checks compliance automatically', desc: 'Head position, eye visibility, face centering, lighting balance — all checked in seconds.' },
                { num: '4', title: 'Download or send to CVS', desc: 'Get your compliant photo as a digital file for $0.99, or send it to your nearest CVS for printing and pick it up same day.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{step.num}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{step.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <p className="text-sm font-bold text-brand-800 mb-1">GUARANTEE</p>
              <p className="text-sm text-brand-700 leading-relaxed">Express Passport Photo offers a 100% acceptance guarantee. If your photo gets rejected by the government, you get a full refund. No questions asked.</p>
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
            Express Passport Photo is a US-based AI passport photo service available at expresspassportphoto.com. Our AI is trained on US State Department specifications and ICAO international standards. We wrote this guide to help people avoid the most common passport photo mistakes before submitting their application.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand-600 px-6 py-10 sm:px-12 sm:py-12 text-center text-white shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready? Upload your selfie now</h2>
          <p className="mt-3 text-brand-50 leading-relaxed max-w-xl mx-auto">AI removes the background, checks compliance, and delivers a print-ready photo in 30 seconds. $0.99. Money-back guarantee.</p>
          <Link href="/upload" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:-translate-y-0.5">
            Get my passport photo — $0.99
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
