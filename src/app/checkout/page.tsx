import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your passport photo order — instant AI delivery or expert human review.',
};

export default function CheckoutPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
      <CheckoutForm />
    </div>
  );
}
