/**
 * MediaPipe / TFLite emit benign initialization status lines (e.g.
 * "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.") via the Emscripten
 * runtime, which routes them through `console.error`. Next.js's dev error
 * overlay surfaces ANY `console.error` as a red "Console Error", so these
 * harmless logs pop a false error panel.
 *
 * This installs a narrow `console.error` filter that downgrades ONLY those known
 * benign MediaPipe/TFLite INFO lines to `console.debug` (still visible in the
 * console, but no overlay). Everything else — real exceptions, unrelated
 * warnings, genuine MediaPipe failures — passes through to the original
 * `console.error` untouched.
 *
 * It does not touch MediaPipe/compliance/face-scaling/inference logic.
 */

// Explicit benign phrases.
const BENIGN_PHRASES = [
  /Created TensorFlow Lite XNNPACK delegate/i,
  /Feedback manager requires a model with a single signature inference/i,
];

// MediaPipe/Emscripten init chatter is prefixed "INFO:" and mentions a known
// TFLite/MediaPipe token. Real failures are not "INFO:"-prefixed.
const INFO_PREFIX = /^\s*INFO:/;
const MP_TOKENS = /(TensorFlow Lite|XNNPACK|delegate|single signature|Feedback manager|MediaPipe|GL version|gl_context|tflite)/i;

function isBenignMediapipeLog(args: unknown[]): boolean {
  const text = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
  if (!text) return false;
  if (BENIGN_PHRASES.some((p) => p.test(text))) return true;
  return INFO_PREFIX.test(text) && MP_TOKENS.test(text);
}

let installed = false;

/** Idempotent, browser-only. Call before MediaPipe runs its first inference. */
export function suppressMediapipeConsoleNoise(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (isBenignMediapipeLog(args)) {
      // Keep it in the console for debugging, but don't trip the dev overlay.
      console.debug('[mediapipe]', ...args);
      return;
    }
    originalError(...args);
  };
}
