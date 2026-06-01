import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Express Passport Photo.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What we collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Email address</strong> — to deliver your order and send transactional emails.</li>
            <li><strong>Uploaded photos</strong> — to process and generate your passport photo.</li>
            <li><strong>Delivery address</strong> (Printed & Ready orders) — store selection only; we do not store home addresses.</li>
            <li><strong>Payment information</strong> — handled entirely by Stripe. We never see or store card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Photo retention</h2>
          <p className="text-sm">
            All uploaded and processed photos are <strong>deleted within 48 hours</strong> of
            your order being fulfilled. We do not retain photos for longer than necessary to
            complete your order.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">How we use your data</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Processing your passport photo and checking compliance.</li>
            <li>Delivering your digital download or coordinating store pickup.</li>
            <li>Sending transactional emails related to your order.</li>
          </ul>
          <p className="mt-3 text-sm">
            We do <strong>not</strong> sell your personal data to third parties.
            We do not send marketing emails without your consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-party services</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Stripe</strong> — payment processing. No card data touches our servers.</li>
            <li><strong>Supabase</strong> — database and file storage (US-based).</li>
            <li><strong>AWS Rekognition</strong> — face detection for compliance checking. Images are not retained by AWS after processing.</li>
            <li><strong>PhotoRoom</strong> — background removal. Images are processed and not retained.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Your rights (GDPR & CCPA)</h2>
          <p className="text-sm">
            You have the right to request access to, correction of, or deletion of your
            personal data at any time. To exercise these rights, email us at{' '}
            <a href="mailto:privacy@expresspassportphoto.com" className="text-brand-600 hover:underline">
              privacy@expresspassportphoto.com
            </a>
            . We will respond within 30 days.
          </p>
          <p className="mt-3 text-sm">
            California residents: we do not sell personal information as defined under the CCPA.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
          <p className="text-sm">
            Privacy questions:{' '}
            <a href="mailto:privacy@expresspassportphoto.com" className="text-brand-600 hover:underline">
              privacy@expresspassportphoto.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
