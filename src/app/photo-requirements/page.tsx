import type { Metadata } from 'next';
import Link from 'next/link';
import RequirementSection, {
  type RequirementSectionData,
} from '@/components/photo-requirements/RequirementSection';

export const metadata: Metadata = {
  title: 'Photo Requirements | Express Passport Photo',
  description:
    'Learn the official passport photo requirements including pose, glasses, clothing, babies, toddlers, examples, and common mistakes before uploading your passport photo.',
  alternates: { canonical: '/photo-requirements' },
};

// Section icons (inline so the page stays a single server component).
const PoseIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </svg>
);
const ClothingIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3 4 7l2 3 2-1v9h8v-9l2 1 2-3-5-4a3 3 0 0 1-6 0Z" />
  </svg>
);
const BabyIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M9.5 14c.7.6 1.6.9 2.5.9s1.8-.3 2.5-.9" />
  </svg>
);

const SECTIONS: RequirementSectionData[] = [
  // ── Section 1 ───────────────────────────────────────────────────────────
  {
    index: 1,
    title: 'Pose & expression',
    subtitle: 'How to position your head and face',
    icon: PoseIcon,
    image: '/images/backgrounds/Pose%26Expression.png',
    defaultOpen: true,
    description:
      'Your face must point straight at the camera with a calm, natural expression. The whole face needs to be visible and evenly lit, with no shadows. These are the rules examiners check most closely, so getting them right is the single best way to pass the first time.',
    checklistTitle: 'Get these right',
    checklist: [
      { text: 'Look directly at the camera' },
      { text: 'Keep your head straight (no tilt)' },
      { text: 'Face centered in the frame' },
      { text: 'Neutral facial expression' },
      { text: 'Both eyes open and clearly visible' },
      { text: 'Mouth naturally closed' },
      { text: 'Whole face fully visible' },
      { text: 'Even lighting, no shadows on the face or background' },
    ],
    accepted: [
      { variant: 'neutral', status: 'accepted', label: 'Neutral face', reason: 'Calm, relaxed expression facing the camera.' },
      { variant: 'straight-head', status: 'accepted', label: 'Straight head', reason: 'Head upright and squared to the camera.' },
      { variant: 'eyes-open', status: 'accepted', label: 'Eyes open', reason: 'Both eyes clearly visible and open.' },
      { variant: 'mouth-closed', status: 'accepted', label: 'Mouth closed', reason: 'Lips together in a natural resting position.' },
    ],
    rejected: [
      { variant: 'looking-sideways', status: 'rejected', label: 'Looking sideways', reason: 'The face must point directly toward the camera.' },
      { variant: 'looking-up', status: 'rejected', label: 'Looking up', reason: 'Chin is raised — keep the head level.' },
      { variant: 'looking-down', status: 'rejected', label: 'Looking down', reason: 'Chin is lowered — keep the head level.' },
      { variant: 'head-tilted', status: 'rejected', label: 'Head tilted', reason: 'Hold the head upright with no tilt.' },
      { variant: 'eyes-closed', status: 'rejected', label: 'Eyes closed', reason: 'Both eyes must be open and visible.' },
      { variant: 'broad-smile', status: 'rejected', label: 'Broad smile', reason: 'A neutral expression is required, not a broad smile.' },
      { variant: 'laughing', status: 'rejected', label: 'Laughing', reason: 'Laughing distorts the face — stay relaxed.' },
      { variant: 'mouth-open', status: 'rejected', label: 'Mouth wide open', reason: 'The mouth should be closed and relaxed.' },
      { variant: 'face-outside-frame', status: 'rejected', label: 'Face outside frame', reason: 'The face must be centered and fully inside the frame.' },
    ],
    tips: [
      'Relax your face and breathe out gently just before the photo is taken.',
      'Have someone take the photo straight on, at eye level, about an arm’s length away.',
      'Use soft, even light from the front to avoid shadows on one side of the face.',
      'Keep both ears roughly level to confirm your head is straight.',
    ],
    government: (
      <>
        Government guidelines require a neutral expression with both eyes open and the head facing
        the camera squarely. A relaxed face with the mouth closed is the safest choice for
        acceptance.
      </>
    ),
  },

  // ── Section 2 ───────────────────────────────────────────────────────────
  {
    index: 2,
    title: 'Clothing, hats & glasses',
    subtitle: 'What you can and cannot wear',
    icon: ClothingIcon,
    image: '/images/backgrounds/Clothing,%20Hats%20%26%20Glasses.png',
    description:
      'Everyday clothing is fine, and religious clothing is allowed as long as it does not cover the face. Glasses are not accepted because reflections and frames can obscure the eyes, which government systems must see clearly. Hats, caps, masks, headphones, and hair across the eyes are also not allowed.',
    doRules: [
      { text: 'Everyday clothing' },
      { text: 'Religious clothing that does not hide the face' },
      { text: 'Hair kept clear of the eyes and face' },
    ],
    dontRules: [
      { text: 'Prescription glasses' },
      { text: 'Sunglasses' },
      { text: 'Hats and caps' },
      { text: 'Face masks' },
      { text: 'Headphones or earphones' },
      { text: 'Hair covering the eyes' },
      { text: 'Anything else hiding facial features' },
    ],
    accepted: [
      { variant: 'normal-clothing', status: 'accepted', label: 'Normal clothing', reason: 'Everyday clothes with the full face visible.' },
      { variant: 'religious-clothing', status: 'accepted', label: 'Religious head covering', reason: 'Allowed as long as the full face stays visible.' },
    ],
    rejected: [
      { variant: 'glasses', status: 'rejected', label: 'Prescription glasses', reason: 'Frames and reflections can hide the eyes.' },
      { variant: 'sunglasses', status: 'rejected', label: 'Sunglasses', reason: 'The eyes must be fully visible and uncovered.' },
      { variant: 'hat', status: 'rejected', label: 'Hat', reason: 'Headwear (non-religious) is not permitted.' },
      { variant: 'cap', status: 'rejected', label: 'Cap', reason: 'Caps cover the head and shade the face.' },
      { variant: 'mask', status: 'rejected', label: 'Face mask', reason: 'The nose and mouth must be uncovered.' },
      { variant: 'hair-over-eyes', status: 'rejected', label: 'Hair over eyes', reason: 'Hair must not cross or cover the eyes.' },
    ],
    tips: [
      'Remove glasses entirely — even clear lenses can catch a reflection.',
      'Choose clothing that contrasts with a plain white background.',
      'Tuck hair behind the ears or to the side so both eyes are clear.',
      'If you wear a head covering for religious reasons, keep the full face from chin to forehead visible.',
    ],
    government: (
      <>
        Glasses are no longer accepted in most passport photos because of glare and frame
        obstruction. Headwear is permitted only for religious or medical reasons, and the face must
        remain fully visible at all times.
      </>
    ),
  },

  // ── Section 3 (mirrors src/lib/face/baby-compliance.ts) ───────────────────
  {
    index: 3,
    title: 'Babies & toddlers',
    subtitle: 'Relaxed rules for infants — different from adults',
    icon: BabyIcon,
    image: '/images/backgrounds/Babies%20%26%20Toddlers.png',
    description:
      'Baby and toddler photos follow different, more forgiving rules than adults. Infants breathe through slightly parted lips, can’t hold a perfectly neutral face, tilt their heads, and don’t always open both eyes equally — so those rules are relaxed. What still gets rejected is a genuinely non-compliant photo: crying, laughing, a wide-open mouth, fully closed eyes, an extreme head angle, or anything covering the face.',
    doRules: [
      { text: 'Calm, relaxed baby' },
      { text: 'Relaxed face / mild natural expression' },
      { text: 'Slightly open mouth or a small natural “O”' },
      { text: 'Eyes reasonably open (slightly sleepy is fine)' },
      { text: 'Slight head tilt' },
      { text: 'Slight natural movement' },
    ],
    dontRules: [
      { text: 'Broad smile or big grin' },
      { text: 'Laughing or screaming' },
      { text: 'Crying' },
      { text: 'Mouth wide open / tongue out' },
      { text: 'Finger inside the mouth' },
      { text: 'Hand covering the face' },
      { text: 'Parent, another child, toy, bottle or pacifier visible' },
      { text: 'Blanket covering the face' },
      { text: 'Eyes completely closed' },
      { text: 'Extreme head rotation or tilt' },
    ],
    accepted: [
      { variant: 'baby-calm', status: 'accepted', label: 'Calm baby', reason: 'Relaxed, settled expression — ideal.' },
      { variant: 'baby-o-mouth', status: 'accepted', label: 'Small “O” mouth', reason: 'A small relaxed mouth opening is acceptable for infants.' },
      { variant: 'baby-eyes-open', status: 'accepted', label: 'Eyes open', reason: 'Eyes reasonably open, including slightly sleepy.' },
      { variant: 'baby-slight-tilt', status: 'accepted', label: 'Slight tilt', reason: 'A small natural head tilt is within the infant range.' },
    ],
    rejected: [
      { variant: 'baby-broad-smile', status: 'rejected', label: 'Broad smile', reason: 'A big grin is beyond a relaxed infant expression.' },
      { variant: 'baby-crying', status: 'rejected', label: 'Crying', reason: 'Wait until the baby is calm — crying is not accepted.' },
      { variant: 'baby-mouth-wide', status: 'rejected', label: 'Mouth wide open', reason: 'The mouth is opened too wide — wait for a calmer moment.' },
      { variant: 'baby-finger-mouth', status: 'rejected', label: 'Finger in mouth', reason: 'The mouth and facial features must remain fully visible.' },
      { variant: 'baby-hand-face', status: 'rejected', label: 'Hand on face', reason: 'Nothing may cover the baby’s face.' },
      { variant: 'baby-parent-visible', status: 'rejected', label: 'Parent visible', reason: 'Only the baby may appear in the photo.' },
      { variant: 'baby-toy-visible', status: 'rejected', label: 'Toy visible', reason: 'Toys, bottles and props must be out of frame.' },
      { variant: 'baby-pacifier', status: 'rejected', label: 'Pacifier', reason: 'Pacifiers cover the mouth and are not allowed.' },
      { variant: 'baby-eyes-closed', status: 'rejected', label: 'Eyes closed', reason: 'Both eyes should be open and visible.' },
      { variant: 'baby-extreme-tilt', status: 'rejected', label: 'Extreme tilt', reason: 'Hold the baby a little more upright.' },
    ],
    tips: [
      'Lay the baby on a plain white sheet and photograph straight down from above.',
      'Catch a calm moment — just after feeding or a nap often works best.',
      'Make sure no hands, toys, pacifiers or blankets are in the frame.',
      'A small open mouth or slight head tilt is fine; you’re only avoiding extremes.',
    ],
    government: (
      <>
        Infant photos are assessed with relaxed tolerances for eyes, mouth, expression and head
        pose. The essentials remain: the baby alone in frame, face fully visible, eyes not fully
        closed, and no crying, laughing or wide-open mouth.
      </>
    ),
  },
];

export default function PhotoRequirementsPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50/60 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-3.5 py-1.5 mb-5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6l-8-3Z" />
            </svg>
            Government-compliant guidance
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Photo Requirements &amp; Examples
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Learn exactly what makes a passport photo acceptable before uploading your picture.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Upload my photo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <span className="text-sm text-gray-400">Read the requirements below first</span>
          </div>
        </header>

        {/* Expandable sections */}
        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <RequirementSection key={s.index} data={s} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 rounded-3xl bg-brand-600 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold text-white">Ready when you are</h2>
          <p className="mt-2 text-brand-100 max-w-xl mx-auto">
            Follow these requirements and your photo is far more likely to pass on the first try.
            Not sure? Our experts can review it for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/upload" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
              Start my passport photo
            </Link>
            <Link href="/human-review" className="rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Learn about expert review
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
