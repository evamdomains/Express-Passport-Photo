import { NextRequest, NextResponse } from 'next/server';
import { FEATURES, isFreeCanadianDocument } from '@/config/features';
import { runFreeCanadianPipeline } from '@/lib/generation/free-canadian-generator';
import type { GateExtras } from '@/lib/face/compliance-gate';
import type { BiometricData, ImageQualityMetrics } from '@/types/biometric';
import type { ObjectsAndObstruction } from '@/lib/face/object-compliance';
import type { GlassesResult } from '@/lib/face/GlassesDetector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * FREE CANADIAN FLOW — isolated from /api/process-photo (which is untouched).
 *
 *   Upload → Compliance gate → (PASS) → PhotoRoom → single JPEG → download.
 *
 * NO order, NO Supabase storage, NO signed URLs, NO Stripe, NO email, NO
 * watermark/preview, NO tiled sheet, NO PDF. Returns the JPEG bytes directly.
 * Only reachable for canadian_passport / canadian_pr_card while FREE_CANADIAN is on.
 */
export async function POST(req: NextRequest) {
  // Flag off → the free flow does not exist; the client routes to premium instead.
  if (!FEATURES.FREE_CANADIAN) {
    return NextResponse.json({ error: 'Free flow is disabled.' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('photo') as File | null;
  const documentTypeId = formData.get('documentTypeId') as string | null;

  if (!file) return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  if (!documentTypeId || !isFreeCanadianDocument(documentTypeId)) {
    // Non-Canadian (or flag-off) requests must use the premium /api/process-photo.
    return NextResponse.json({ error: 'This document is not eligible for the free flow.' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return NextResponse.json({ error: 'File must be a JPEG, PNG, WEBP, or HEIC image' }, { status: 422 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 422 });
  }

  // Parse the same client-measured signals the premium gate uses.
  let biometric: BiometricData | undefined;
  let quality: ImageQualityMetrics | undefined;
  let objects: ObjectsAndObstruction | undefined;
  let objectSharpness: number | undefined;
  let glasses: GlassesResult | undefined;
  try { const r = formData.get('biometric'); if (typeof r === 'string') biometric = JSON.parse(r) as BiometricData; } catch { /* ignore */ }
  try { const r = formData.get('quality'); if (typeof r === 'string') quality = JSON.parse(r) as ImageQualityMetrics; } catch { /* ignore */ }
  try { const r = formData.get('objects'); if (typeof r === 'string') objects = JSON.parse(r) as ObjectsAndObstruction; } catch { /* ignore */ }
  try { const r = formData.get('objectSharpness'); if (typeof r === 'string') objectSharpness = Number(r); } catch { /* ignore */ }
  try { const r = formData.get('glasses'); if (typeof r === 'string') glasses = JSON.parse(r) as GlassesResult; } catch { /* ignore */ }

  const extras: GateExtras = { quality, objects, objectSharpness: objectSharpness ?? null, glasses };
  const imageBuffer = Buffer.from(await file.arrayBuffer());

  const result = await runFreeCanadianPipeline({ imageBuffer, documentTypeId, biometric, extras });

  if (!result.ok) {
    return NextResponse.json(
      { status: 'REJECTED', stage: 'COMPLIANCE', errors: result.errors, error: result.errors[0] ?? 'Photo did not pass compliance.' },
      { status: 422 },
    );
  }

  // Success → stream the single JPEG back for immediate download.
  return new NextResponse(new Uint8Array(result.jpeg), {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="passport-photo.jpeg"',
      'Cache-Control': 'no-store',
    },
  });
}
