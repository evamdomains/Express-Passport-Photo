import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund policy for Express Passport Photo orders.',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Our liability</h2>
          <p>
            Express Passport Photo's liability is limited to the amount paid for your order.
            We are not responsible for any consequential damages, delays in travel plans,
            or government application fees resulting from a rejected photo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Digital Download ($6.99)</h2>
          <p>
            We issue a <strong>100% refund</strong> if your photo is rejected by a
            government agency for any compliance reason that our system was designed to check —
            including incorrect size, background color, head position, or eye/mouth state.
          </p>
          <p className="mt-3">
            Refunds are <em>not</em> issued for rejections due to factors outside our
            compliance checks, such as photo age (older than 6 months), damage to the
            printed photo, or changes in the applicant's appearance since the photo was taken.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Printed & Ready ($12.99)</h2>
          <p>
            Once we have uploaded your order to the print store, <strong>no refund</strong> is
            available for the printing service. If the prints have not yet been uploaded,
            a full refund may be requested by contacting us immediately.
          </p>
          <p className="mt-3">
            Compliance refunds (same terms as Digital Download) remain available if a
            government agency rejects the photo for a covered compliance reason.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">How to request a refund</h2>
          <p>
            Email{' '}
            <a
              href="mailto:support@expresspassportphoto.com"
              className="text-brand-600 hover:underline"
            >
              support@expresspassportphoto.com
            </a>{' '}
            with your order ID and a description of the rejection reason (a photo of the
            rejection notice is helpful but not required).
          </p>
          <p className="mt-3">
            Approved refunds are processed within <strong>5 business days</strong> back to
            your original payment method.
          </p>
        </section>
      </div>
    </div>
  );
}
