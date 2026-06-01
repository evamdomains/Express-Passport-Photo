/**
 * Centralized error alerting — sends admin email on API/infrastructure failures.
 *
 * Loop-safety: uses Resend directly (not via the resend.ts wrappers that log to
 * console). If Resend itself is unavailable the inner try/catch falls back to
 * console.error, so a Resend outage never causes recursive alert attempts.
 *
 * Usage:
 *   import { sendErrorAlert } from '@/lib/alert';
 *   catch (err) { await sendErrorAlert({ api: 'PhotoRoom', error: err, orderId }); throw err; }
 *
 * Do NOT call sendErrorAlert inside catch blocks for Resend email failures —
 * log those to console directly to avoid the double-send on Resend outages.
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@expresspassportphoto.com';

export interface AlertOptions {
  /** Human-readable API name: 'PhotoRoom', 'AWS Rekognition', 'Supabase', 'Stripe', 'Google Places' */
  api: string;
  error: unknown;
  orderId?: string;
  /** Freeform key/value context — endpoint name, operation, input params, etc. */
  context?: Record<string, unknown>;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export async function sendErrorAlert({
  api,
  error,
  orderId,
  context,
}: AlertOptions): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[alert] ADMIN_EMAIL not set — skipping error alert');
    return;
  }

  const errorText = formatError(error);
  const timestamp = new Date().toISOString();

  const contextRows = context
    ? Object.entries(context)
        .map(([k, v]) => `<tr><td style="padding:4px 0;color:#6b7280;width:140px">${k}</td><td style="color:#374151;font-family:monospace;font-size:12px">${String(v)}</td></tr>`)
        .join('')
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#fff">
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;border-radius:4px;margin-bottom:20px">
        <h2 style="margin:0 0 4px;color:#dc2626;font-size:18px">⚠️ ${api} Error</h2>
        <p style="margin:0;color:#6b7280;font-size:13px">${timestamp}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:6px 0;color:#6b7280;width:140px;vertical-align:top">API</td><td style="color:#111827;font-weight:600">${api}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Timestamp</td><td style="color:#111827">${timestamp}</td></tr>
        ${orderId ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Order ID</td><td style="color:#111827;font-family:monospace">${orderId}</td></tr>` : ''}
        ${contextRows}
      </table>

      <div style="background:#1e1e1e;border-radius:8px;padding:16px;margin-bottom:20px;overflow:auto">
        <pre style="margin:0;font-family:'Courier New',monospace;font-size:12px;color:#f8f8f2;white-space:pre-wrap;word-break:break-all">${errorText}</pre>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin"
         style="display:inline-block;background:#1A3A5C;color:#fff;padding:10px 20px;
                border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
        View Admin Dashboard →
      </a>

      <p style="color:#9ca3af;font-size:11px;margin-top:24px">
        expresspassportphoto.com · automated error alert
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `⚠️ [${api}] Error - expresspassportphoto.com`,
      html,
    });
  } catch (resendError) {
    // Resend is down or misconfigured — log everything to console so nothing is lost.
    // Do NOT call sendErrorAlert again; that would loop.
    console.error(`[alert] Could not send error alert email (Resend unavailable):`, resendError);
    console.error(`[alert] Original ${api} error at ${timestamp}${orderId ? ` (order: ${orderId})` : ''}:`, errorText);
    if (context) console.error(`[alert] Context:`, context);
  }
}
