import type { ProductOption } from '@/types/order';

/**
 * Human Expert Review fee, in dollars. Charged via Stripe BEFORE the order
 * enters the review queue (the webhook's human branch queues it on payment).
 * Set to 0 to make review free — Stripe can't charge $0, so the checkout route
 * then bypasses payment and queues the order directly.
 */
export const HUMAN_REVIEW_FEE: number = 0;

export const PRODUCTS: ProductOption[] = [
  {
    sku: 'digital_download',
    name: 'Digital Download',
    price: 0,
    description: 'Instant download, print anywhere',
    features: [
      'High-res JPEG + print-ready 4×6 PDF',
      'Instant email delivery',
      'Print at any pharmacy or photo lab',
      'Unlimited reprints',
    ],
    turnaround: 'Instant',
  },
  {
    sku: 'printed_ready',
    name: 'Printed & Ready',
    price: 0,
    description: 'Pick up 6 pics at CVS or Walgreens',
    features: [
      '6 pics on professional photo paper',
      'Meets all official size requirements',
      'Ready for pickup at your nearest store',
      'Digital copy included',
    ],
    turnaround: '~3 hours',
  },
];
