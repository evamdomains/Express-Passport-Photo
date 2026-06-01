import { NextRequest, NextResponse } from 'next/server';
import { findNearbyPharmacies, findPhotoPickupStores } from '@/lib/google-places';

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip');
  const photoOnly = req.nextUrl.searchParams.get('photo') === 'true';

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'Valid 5-digit US zip code required' }, { status: 400 });
  }

  try {
    const stores = photoOnly
      ? await findPhotoPickupStores(zip)
      : await findNearbyPharmacies(zip);
    return NextResponse.json(stores);
  } catch (err) {
    console.error('[stores]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Store lookup failed' },
      { status: 500 }
    );
  }
}
