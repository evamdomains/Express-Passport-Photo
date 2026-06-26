import { measureCrownYNorm } from './sharp-utils';
import { computeCrop } from './face/PassportComplianceEngine';
import { getBiometricConfig } from './face/biometric-config';
import type { DocumentSpec } from '@/types/document';
import type { CropRect, BiometricData } from '@/types/biometric';

/**
 * Target-ratio crop for the HUMAN-REVIEW path, reusing the SAME MediaPipe
 * biometric + computeCrop() + DOCUMENT_RULES as the instant-AI path — no
 * Rekognition. The biometric was measured in the browser at upload and stored on
 * the order; here we refine the crown from the PhotoRoom alpha silhouette (the
 * exact step /api/process-photo does) and run computeCrop(), so the face scales
 * to the document's required ratio identically to the AI flow.
 *
 * Returns undefined if there's no usable biometric (caller then composes with
 * the legacy cover resize, so generation never fails outright).
 */
export async function cropFromBiometric(
  biometric: BiometricData | undefined,
  transparentPng: Buffer,
  spec: DocumentSpec,
): Promise<CropRect | undefined> {
  try {
    if (!biometric?.faceDetected || !biometric.imageHeight) return undefined;
    const cfg = getBiometricConfig(spec);

    // Refine face height to the TRUE crown (top of hair) from the alpha cutout,
    // mirroring the AI pipeline so both paths land on the same crop.
    let refined = biometric;
    const crownYNorm = await measureCrownYNorm(transparentPng);
    if (crownYNorm != null) {
      const chinYNorm = biometric.chinY / biometric.imageHeight;
      const trueFaceHeightNorm = Math.max(0.05, chinYNorm - crownYNorm);
      refined = { ...biometric, faceHeightNorm: trueFaceHeightNorm, faceRatio: trueFaceHeightNorm };
    }
    return computeCrop(refined, spec, cfg);
  } catch {
    return undefined;
  }
}
