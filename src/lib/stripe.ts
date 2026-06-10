import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export async function createCheckoutSession({
  productName,
  unitAmount,
  orderId,
  email,
  successUrl,
  cancelUrl,
}: {
  productName: string;
  /** Amount to charge, in cents (e.g. $0.99 → 99). */
  unitAmount: number;
  orderId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    // Price is defined inline from our own product config (no pre-created
    // Stripe Price ID needed), so the amount always matches products.ts.
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    metadata: { orderId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}
