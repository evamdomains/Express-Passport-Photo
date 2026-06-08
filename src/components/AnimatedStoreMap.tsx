'use client';

/**
 * AnimatedStoreMap
 * ----------------
 * A lightweight, dependency-free animated "map" used in the Store Locator hero.
 * It renders entirely with SVG + CSS (Tailwind keyframes defined in
 * tailwind.config.ts), so it ships as part of the JS bundle — there is no video
 * file to download, no Lottie runtime, and it animates on the GPU (transform /
 * opacity only). This is the production default.
 *
 * ── Swapping in a real motion video later ─────────────────────────────────
 * When a designed MP4/WebM is available, drop it in /public/video/ and replace
 * the <svg> scene below with the documented <video> block (kept commented at
 * the bottom of this file). The surrounding card styling already matches the
 * recommended 4:3 / 16:10 container, so no layout changes are needed.
 */

type Pin = {
  /** left / top position as a percentage of the map */
  x: number;
  y: number;
  label: string;
  /** Tailwind classes for the pin body color */
  color: string;
  /** staggered entrance delay (seconds) */
  delay: number;
  /** the highlighted "nearest" store gets the radar ring + label card */
  nearest?: boolean;
};

const PINS: Pin[] = [
  { x: 50, y: 52, label: 'CVS', color: 'bg-red-500', delay: 0.2, nearest: true },
  { x: 27, y: 33, label: 'Walgreens', color: 'bg-blue-600', delay: 0.45 },
  { x: 73, y: 30, label: 'FedEx Office', color: 'bg-purple-600', delay: 0.7 },
  { x: 30, y: 72, label: 'Print Shop', color: 'bg-brand-600', delay: 0.95 },
  { x: 76, y: 70, label: 'CVS', color: 'bg-red-500', delay: 1.2 },
];

export default function AnimatedStoreMap() {
  return (
    <div className="relative w-full max-w-xl mx-auto select-none" aria-hidden="true">
      {/* Soft brand glow behind the card */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-400/30 via-sky-300/20 to-cyan-200/30 blur-3xl animate-glow-pulse" />

      {/* Map card */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        {/* ── Map surface (slow drifting) ───────────────────────────────── */}
        <div className="absolute inset-0 animate-map-drift">
          {/* Base tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-sky-50" />

          {/* Roads / grid */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {/* Subtle parcel blocks */}
            {[40, 120, 200, 280, 360].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#e2e8f0" strokeWidth="1" />
            ))}
            {[50, 110, 170, 230].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="1" />
            ))}

            {/* Primary roads */}
            <path d="M-10 210 L180 150 L300 190 L420 120" fill="none" stroke="#dbeafe" strokeWidth="10" strokeLinecap="round" />
            <path d="M70 -10 L120 120 L100 320" fill="none" stroke="#dbeafe" strokeWidth="8" strokeLinecap="round" />

            {/* Animated route from center to the nearest store */}
            <path
              d="M200 156 C 170 120, 150 110, 108 100"
              fill="none"
              stroke="url(#route)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 10"
              className="animate-route-draw"
            />
          </svg>
        </div>

        {/* ── Store pins ─────────────────────────────────────────────────── */}
        {PINS.map((pin, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <div
              className="relative flex flex-col items-center animate-pin-drop"
              style={{ animationDelay: `${pin.delay}s` }}
            >
              {/* Radar pulse on the highlighted nearest store */}
              {pin.nearest && (
                <>
                  <span className="absolute bottom-0 h-6 w-6 rounded-full bg-brand-500/40 animate-radar" />
                  <span
                    className="absolute bottom-0 h-6 w-6 rounded-full bg-brand-500/40 animate-radar"
                    style={{ animationDelay: '1.4s' }}
                  />
                </>
              )}

              {/* Nearest-store label card */}
              {pin.nearest && (
                <div className="mb-1 whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-lg ring-1 ring-gray-900/5">
                  Nearest · 0.4 mi
                </div>
              )}

              {/* Teardrop pin */}
              <div className={`relative h-7 w-7 rounded-full ${pin.color} shadow-lg ring-2 ring-white flex items-center justify-center rotate-45`}>
                <span className="block h-2.5 w-2.5 rounded-full bg-white/90 -rotate-45" />
              </div>
            </div>
          </div>
        ))}

        {/* ── Floating "photo sheet" card (download/print cue) ───────────── */}
        <div className="absolute bottom-4 right-4 animate-sheet-float">
          <div className="rounded-xl bg-white p-2 shadow-xl ring-1 ring-gray-900/5">
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 w-6 rounded-sm bg-gradient-to-b from-sky-100 to-brand-100 ring-1 ring-brand-200/60" />
              ))}
            </div>
            <p className="mt-1 text-center text-[9px] font-semibold text-brand-700">4×6 sheet</p>
          </div>
        </div>

        {/* Search-chip cue, top-left */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-md ring-1 ring-gray-900/5">
          <svg className="h-3.5 w-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4-4" />
          </svg>
          <span className="text-[11px] font-semibold text-gray-700">ZIP 10001</span>
        </div>
      </div>

      {/*
        ── VIDEO ALTERNATIVE (drop-in) ───────────────────────────────────────
        When you have a designed motion file, replace the map card above with:

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-50 shadow-2xl ring-1 ring-gray-900/5">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"               // lazy: don't block first paint
            poster="/video/store-locator-poster.webp"
            aria-hidden="true"
          >
            <source src="/video/store-locator.webm" type="video/webm" />
            <source src="/video/store-locator.mp4"  type="video/mp4" />
          </video>
        </div>

        Recommended encode: 1280×960 (4:3) or 1280×800 (16:10), 24–30fps,
        8–12s seamless loop, H.264 (mp4) + VP9 (webm), target < 3 MB,
        no audio track. Provide a lightweight WebP/JPEG poster of the end frame.
      */}
    </div>
  );
}
