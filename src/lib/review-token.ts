import crypto from 'crypto';

/**
 * Signed tokens for reviewer email links (Approach 2 — notification handoff).
 *
 * A reviewer receives an email with "Approve" / "Reject" links. Each link
 * carries a self-verifying token instead of needing a DB token table:
 *
 *     {orderId}.{action}.{expiry}.{hmac}
 *
 * The HMAC is computed over the first three parts with REVIEW_LINK_SECRET, so
 * a link cannot be forged or altered (you can't flip 'reject' to 'approve', or
 * point it at another order) without the secret. Links expire after `expiry`.
 *
 * This is intentionally stateless: clicking a stale or tampered link fails
 * verification and the route refuses to act.
 */

type ReviewAction = 'approve' | 'reject' | 'reupload-accept';

function secret(): string {
  const s = process.env.REVIEW_LINK_SECRET;
  if (!s) {
    throw new Error('REVIEW_LINK_SECRET is not set — cannot sign review links');
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

/** Build a token valid for `ttlHours` (default 7 days). */
export function createReviewToken(
  orderId: string,
  action: ReviewAction,
  ttlHours = 24 * 7,
): string {
  const expiry = Date.now() + ttlHours * 60 * 60 * 1000;
  const payload = `${orderId}.${action}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export interface VerifiedReviewToken {
  orderId: string;
  action: ReviewAction;
}

/**
 * Verify a token. Returns the decoded {orderId, action} if the signature is
 * valid and unexpired, otherwise null. Uses a constant-time comparison so the
 * check doesn't leak timing information about the expected signature.
 */
export function verifyReviewToken(token: string): VerifiedReviewToken | null {
  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [orderId, action, expiryStr, providedSig] = parts;
  if (action !== 'approve' && action !== 'reject' && action !== 'reupload-accept') return null;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  const expectedSig = sign(`${orderId}.${action}.${expiryStr}`);

  const a = Buffer.from(providedSig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { orderId, action };
}
