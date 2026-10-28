
"use client";

import { useState } from "react";
import { LoaderCircle, MapPin, Search, X } from "lucide-react";

type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  addresstype?: string;
  address?: {
    amenity?: string;
    building?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

type LocationInputProps = {
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  setLatitude: React.Dispatch<React.SetStateAction<number | null>>;
  setLongitude: React.Dispatch<React.SetStateAction<number | null>>;
};

function formatSelectedLocation(place: PlaceResult) {
  const address = place.address ?? {};
  const resultType = place.addresstype ?? place.type;

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality;

  const country = address.country;

  // City/town selections display as "City, Country".
  if (
    city &&
    country &&
    ["city", "town", "village", "municipality"].includes(resultType ?? "")
  ) {
    return `${city}, ${country}`;
  }

  // Specific places display using their most recognizable address component.
  const placeName =
    address.amenity ??
    address.shop ??
    address.tourism ??
    address.leisure ??
    address.building;

  if (placeName) return placeName;

  // Fall back to the first part of the full address.
  return place.display_name.split(",")[0].trim();
}

export default function LocationInput({
  location,
  setLocation,
  setLatitude,
  setLongitude,
}: LocationInputProps) {
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");

  async function handleSearch() {
    const query = location.trim();

    if (!query) {
      setLocationSearchError("Enter a place to search.");
      setPlaceResults([]);
      return;
    }

    setSearchingLocation(true);
    setLocationSearchError("");
    setPlaceResults([]);

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Location search failed. Please try again.");
      }

      const results: PlaceResult[] = await response.json();
      setPlaceResults(results);

      if (results.length === 0) {
        setLocationSearchError("No matching places found.");
      }
    } catch (err) {
      setLocationSearchError(
        err instanceof Error
          ? err.message
          : "Unable to search for this location."
      );
    } finally {
      setSearchingLocation(false);
    }
  }

  function handleSelectPlace(place: PlaceResult) {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setLocationSearchError("This result has invalid coordinates.");
      return;
    }

    setLocation(formatSelectedLocation(place));
    setLatitude(latitude);
    setLongitude(longitude);
    setPlaceResults([]);
    setLocationSearchError("");
  }

  function handleClear() {
    setLocation("");
    setLatitude(null);
    setLongitude(null);
    setPlaceResults([]);
    setLocationSearchError("");
  }

  return (
    <div className="space-y-2 pb-2">
      <label htmlFor="location" className="text-sm font-semibold">
        Location
      </label>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50"
          />

          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setLatitude(null);
              setLongitude(null);
              setPlaceResults([]);
              setLocationSearchError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search for a place"
            autoComplete="off"
            className="w-full rounded-xl border border-foreground/25 bg-transparent py-3 pl-11 pr-10 text-base outline-none focus:border-accent"
          />

          {location && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
              aria-label="Clear location"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searchingLocation}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold disabled:opacity-60"
          aria-label="Search location"
        >
          {searchingLocation ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      {locationSearchError && (
        <p className="text-xs text-foreground/60">{locationSearchError}</p>
      )}

      {placeResults.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-foreground/20">
          {placeResults.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="flex w-full items-start gap-3 border-b border-foreground/10 p-3 text-left last:border-b-0 hover:bg-foreground/5"
            >
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-foreground/60"
              />
              <span className="text-sm">{place.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}