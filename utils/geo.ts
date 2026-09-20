export type LatLng = { lat: number; lng: number };

/** Distance between two coordinates, in kilometers. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      sinLng *
      sinLng;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/**
 * Rounds a coordinate to roughly a 1km grid before it's ever sent to
 * the server, so a person's approximate area is shared, never their
 * exact position.
 */
export function toApproxCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getCurrentPosition(
  options?: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation isn't available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => reject(new Error(describeGeolocationError(err))),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        ...options,
      }
    );
  });
}

/**
 * GeolocationPositionError doesn't stringify usefully on its own
 * (console.error shows "[object GeolocationPositionError]"), so
 * translate its `code` into a readable message instead.
 */
function describeGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location access was denied. Allow location access for this site in your browser settings and try again.";
    case err.POSITION_UNAVAILABLE:
      return "Your device couldn't determine your location right now.";
    case err.TIMEOUT:
      return "Getting your location timed out. Try again.";
    default:
      return "Couldn't get your location.";
  }
}
