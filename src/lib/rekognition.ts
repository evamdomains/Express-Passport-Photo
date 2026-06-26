import {
  RekognitionClient,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition';
import type { ComplianceResult } from '@/types/order';
import type { DocumentSpec } from '@/types/document';
import { sendErrorAlert } from './alert';

const client = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface FaceAnalysis {
  detected: boolean;
  faceCount: number;
  boundingBox: { left: number; top: number; width: number; height: number } | null;
  compliance: ComplianceResult;
}


export async function analyzeFace(
  imageBuffer: Buffer,
  _spec: DocumentSpec // retained for API compatibility; face size is owned by the MediaPipe report
): Promise<FaceAnalysis> {
  const command = new DetectFacesCommand({
    Image: { Bytes: imageBuffer },
    Attributes: ['ALL'],
  });

  let response;
  try {
    response = await client.send(command);
  } catch (sdkError) {
    // SDK-level failures (auth, network, throttle) — these are infrastructure errors.
    // "No face detected" is a normal result, not an SDK error, so it never reaches here.
    await sendErrorAlert({
      api: 'AWS Rekognition',
      error: sdkError,
      context: { operation: 'DetectFaces', region: process.env.AWS_REGION },
    });
    throw sdkError;
  }

  const faces = response.FaceDetails ?? [];

  if (faces.length === 0) {
    return {
      detected: false,
      faceCount: 0,
      boundingBox: null,
      compliance: {
        passed: false,
        faceDetected: false,
        faceCount: 0,
        headHeightPercent: null,
        eyesOpen: null,
        mouthClosed: null,
        facingForward: null,
        issues: ['No face detected in photo'],
        warnings: [],
      },
    };
  }

  const face = faces[0];
  const bb = face.BoundingBox;
  const issues: string[] = [];
  const warnings: string[] = [];

  if (faces.length > 1) {
    issues.push('Multiple faces detected — only one person allowed');
  }

  // Rekognition's bounding box is EYEBROW→chin, a DIFFERENT metric than the
  // passport CROWN→chin ratio that is our single source of truth. Emitting a
  // size warning from it would contradict the SSOT on the same screen (e.g.
  // "Face 56% PASS" + "Face appears small 43%"). We keep the raw percentage on
  // the result for diagnostics only and NEVER raise a size issue/warning here —
  // face size is owned exclusively by the MediaPipe crown→chin report.
  const headHeightPercent = bb?.Height != null ? bb.Height * 100 : null;

  const eyesOpen = face.EyesOpen?.Value === true;
  if (!eyesOpen) issues.push('Eyes must be open');

  const mouthOpen = face.MouthOpen?.Value === true;
  if (mouthOpen) issues.push('Mouth must be closed or showing a natural smile');

  const pitch = face.Pose?.Pitch ?? 0;
  const roll = face.Pose?.Roll ?? 0;
  const yaw = face.Pose?.Yaw ?? 0;
  const facingForward = Math.abs(yaw) < 15 && Math.abs(pitch) < 15 && Math.abs(roll) < 10;
  if (!facingForward) issues.push('Face must be looking directly at the camera');

  if (face.Sunglasses?.Value) issues.push('No sunglasses allowed');
  if (face.Eyeglasses?.Value) warnings.push('Glasses detected — most passport authorities require no glasses');

  const brightness = face.Quality?.Brightness ?? 0;
  if (brightness < 30) warnings.push('Photo appears too dark');
  else if (brightness > 90) warnings.push('Photo may be overexposed');

  return {
    detected: true,
    faceCount: faces.length,
    boundingBox: bb
      ? { left: bb.Left ?? 0, top: bb.Top ?? 0, width: bb.Width ?? 0, height: bb.Height ?? 0 }
      : null,
    compliance: {
      passed: issues.length === 0,
      faceDetected: true,
      faceCount: faces.length,
      headHeightPercent,
      eyesOpen,
      mouthClosed: !mouthOpen,
      facingForward,
      issues,
      warnings,
    },
  };
}
