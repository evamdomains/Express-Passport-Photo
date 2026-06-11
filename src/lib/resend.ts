import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@expresspassportphoto.com';

export async function sendDigitalDownloadEmail({
  to,
  orderId,
  jpegUrl,
  pdfUrl,
  documentTypeName,
}: {
  to: string;
  orderId: string;
  /** Secure application download routes (never expire; mint signed URLs on click). */
  jpegUrl: string;
  pdfUrl: string;
  documentTypeName: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your passport photos are ready — Express Passport Photo',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#1A3A5C;margin-bottom:8px">Your photos are ready!</h1>
        <p style="color:#374151;margin-bottom:24px">
          Your <strong>${documentTypeName}</strong> photos are ready to download.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td style="padding-right:12px">
              <a href="${pdfUrl}"
                 style="display:inline-block;background:#1A3A5C;color:#fff;padding:14px 24px;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                Download Print-Ready PDF
              </a>
            </td>
            <td>
              <a href="${jpegUrl}"
                 style="display:inline-block;background:#e5e7eb;color:#1A3A5C;padding:14px 24px;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                Download JPEG
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:14px">
          The PDF contains your photos tiled on a 4×6 layout — print it at any CVS,
          Walgreens, or photo lab as a standard 4×6 photo print.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Order ID: ${orderId}<br/>
          Express Passport Photo · expresspassportphoto.com<br/>
          Photos are deleted within 48 hours of your order.
        </p>
      </div>
    `,
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
