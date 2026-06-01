import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export async function createCheckoutSession({
  priceId,
  orderId,
  email,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  orderId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { orderId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}
