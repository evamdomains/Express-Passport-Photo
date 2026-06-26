import type { Metadata } from 'next';
import CustomerReviews from '@/components/CustomerReviews';
import ReviewForm from '@/components/ReviewForm';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description:
    'Read real customer reviews of Express Passport Photo and leave your own rating — see why thousands trust us for compliant passport & ID photos.',
};

export default function ReviewsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="px-4 pt-14 sm:pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            ★ Customer Reviews
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            What our customers <span className="text-brand-600">say</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Real ratings and reviews from people who got compliant passport &amp; ID photos with us.
          </p>
        </div>
      </section>

      {/* Animated testimonials */}
      <CustomerReviews />

      {/* Leave a review */}
      <section className="px-4 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Your turn</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">Leave a review</h2>
            <p className="mt-3 text-gray-600">
              Used Express Passport Photo? Share your experience and rating to help others.
            </p>
          </div>
          <ReviewForm />
        </div>
      </section>
    </div>
  );
}
