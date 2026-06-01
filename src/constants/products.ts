import type { ProductOption } from '@/types/order';

export const PRODUCTS: ProductOption[] = [
  {
    sku: 'digital_download',
    name: 'Digital Download',
    price: 6.99,
    priceId: process.env.STRIPE_PRICE_DIGITAL ?? '',
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
    price: 12.99,
    priceId: process.env.STRIPE_PRICE_PRINTED ?? '',
    description: 'Pick up 2 prints at CVS or Walgreens',
    features: [
      '2 prints on professional photo paper',
      'Meets all official size requirements',
      'Ready for pickup at your nearest store',
      'Digital copy included',
    ],
    turnaround: '~1 hour',
  },
];
