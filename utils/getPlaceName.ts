// Display a shortened location instead of the full address.
export function getPlaceName(location: string) {
  if (!location) return "";

  // Keep coordinate-only locations unchanged.
  if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(location)) {
    return location;
  }

  return location.split(",")[0].trim();
}