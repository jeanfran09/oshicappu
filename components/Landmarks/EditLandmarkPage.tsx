"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, MapPinned, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { getCurrentPosition } from "@/utils/geo";
import MapErrorBoundary from "@/components/FandomMap/MapErrorBoundary";
import EditLandmarkSkeleton from "../Skeleton/EditLandmarkSkeleton";

const MapView = dynamic(
  () => import("@/components/FandomMap/MapView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        Loading map...
      </div>
    ),
  }
);

type LandmarkType = "photo_spot" | "pilgrimage";

type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type Landmark = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location: string | null;
  image_url: string | null;
  fandom_id: string | null;
};

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

export default function EditLandmarkPage({
  id,
  type,
}: {
  id: string;
  type: LandmarkType;
}) {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } =
    useSupabaseAuth();

  const table =
    type === "photo_spot" ? "photo_spots" : "pilgrimage_locations";

  const pageTitle =
    type === "photo_spot" ? "Edit Photo Spot" : "Edit Pilgrimage";

  const [landmark, setLandmark] = useState<Landmark | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] =
    useState<[number, number]>(DEFAULT_CENTER);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn || !user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadLandmark() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from(table)
        .select(
          "id, created_by, title, description, latitude, longitude, location, image_url, fandom_id"
        )
        .eq("id", id)
        .eq("created_by", user!.id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError || !data) {
        setError(
          fetchError?.message ||
            "Landmark not found, or you don't have permission to edit it."
        );
        setLoading(false);
        return;
      }

      const item = data as Landmark;

      setLandmark(item);
      setTitle(item.title ?? "");
      setDescription(item.description ?? "");
      setLocation(item.location ?? "");
      setImageUrl(item.image_url ?? null);

      if (
        Number.isFinite(Number(item.latitude)) &&
        Number.isFinite(Number(item.longitude))
      ) {
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);

        setCoords({ lat, lng });
        setMapCenter([lat, lng]);
      }

      setLoading(false);
    }

    void loadLandmark();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, user, id, table, router]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function searchLocation() {
    const query = location.trim();

    if (!query) {
      setLocationError("Enter a place to search.");
      return;
    }

    setSearching(true);
    setLocationError("");
    setPlaceResults([]);

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
      );

      if (!response.ok) {
        throw new Error("Location search failed. Try again.");
      }

      const results: PlaceResult[] = await response.json();

      setPlaceResults(results);

      if (results.length === 0) {
        setLocationError("No matching places found.");
      }
    } catch (err) {
      setLocationError(
        err instanceof Error
          ? err.message
          : "Unable to search for this location."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(place: PlaceResult) {
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLocationError("This result has invalid coordinates.");
      return;
    }

    setLocation(place.display_name);
    setCoords({ lat, lng });
    setMapCenter([lat, lng]);
    setPlaceResults([]);
    setLocationError("");
  }

  async function handleMapClick(lat: number, lng: number) {
    setCoords({ lat, lng });
    setMapCenter([lat, lng]);
    setPlaceResults([]);
    setLocationError("");
    setLocation("Finding address...");

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to find address.");
      }

      const data: { display_name?: string } = await response.json();

      setLocation(
        data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      );
    } catch {
      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    setError("");

    try {
      const pos = await getCurrentPosition();

      await handleMapClick(
        pos.coords.latitude,
        pos.coords.longitude
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't get your current location."
      );
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user || !landmark) return;

    if (!title.trim()) {
      setError("Please enter a name.");
      return;
    }

    if (!coords) {
      setError("Please select a location on the map.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let nextImageUrl = imageUrl;

      // Upload only when a replacement image is selected.
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path =
          `${user.id}/${type}-${landmark.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("fandom-locations")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || `image/${ext}`,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = supabase.storage
          .from("fandom-locations")
          .getPublicUrl(path);

        nextImageUrl = data.publicUrl;
      }

      const { data: updated, error: updateError } = await supabase
        .from(table)
        .update({
          title: title.trim(),
          description: description.trim() || null,
          latitude: coords.lat,
          longitude: coords.lng,
          location: location.trim() || null,
          image_url: nextImageUrl,
        })
        .eq("id", landmark.id)
        .eq("created_by", user.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updated) {
        throw new Error(
          "The landmark wasn't updated. Check your permissions and try again."
        );
      }

      if (type === "photo_spot") {
        router.push(`/photo-spot/${landmark.id}`);
      } else {
        router.push(`/pilgrimage/${landmark.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again."
      );
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return  <EditLandmarkSkeleton type={type} />;
  }

  if (!landmark) {
    return (
      <main className="min-h-screen bg-background p-6 md:hidden">
        <button
          type="button"
          onClick={() => router.push("/landmarks")}
          className="mb-4 text-sm underline"
        >
          Back to landmarks
        </button>
        <p className="text-sm text-red-500">
          {error || "Landmark not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-4">
        <h1 className="text-xl font-bold">{pageTitle}</h1>
        <button
          type="button"
          onClick={() => router.push(
            type === "photo_spot"
              ? `/photo-spot/${id}`
              : `/pilgrimage/${id}`
          )}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      <form
        id="edit-landmark-form"
        onSubmit={handleSubmit}
        className="mt-1 space-y-4 px-4 py-3"
      >
        {/* Image */}
        <div className="space-y-2">
          <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-foreground/25 bg-accent/20">
            {imagePreview || imageUrl ? (
              <img
                src={imagePreview || imageUrl || ""}
                alt="Landmark preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-foreground/50">
                <Camera size={28} />
                <span className="text-sm">Add a photo</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>

          {imageFile && (
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="text-xs underline"
            >
              Discard replacement image
            </button>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold">
            Name
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-semibold">
            Notes
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={
              type === "photo_spot"
                ? "Best angle, lighting tips, what to bring..."
                : "Why this place matters, what to look for..."
            }
            className="w-full resize-none rounded-xl border border-foreground/25 bg-transparent p-4 outline-none focus:border-accent"
          />
        </div>

        {/* Location search */}
        <div className="space-y-2">
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
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPlaceResults([]);
                  setLocationError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchLocation();
                  }
                }}
                autoComplete="off"
                placeholder="Search for a place"
                className="w-full rounded-xl border border-foreground/25 bg-transparent py-3 pl-11 pr-3 outline-none focus:border-accent"
              />
            </div>

            <button
              type="button"
              onClick={() => void searchLocation()}
              disabled={searching}
              className="shrink-0 rounded-xl bg-accent px-4 py-3 disabled:opacity-60"
              aria-label="Search location"
            >
              {searching ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>

          {locationError && (
            <p className="text-xs text-foreground/60">{locationError}</p>
          )}

          {placeResults.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-foreground/20">
              {placeResults.map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="flex w-full items-start gap-3 border-b border-foreground/10 p-3 text-left last:border-0 hover:bg-foreground/5"
                >
                  <MapPin size={18} className="mt-0.5 shrink-0" />
                  <span className="text-sm">{place.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="space-y-2 rounded-xl bg-foreground/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Pin location</p>
              <p className="text-xs text-foreground/50">
                Tap the map to move the pin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void useMyLocation()}
              disabled={locating}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <MapPinned size={14} />
              {locating ? "Locating..." : "My location"}
            </button>
          </div>

          <div className="h-[220px] w-full overflow-hidden rounded-lg">
            <MapErrorBoundary>
              <MapView
                center={mapCenter}
                markers={[]}
                pickedLocation={
                  coords ? [coords.lat, coords.lng] : null
                }
                onMapClick={(lat, lng) => void handleMapClick(lat, lng)}
                zoom={13}
              />
            </MapErrorBoundary>
          </div>

          {coords && (
            <button
              type="button"
              onClick={() => setCoords(null)}
              className="text-xs font-medium text-foreground/50 underline"
            >
              Remove pin
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-foreground/30 bg-background p-4">
        <button
          type="submit"
          form="edit-landmark-form"
          disabled={saving}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent-secondary font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
