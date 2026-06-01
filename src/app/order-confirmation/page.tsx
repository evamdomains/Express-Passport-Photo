import type { Metadata } from 'next';
import OrderConfirmation from '@/components/OrderConfirmation';

export const metadata: Metadata = { title: 'Order Confirmed' };

export default function OrderConfirmationPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <OrderConfirmation />
    </div>
  );
}
