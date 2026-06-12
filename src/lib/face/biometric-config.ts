import type { BiometricConfig } from '@/types/biometric';
import type { DocumentSpec, DocumentTypeId } from '@/types/document';

/**
 * DOCUMENT_RULES — the single source of truth for per-document biometric rules.
 *
 * Every sizing/validation/crop/preview value derives from the selected document
 * type. Dimensions (px/dpi/tiles) live in document-specs.ts; this file holds the
 * biometric thresholds. Add a new country by adding an entry here (and its
 * dimensional spec) — no engine changes needed.
 */

const STRICT_MOUTH = {
  allowBroadSmile: false,
  allowOpenMouth: false,
  allowVisibleTeeth: false,
  strictTeethDetection: true,
  teethThreshold: 0.05,
};

// US 2×2in eye line: eyes 1⅛–1⅜in from the bottom of a 2in photo → 31.25–43.75% from top.
const US_EYE = { eyeLineFromTopMin: 0.3125, eyeLineFromTopMax: 0.4375 };

const CANADA_RULES: BiometricConfig = {
  faceRatioMin: 0.44,
  faceRatioMax: 0.51,
  targetRatio: 0.47,
  optimalMin: 0.46,
  optimalMax: 0.48,
  eyeLineFromTopMin: 0.36,
  eyeLineFromTopMax: 0.5,
  yawTol: 12,
  pitchTol: 12,
  rollTol: 8,
  poseWarnMultiplier: 0.6,
  ...STRICT_MOUTH,
  smileSlightMax: 0.4,
  smileBroadMax: 0.7,
  mouthOpenJaw: 0.35,
};

export const DOCUMENT_RULES: Record<DocumentTypeId, BiometricConfig> = {
  // US Passport — 2×2in, head 50–69%, target 56.5%.
  us_passport: {
    faceRatioMin: 0.5,
    faceRatioMax: 0.69,
    targetRatio: 0.565,
    optimalMin: 0.55,
    optimalMax: 0.58,
    ...US_EYE,
    yawTol: 15,
    pitchTol: 15,
    rollTol: 10,
    poseWarnMultiplier: 0.6,
    ...STRICT_MOUTH,
    smileSlightMax: 0.5,
    smileBroadMax: 0.85,
    mouthOpenJaw: 0.35,
  },

  // US Visa — 2×2in, head 50–70%. Targets 56.5% to match the US Passport /
  // passport-photo.online composition, while keeping the wider 56–64% optimal band.
  us_visa: {
    faceRatioMin: 0.5,
    faceRatioMax: 0.7,
    targetRatio: 0.565,
    optimalMin: 0.56,
    optimalMax: 0.64,
    ...US_EYE,
    yawTol: 15,
    pitchTol: 15,
    rollTol: 10,
    poseWarnMultiplier: 0.6,
    ...STRICT_MOUTH,
    smileSlightMax: 0.5,
    smileBroadMax: 0.85,
    mouthOpenJaw: 0.35,
  },

  // US Baby Passport — same sizing as US passport; relaxed infant rules.
  baby_passport: {
    faceRatioMin: 0.5,
    faceRatioMax: 0.69,
    targetRatio: 0.565,
    optimalMin: 0.55,
    optimalMax: 0.58,
    ...US_EYE,
    // Larger pose tolerance — infants can't hold a perfectly square pose.
    yawTol: 22,
    pitchTol: 22,
    rollTol: 15,
    poseWarnMultiplier: 0.6,
    ...STRICT_MOUTH,
    smileSlightMax: 0.5,
    smileBroadMax: 0.85,
    mouthOpenJaw: 0.4,
    infant: true,
    relaxedEyes: true, // newborns may have partially-open eyes → WARNING, not FAIL
  },

  canadian_passport: CANADA_RULES,
  canadian_pr_card: CANADA_RULES,
};

/** Resolve the biometric rules for a document spec (falls back to US passport). */
export function getBiometricConfig(spec: DocumentSpec): BiometricConfig {
  return DOCUMENT_RULES[spec.id] ?? DOCUMENT_RULES.us_passport;
}

/** Target ratio the auto-scaler aims for (the optimal ratio, not the band midpoint). */
export function targetFaceRatio(cfg: BiometricConfig): number {
  return cfg.targetRatio;
}

/** Target eye line (fraction from top) the auto-scaler aims for. */
export function targetEyeLineFromTop(cfg: BiometricConfig): number {
  return (cfg.eyeLineFromTopMin + cfg.eyeLineFromTopMax) / 2;
}
