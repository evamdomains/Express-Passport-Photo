import type { ProductOption } from '@/types/order';

export const PRODUCTS: ProductOption[] = [
  {
    sku: 'digital_download',
    name: 'Digital Download',
    price: 4.99,
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
    price: 8.99,
    priceId: process.env.STRIPE_PRICE_PRINTED ?? '',
    description: 'Pick up 6 prints at CVS or Walgreens',
    features: [
      '6 prints on professional photo paper',
      'Meets all official size requirements',
      'Ready for pickup at your nearest store',
      'Digital copy included',
    ],
    turnaround: '~3 hours',
  },
];
