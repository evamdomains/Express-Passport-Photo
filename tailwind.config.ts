import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        // Gentle 3D bob — drifts up/down while turning on the X/Y axes so the
        // card reads like a floating object in space rather than a flat image.
        float3d: {
          "0%, 100%": { transform: "translateY(0) rotateX(0deg) rotateY(-7deg) rotateZ(-1deg)" },
          "50%":      { transform: "translateY(-20px) rotateX(5deg) rotateY(7deg) rotateZ(1deg)" },
        },
        // Mirror of float3d, slightly out of phase, for the opposite-side image.
        float3dAlt: {
          "0%, 100%": { transform: "translateY(0) rotateX(0deg) rotateY(7deg) rotateZ(1deg)" },
          "50%":      { transform: "translateY(-20px) rotateX(-5deg) rotateY(-7deg) rotateZ(-1deg)" },
        },
        // Diagonal light sweep across the card — the "video motion" highlight.
        shine: {
          "0%":   { transform: "translateX(-160%) skewX(-20deg)" },
          "60%, 100%": { transform: "translateX(320%) skewX(-20deg)" },
        },
        // Soft pulsing halo behind the card.
        glowPulse: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.97)" },
          "50%":      { opacity: "0.7",  transform: "scale(1.04)" },
        },
        // ── Store-locator animated map ──────────────────────────────────
        // A map pin drops in from above and settles with a slight bounce.
        pinDrop: {
          "0%":   { opacity: "0", transform: "translateY(-26px) scale(0.6)" },
          "60%":  { opacity: "1", transform: "translateY(4px) scale(1.04)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Expanding radar ring used for the highlighted nearest store.
        radarPing: {
          "0%":   { transform: "scale(0.5)", opacity: "0.7" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        // Slow Ken-Burns drift so the map never feels static.
        mapDrift: {
          "0%, 100%": { transform: "scale(1.06) translate(0, 0)" },
          "50%":      { transform: "scale(1.1) translate(-1.2%, -1%)" },
        },
        // Gentle float for the floating photo-sheet card.
        sheetFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%":      { transform: "translateY(-10px) rotate(-4deg)" },
        },
        // Animated dashed route drawing from search point to nearest store.
        routeDraw: {
          "0%":   { strokeDashoffset: "260" },
          "100%": { strokeDashoffset: "0" },
        },
        // ── Upload-page AI preview demo ─────────────────────────────────
        // AI scan line sweeping down the photo.
        demoScan: {
          "0%":        { top: "6%",  opacity: "0" },
          "12%":       { opacity: "1" },
          "88%":       { opacity: "1" },
          "100%":      { top: "90%", opacity: "0" },
        },
        // Compliance items lighting up in a cascading wave.
        demoTick: {
          "0%, 100%":  { opacity: "0.3", transform: "scale(0.96)" },
          "10%":       { opacity: "1",   transform: "scale(1.06)" },
          "20%, 72%":  { opacity: "1",   transform: "scale(1)" },
        },
        // Face-detection bracket breathing.
        demoBracket: {
          "0%, 100%":  { opacity: "0.85", transform: "scale(1)" },
          "50%":       { opacity: "1",    transform: "scale(1.03)" },
        },
        // Before→after arrow nudge.
        demoArrow: {
          "0%, 100%":  { transform: "translateX(0)",   opacity: "0.55" },
          "50%":       { transform: "translateX(5px)", opacity: "1" },
        },
        // Hero before/after showcase: 6s loop — one example holds ~2.5s, then a
        // ~0.5s crossfade to the other. A second layer runs this offset by -3s.
        heroCrossfade: {
          "0%":   { opacity: "1" },
          "42%":  { opacity: "1" },
          "50%":  { opacity: "0" },
          "92%":  { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "float-3d":     "float3d 6s ease-in-out infinite",
        "float-3d-alt": "float3dAlt 6.5s ease-in-out infinite",
        "shine":        "shine 4.5s ease-in-out infinite",
        "glow-pulse":   "glowPulse 4s ease-in-out infinite",
        "pin-drop":     "pinDrop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "radar":        "radarPing 2.8s ease-out infinite",
        "map-drift":    "mapDrift 16s ease-in-out infinite",
        "sheet-float":  "sheetFloat 5s ease-in-out infinite",
        "route-draw":   "routeDraw 2.6s ease-in-out infinite alternate",
        "demo-scan":    "demoScan 2.8s ease-in-out infinite",
        "demo-tick":    "demoTick 5.5s ease-in-out infinite",
        "demo-bracket": "demoBracket 2.6s ease-in-out infinite",
        "demo-arrow":   "demoArrow 1.6s ease-in-out infinite",
        "hero-crossfade": "heroCrossfade 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
