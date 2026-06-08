import type { Metadata } from 'next';
import StoreLocator from '@/components/StoreLocator';

export const metadata: Metadata = {
  title: 'Find a Store',
  description: 'Find a nearby CVS or Walgreens to print your passport photo.',
};

export default function StoreLocatorPage() {
  // StoreLocator renders its own full-bleed hero (headline, search, animated
  // map) and the results list below it.
  return <StoreLocator />;
}
