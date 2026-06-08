/**
 * AiPreviewDemo — Upload-page hero video
 * --------------------------------------
 * Plays the product-demo video (selfie → AI face detection → background removal
 * → compliance check → passport photo) in the hero. Rendered inside a premium
 * rounded frame with a soft brand glow.
 *
 * The <video> is muted + autoplay + loop + playsInline so it behaves like an
 * ambient motion graphic (browsers allow autoplay only when muted). No client
 * JS is required, so this stays a server component.
 *
 * To swap the video later: drop a new file in /public/images/backgrounds/ and
 * change ONLY the source paths below.
 */

const HERO_VIDEO_MP4 = '/images/backgrounds/bg2.mp4';

export default function AiPreviewDemo() {
  return (
    <div className="relative w-full max-w-2xl mx-auto" aria-hidden="true">
      {/* Soft brand glow */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-400/25 via-sky-300/20 to-cyan-200/25 blur-3xl animate-glow-pulse" />

      {/* Video frame */}
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-gray-100 shadow-2xl ring-1 ring-gray-900/5">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          // poster="/images/backgrounds/bg2-poster.webp"  // optional: add a lightweight first-frame poster
        >
          <source src={HERO_VIDEO_MP4} type="video/mp4" />
          {/* Add a WebM source here for better compression/Lighthouse if you encode one:
              <source src="/images/backgrounds/bg2.webm" type="video/webm" /> */}
        </video>
      </div>
    </div>
  );
}
