import type { StoreResult } from '@/types/photo';
import { sendErrorAlert } from './alert';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

interface GeocodeResult {
  lat: number;
  lng: number;
}

async function geocodeZip(zip: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&key=${API_KEY}`;

  let data: { status: string; results?: { geometry: { location: GeocodeResult } }[] };
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    await sendErrorAlert({ api: 'Google Places', error: err, context: { operation: 'geocodeZip', zip } });
    throw err;
  }

  if (data.status !== 'OK' || !data.results?.[0]) {
    // Status errors like ZERO_RESULTS or REQUEST_DENIED are infrastructure/config issues
    if (data.status !== 'ZERO_RESULTS') {
      await sendErrorAlert({
        api: 'Google Places',
        error: new Error(`Geocode failed: ${data.status}`),
        context: { operation: 'geocodeZip', zip, status: data.status },
      });
    }
    throw new Error(`Could not geocode zip code ${zip} (status: ${data.status})`);
  }

  return data.results[0].geometry.location;
}

async function nearbySearch(
  lat: number,
  lng: number,
  keyword: string,
  radiusMeters = 16093
): Promise<StoreResult[]> {
  const url =
    `${PLACES_BASE}/nearbysearch/json` +
    `?location=${lat},${lng}` +
    `&radius=${radiusMeters}` +
    `&keyword=${encodeURIComponent(keyword)}` +
    `&type=pharmacy` +
    `&key=${API_KEY}`;

  let data: { status: string; results?: Record<string, unknown>[] };
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    await sendErrorAlert({ api: 'Google Places', error: err, context: { operation: 'nearbySearch', keyword } });
    throw err;
  }

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    await sendErrorAlert({
      api: 'Google Places',
      error: new Error(`Nearby search failed: ${data.status}`),
      context: { operation: 'nearbySearch', keyword, status: data.status },
    });
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results ?? []).slice(0, 5).map((place) => {
    const geometry = place.geometry as { location: { lat: number; lng: number } };
    const loc = geometry?.location ?? { lat: 0, lng: 0 };
    const distKm = haversineKm(lat, lng, loc.lat, loc.lng);
    const distMiles = (distKm * 0.621371).toFixed(1);

    return {
      placeId: place.place_id as string,
      name: place.name as string,
      address: (place.vicinity as string) ?? '',
      distance: `${distMiles} mi`,
      phone: null,
      openNow: (place.opening_hours as { open_now?: boolean } | undefined)?.open_now ?? null,
      lat: loc.lat,
      lng: loc.lng,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id as string}`,
    } satisfies StoreResult;
  });
}

export async function findNearbyPharmacies(
  zip: string
): Promise<{ cvs: StoreResult[]; walgreens: StoreResult[] }> {
  const { lat, lng } = await geocodeZip(zip);
  const [cvs, walgreens] = await Promise.all([
    nearbySearch(lat, lng, 'CVS pharmacy'),
    nearbySearch(lat, lng, 'Walgreens pharmacy'),
  ]);
  return { cvs, walgreens };
}

export async function findPhotoPickupStores(
  zip: string
): Promise<{ cvs: StoreResult[]; walgreens: StoreResult[] }> {
  const { lat, lng } = await geocodeZip(zip);
  const [cvs, walgreens] = await Promise.all([
    nearbySearch(lat, lng, 'CVS photo printing'),
    nearbySearch(lat, lng, 'Walgreens photo printing'),
  ]);
  return { cvs, walgreens };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
