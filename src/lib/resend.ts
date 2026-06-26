import { Resend } from 'resend';
import { createReviewToken } from './review-token';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@expresspassportphoto.com';

/**
 * Customer delivery email. The generated files are ATTACHED directly (JPEG +
 * print-ready PDF) — no download buttons, links, signed URLs, or tokens — so the
 * customer permanently owns their files even after the 48h storage cleanup.
 *
 * Complete-or-nothing: throws if either attachment buffer is missing, so a
 * partial email (one of the purchased files) is never sent. Callers read the
 * ALREADY-GENERATED files (processed JPEG from storage + the PDF built during
 * fulfilment) and pass the buffers in — nothing is regenerated here.
 */
export async function sendDigitalDownloadEmail({
  to,
  orderId,
  documentTypeName,
  jpegBuffer,
  pdfBuffer,
}: {
  to: string;
  orderId: string;
  documentTypeName: string;
  /** Already-generated processed passport JPEG. */
  jpegBuffer: Buffer;
  /** Already-generated print-ready 4×6 PDF. */
  pdfBuffer: Buffer;
}) {
  if (!jpegBuffer?.length || !pdfBuffer?.length) {
    throw new Error(
      `Refusing to send delivery email for ${orderId} — missing ${!jpegBuffer?.length ? 'JPEG' : ''}${!jpegBuffer?.length && !pdfBuffer?.length ? ' and ' : ''}${!pdfBuffer?.length ? 'PDF' : ''} attachment`,
    );
  }

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your passport photos are ready — Express Passport Photo',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">Your passport photos are ready</h1>
        <p style="color:#374151;margin-bottom:16px">
          We've attached your <strong>${documentTypeName}</strong> files directly to this email.
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-weight:600;color:#111827;font-size:14px">Included:</p>
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.8">
            ✓ Passport Photo (JPEG) — passport-photo.jpg<br/>
            ✓ Print-Ready Passport Sheet (PDF) — passport-photo-print.pdf
          </p>
        </div>
        <p style="color:#374151;font-size:14px;margin-bottom:16px">
          Please download and save these attachments for your records.
        </p>
        <p style="color:#6b7280;font-size:14px">
          The PDF contains your photos tiled on a 4×6 layout — print it at any CVS,
          Walgreens, or photo lab as a standard 4×6 photo print.
        </p>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">
          For your privacy, all photos stored on our servers are automatically deleted after 48
          hours — your attached copies are yours to keep.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Order ID: ${orderId}<br/>
          Express Passport Photo · expresspassportphoto.com<br/>
          Photos are deleted within 48 hours of your order.
        </p>
      </div>
    `,
    attachments: [
      { filename: 'passport-photo.jpg', content: jpegBuffer.toString('base64'), contentType: 'image/jpeg' },
      { filename: 'passport-photo-print.pdf', content: pdfBuffer.toString('base64'), contentType: 'application/pdf' },
    ],
  });
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  documentTypeName,
  storeName,
  storeAddress,
  storeMapsUrl,
}: {
  to: string;
  orderId: string;
  documentTypeName: string;
  storeName: string;
  storeAddress: string;
  storeMapsUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Order confirmed — Express Passport Photo',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">Order confirmed</h1>
        <p style="color:#374151;margin-bottom:16px">
          We've received your order for a <strong>${documentTypeName}</strong> photo.
          We're uploading your prints to the store now — you'll get another email with
          your pickup details once they're ready (usually within 3 hours).
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-weight:600;color:#111827">${storeName}</p>
          <p style="margin:0;color:#6b7280;font-size:14px">${storeAddress}</p>
          <a href="${storeMapsUrl}" style="display:inline-block;margin-top:8px;color:#2563eb;font-size:13px;">
            View on Google Maps →
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Order ID: ${orderId}<br/>
          Express Passport Photo · expresspassportphoto.com
        </p>
      </div>
    `,
  });
}

export async function sendPickupReadyEmail({
  to,
  orderId,
  documentTypeName,
  storeName,
  storeAddress,
  storeMapsUrl,
  pickupTime,
}: {
  to: string;
  orderId: string;
  documentTypeName: string;
  storeName: string;
  storeAddress: string;
  storeMapsUrl: string;
  pickupTime: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your passport photos are ready for pickup!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">Your photos are ready!</h1>
        <p style="color:#374151;margin-bottom:24px">
          Your <strong>${documentTypeName}</strong> photos have been uploaded and are
          waiting for you at the store.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#15803d">
            Pickup time: ${pickupTime}
          </p>
          <p style="margin:0 0 4px;font-weight:600;color:#111827;font-size:15px">${storeName}</p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:14px">${storeAddress}</p>
          <a href="${storeMapsUrl}" style="display:inline-block;color:#2563eb;font-size:13px;">
            Get directions →
          </a>
        </div>

        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0;font-weight:600;color:#92400e;font-size:14px">What to say at the counter:</p>
          <p style="margin:8px 0 0;color:#78350f;font-size:14px">
            "I have a photo order under <strong>${to}</strong>"
          </p>
        </div>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Order ID: ${orderId}<br/>
          Express Passport Photo · expresspassportphoto.com
        </p>
      </div>
    `,
  });
}

export async function sendAdminNewOrderEmail({
  orderId,
  customerEmail,
  documentTypeName,
  storeName,
  storeAddress,
  storeMapsUrl,
  photoCompositeUrl,
  pdfBuffer,
}: {
  orderId: string;
  customerEmail: string;
  documentTypeName: string;
  storeName: string;
  storeAddress: string;
  storeMapsUrl: string;
  photoCompositeUrl: string | null;
  pdfBuffer: Buffer | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[resend] ADMIN_EMAIL not set — skipping admin notification');
    return;
  }

  const hasPdf = pdfBuffer !== null;
  const pdfNote = hasPdf
    ? 'The print-ready 4×6 PDF is attached.'
    : photoCompositeUrl
      ? `PDF generation failed — <a href="${photoCompositeUrl}" style="color:#2563eb">download the 4×6 JPEG composite instead</a>.`
      : 'Photo composite not yet available — check the admin dashboard.';

  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New order to upload — ${storeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">New Printed &amp; Ready order</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Customer</td><td style="color:#111827">${customerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Document</td><td style="color:#111827">${documentTypeName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Store</td><td style="color:#111827">${storeName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Address</td><td style="color:#111827">${storeAddress}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Order ID</td><td style="color:#111827;font-family:monospace">${orderId}</td></tr>
        </table>
        <p style="color:#374151;font-size:14px">${pdfNote}</p>
        <p style="color:#374151;font-size:14px;margin-top:12px">
          Upload to <a href="${storeMapsUrl}" style="color:#2563eb">${storeName}'s photo portal</a>,
          then mark as uploaded in the
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#2563eb">admin dashboard</a>.
        </p>
      </div>
    `,
    ...(hasPdf && pdfBuffer && {
      attachments: [
        {
          filename: `passport-order-${orderId.slice(0, 8)}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    }),
  });
}

// ── Delivery-email failure alert (retries exhausted) ─────────────────────────

/**
 * Sent to the admin when a customer delivery email has failed every retry
 * (email_retry_count hit the cap). Surfaces the order so it can be sent manually.
 */
export async function sendEmailFailureAdminAlert({
  orderId,
  customerEmail,
  retryCount,
  error,
}: {
  orderId: string;
  customerEmail: string;
  retryCount: number;
  error: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'dhanush@sharma-foundation.org';
  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: 'Delivery Email Failed',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#b91c1c;margin-bottom:8px">Delivery email failed</h1>
        <p style="color:#374151;margin-bottom:20px;font-size:14px">
          A customer's passport-photo delivery email could not be sent after ${retryCount} attempts.
          The order is fulfilled and the files are ready — please resend manually.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Order ID</td><td style="color:#111827;font-family:monospace">${escapeHtml(orderId)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Customer email</td><td style="color:#111827">${escapeHtml(customerEmail)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Retry count</td><td style="color:#111827">${retryCount}</td></tr>
        </table>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px">
          <p style="margin:0 0 6px;font-weight:600;color:#991b1b;font-size:13px">Last error</p>
          <p style="margin:0;color:#7f1d1d;font-size:13px;font-family:monospace;white-space:pre-wrap">${escapeHtml(error)}</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">Express Passport Photo · delivery-email monitor</p>
      </div>
    `,
  });
}

// ── Contact form ───────────────────────────────────────────────────────────

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Sent to our expert when a customer submits the Contact Us form. The customer's
 * email is set as reply-to, so the expert can reply directly from their inbox.
 * Routes to REVIEW_TEAM_EMAIL (our expert), falling back to ADMIN_EMAIL.
 */
export async function sendContactEmail({
  name,
  email,
  phone,
  documentType,
  message,
}: {
  name: string;
  email: string;
  phone: string | null;
  documentType: string;
  message: string;
}) {
  const expertEmail = process.env.REVIEW_TEAM_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!expertEmail) {
    console.warn('[resend] REVIEW_TEAM_EMAIL / ADMIN_EMAIL not set — cannot deliver contact form');
    throw new Error('Contact destination is not configured');
  }

  return resend.emails.send({
    from: FROM,
    to: expertEmail,
    replyTo: email,
    subject: `New contact enquiry — ${documentType}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">New contact enquiry</h1>
        <p style="color:#374151;margin-bottom:20px;font-size:14px">
          A customer submitted the Contact Us form. Reply to this email to respond directly.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Name</td><td style="color:#111827">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="color:#111827"><a href="mailto:${escapeHtml(email)}" style="color:#2563eb">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="color:#111827">${phone ? escapeHtml(phone) : '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Document type</td><td style="color:#111827">${escapeHtml(documentType)}</td></tr>
        </table>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-weight:600;color:#111827;font-size:13px">Message</p>
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Express Passport Photo · contact form submission
        </p>
      </div>
    `,
  });
}

// ── Human-review path (Approach 2 — notification handoff) ──────────────────

/**
 * Sent to the review team when a customer submits a photo for expert human
 * review. Contains the photo and two signed action links (Approve / Reject).
 * Clicking a link lands the reviewer on /review/confirm, which performs the
 * action server-side.
 */
export async function sendReviewRequestEmail({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  documentTypeName,
  photoUrl,
}: {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  documentTypeName: string;
  /** A viewable URL for the uploaded original (signed, time-limited). */
  photoUrl: string | null;
}) {
  const reviewEmail = process.env.REVIEW_TEAM_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!reviewEmail) {
    console.warn('[resend] REVIEW_TEAM_EMAIL / ADMIN_EMAIL not set — skipping review notification');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const approveUrl = `${appUrl}/review/confirm?action=approve&token=${createReviewToken(orderId, 'approve')}`;
  const rejectUrl = `${appUrl}/review/confirm?action=reject&token=${createReviewToken(orderId, 'reject')}`;
  const reuploadAcceptUrl = `${appUrl}/review/confirm?action=reupload-accept&token=${createReviewToken(orderId, 'reupload-accept')}`;

  return resend.emails.send({
    from: FROM,
    to: reviewEmail,
    subject: `Photo to review — ${documentTypeName} — Order ${orderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">New photo for expert review</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Name</td><td style="color:#111827">${customerName ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="color:#111827">${customerEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Phone</td><td style="color:#111827">${customerPhone ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Document</td><td style="color:#111827">${documentTypeName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Order ID</td><td style="color:#111827;font-family:monospace">${orderId}</td></tr>
        </table>
        ${
          photoUrl
            ? `<div style="margin-bottom:24px"><img src="${photoUrl}" alt="Submitted photo" style="max-width:280px;border-radius:8px;border:1px solid #e5e7eb"/></div>`
            : `<p style="color:#6b7280;font-size:14px">Photo preview unavailable — open the order in the dashboard.</p>`
        }
        <p style="color:#374151;font-size:14px;margin-bottom:16px">
          Review the photo, then choose an outcome:
        </p>
        <ul style="color:#374151;font-size:13px;line-height:1.7;margin:0 0 16px;padding-left:18px">
          <li><strong>Approve</strong> — generates the customer's print-ready files and unlocks their download on the site.</li>
          <li><strong>Reject</strong> — marks the photo failed. Email the customer the reasons; they'll reply with a corrected photo.</li>
          <li><strong>Re-uploaded photo accepted</strong> — use this ONLY after a rejection, once the customer has emailed you a corrected photo you're happy with. It opens an upload box on YOUR confirm page where you upload that photo; we then generate the files and the customer just continues to checkout.</li>
        </ul>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:12px">
              <a href="${approveUrl}"
                 style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                Approve
              </a>
            </td>
            <td>
              <a href="${rejectUrl}"
                 style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                Reject
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin:20px 0 8px">After a rejection &amp; the customer's emailed re-upload:</p>
        <a href="${reuploadAcceptUrl}"
           style="display:inline-block;background:#1A3A5C;color:#fff;padding:14px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Re-uploaded photo accepted
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          These links are valid for 7 days. HubSpot live chat is for customer enquiries
          only — the buttons above are how outcomes are recorded. Express Passport Photo — internal review.
        </p>
      </div>
    `,
  });
}

/**
 * Sent to the customer right after they submit a photo for human review, so
 * they know it's in the queue and that the team will reach them on live chat.
 */
export async function sendReviewSubmittedEmail({
  to,
  orderId,
  documentTypeName,
}: {
  to: string;
  orderId: string;
  documentTypeName: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your photo is being reviewed — Express Passport Photo',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">Your photo is in review</h1>
        <p style="color:#374151;margin-bottom:16px">
          Thanks! One of our specialists is checking your
          <strong>${documentTypeName}</strong> photo. We'll reach out to you on
          live chat with the result — whether it's approved, or if it needs a
          small change.
        </p>

        <!-- Order ID — the customer should save this to check status anytime -->
        <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.05em">Your Order ID — please save this</p>
          <p style="margin:0;font-family:monospace;font-size:16px;color:#111827">${orderId}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#6b7280">
            Keep this somewhere safe. You can check your review status anytime by entering it on our
            homepage, or with the button below.
          </p>
        </div>

        <a href="${appUrl}/review-status?orderId=${orderId}"
           style="display:inline-block;background:#1A3A5C;color:#fff;padding:14px 24px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:24px">
          View status
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Order ID: ${orderId}<br/>
          Express Passport Photo · expresspassportphoto.com
        </p>
      </div>
    `,
  });
}
