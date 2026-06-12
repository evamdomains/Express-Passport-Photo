import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage layout + signed-URL helpers.
 *
 * The `photos` bucket is PRIVATE. Sensitive assets (original / processed /
 * composite / print.pdf) are never exposed publicly — they are delivered only
 * through the secure /download/* routes, which mint short-lived signed URLs
 * after verifying payment. The watermarked low-res `preview.jpg` is streamed to
 * the browser via /api/preview/{orderId} (safe to show before payment).
 *
 * Paths are deterministic from the orderId, so no DB columns are needed to
 * locate a file — the URL columns on `orders` store these paths purely as
 * "file still exists" flags for the 48h cleanup job.
 */

export const PHOTOS_BUCKET = 'photos';

export function storagePaths(orderId: string) {
  const base = `orders/${orderId}`;
  return {
    original: `${base}/original.jpg`,
    processed: `${base}/processed.jpg`,
    composite: `${base}/composite.jpg`,
    preview: `${base}/preview.jpg`,
    pdf: `${base}/print.pdf`,
  };
}

/** Fresh short-lived signed URL for a private object (default 5 min). */
export async function createSignedDownloadUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 300,
  downloadName?: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, expiresIn, downloadName ? { download: downloadName } : undefined);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Download a private object's bytes (service-role). */
export async function downloadObject(supabase: SupabaseClient, path: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
