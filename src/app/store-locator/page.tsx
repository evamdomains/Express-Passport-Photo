import type { Metadata } from 'next';
import StoreLocator from '@/components/StoreLocator';

export const metadata: Metadata = {
  title: 'Find a Store',
  description: 'Find a nearby CVS or Walgreens to print your passport photo.',
};

export default function StoreLocatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Find a nearby store</h1>
        <p className="text-gray-500">
          Print your photo at a CVS or Walgreens near you. Enter your zip code to find locations.
        </p>
      </div>
      <StoreLocator />
    </div>
  );
}
