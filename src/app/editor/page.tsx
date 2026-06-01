import type { Metadata } from 'next';
import PhotoReview from '@/components/PhotoReview';

export const metadata: Metadata = { title: 'Review Your Photo' };

export default function EditorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Review your photo</h1>
        <p className="text-gray-500">
          Check the compliance results and proceed to checkout when ready.
        </p>
      </div>
      <PhotoReview />
    </div>
  );
}
