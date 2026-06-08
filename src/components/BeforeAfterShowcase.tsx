import Image from 'next/image';

/**
 * BeforeAfterShowcase — floating hero before/after animation
 * ----------------------------------------------------------
 * Reuses the exact premium "floating 3D card" treatment from the US Passport /
 * US Visa hero images (perspective scene + pulsing glow halo + float-3d motion
 * + shine sweep) and ties the example crossfade to that motion:
 *
 *   • the card floats UP then DOWN on a 6s loop (animate-float-3d)
 *   • while rising it shows the MALE example  (background_2.png)
 *   • while descending it shows the FEMALE example (background_3.png)
 *   • the two crossfade at the apex and nadir (animate-hero-crossfade, 6s)
 *
 * Because float-3d and hero-crossfade share the same 6s duration and both start
 * on mount, they stay in sync. Pure CSS (keyframes in tailwind.config.ts),
 * GPU-only (transform/opacity), no JS/Framer Motion, and frozen under
 * prefers-reduced-motion (globals.css) → falls back to the static male panel.
 *
 * The aspect-ratio box reserves space up-front, so there is no layout shift.
 */

const EXAMPLES = [
  {
    src: '/images/backgrounds/background_2.png', // male — shown on the way up
    alt: 'Before and after: a raw selfie transformed by AI into a compliant passport photo',
    delay: '0s',
  },
  {
    src: '/images/backgrounds/background_3.png', // female — shown on the way down
    alt: 'Before and after: a raw selfie transformed by AI into a compliant passport photo',
    delay: '-3s', // inverse phase (half of the 6s loop)
  },
];

// Native size of both source images (do not modify the images).
const IMG_WIDTH = 1672;
const IMG_HEIGHT = 941;

export default function BeforeAfterShowcase() {
  return (
    <div className="relative w-full max-w-xl mx-auto select-none perspective-1000">
      <div className="group relative preserve-3d">
        {/* Pulsing glow halo */}
        <div
          aria-hidden="true"
          className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-tr from-sky-400/40 via-brand-400/30 to-cyan-300/40 blur-2xl animate-glow-pulse"
        />

        {/* Floating 3D card */}
        <div className="relative aspect-[1672/941] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20 animate-float-3d transition-all duration-500 ease-out will-change-transform group-hover:scale-[1.03] group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
          {/* Crossfading example panels (synced to the float motion) */}
          {EXAMPLES.map((ex, i) => (
            <Image
              key={ex.src}
              src={ex.src}
              alt={ex.alt}
              width={IMG_WIDTH}
              height={IMG_HEIGHT}
              priority={i === 0}
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="absolute inset-0 h-full w-full object-cover animate-hero-crossfade"
              style={{ animationDelay: ex.delay }}
            />
          ))}

          {/* Light sweep */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shine"
          />
        </div>
      </div>
    </div>
  );
}
