"use client";

import TagInput from "@/components/CreatePost/TagInput";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronLeft,
  ImagePlus,
  MapPin,
  MapPinned,
  Search,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import MapErrorBoundary from "@/components/FandomMap/MapErrorBoundary";

const MapView = dynamic(
  () => import("@/components/FandomMap/MapView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-foreground/5">
        <p className="text-sm text-foreground/40">Loading map...</p>
      </div>
    ),
  }
);

const DEFAULT_MAP_CENTER: [number, number] = [14.5995, 120.9842];

type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const { user, isLoggedIn, isLoading: authLoading } =
    useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Event fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Map
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [mapCenter, setMapCenter] =
    useState<[number, number]>(DEFAULT_MAP_CENTER);

  const [locatingPin, setLocatingPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect unauthenticated users.
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  // Load the event and verify ownership.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEvent() {
        setLoading(true);
        setError("");

        try {
            // Verify that the user is logged in.
            if (!user) {
            router.replace("/login");
            return;
            }

            // Load the event.
            const { data: event, error: eventError } = await supabase
            .from("events")
            .select(
                "id, organizer_id, title, description, event_date, event_time, location, latitude, longitude, image_url"
            )
            .eq("id", eventId)
            .single();

            if (eventError || !event) {
            throw new Error("Unable to load this event.");
            }

            // Only the event organizer can edit the event.
            if (event.organizer_id !== user.id) {
            router.replace(`/event/${eventId}`);
            return;
            }

            if (cancelled) return;

            // Populate the event fields.
            setTitle(event.title ?? "");
            setDescription(event.description ?? "");
            setDate(event.event_date ?? "");
            setTime(event.event_time?.slice(0, 5) ?? "");
            setLocation(event.location ?? "");
            setImageUrl(event.image_url ?? null);
            setImagePreview(event.image_url ?? null);

            // Restore the saved map coordinates.
            if (
            event.latitude != null &&
            event.longitude != null
            ) {
            const initialCoords = {
                lat: Number(event.latitude),
                lng: Number(event.longitude),
            };

            setCoords(initialCoords);
            setMapCenter([
                initialCoords.lat,
                initialCoords.lng,
            ]);
            }

            // Load hashtags associated with this event.
            const {
            data: hashtagLinks,
            error: hashtagError,
            } = await supabase
            .from("event_hashtags")
            .select("hashtags(tag)")
            .eq("event_id", eventId);

            if (hashtagError) {
            throw new Error("Unable to load event hashtags.");
            }

            if (cancelled) return;

            // Extract hashtag names while handling relationship types.
            const tags = (hashtagLinks ?? []).flatMap((link) => {
            const relation = link.hashtags as
                | { tag: string | null }[]
                | { tag: string | null }
                | null;

            if (Array.isArray(relation)) {
                return relation
                .map((item) => item.tag)
                .filter(
                    (tag): tag is string =>
                    typeof tag === "string"
                );
            }

            return typeof relation?.tag === "string"
                ? [relation.tag]
                : [];
            });

            setHashtags(tags);
        } catch (err) {
            if (!cancelled) {
            setError(
                err instanceof Error
                ? err.message
                : "Unable to load this event."
            );
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, eventId, router]);

  // Automatically resize the description textarea.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [description]);

  function handleImageChange(file?: File) {
    if (!file) return;

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeNewImage() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(imageUrl);
  }

  async function handleSearchLocation() {
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
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLocationSearchError(
        "This result has invalid coordinates."
      );
      return;
    }

    setLocation(place.display_name);
    setCoords({ lat, lng });
    setMapCenter([lat, lng]);
    setPlaceResults([]);
    setLocationSearchError("");
    setPinError("");
  }

  async function handleMapClick(lat: number, lng: number) {
    setCoords({ lat, lng });
    setMapCenter([lat, lng]);
    setLocationSearchError("");
    setPlaceResults([]);
    setLocation("Finding address...");

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to find address.");
      }

      const data: { display_name?: string } =
        await response.json();

      setLocation(
        data.display_name ||
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      );
    } catch (err) {
      console.error("Reverse geocoding failed:", err);

      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }

  async function handlePinLocation() {
    setLocatingPin(true);
    setPinError("");

    try {
      if (!navigator.geolocation) {
        throw new Error(
          "Geolocation is not supported by this browser."
        );
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
            }
          );
        }
      );

      await handleMapClick(
        position.coords.latitude,
        position.coords.longitude
      );
    } catch (err) {
      setPinError(
        err instanceof Error
          ? err.message
          : "Couldn't get your location. Check permissions."
      );
    } finally {
      setLocatingPin(false);
    }
  }

  async function uploadNewImage(): Promise<string | null> {
    if (!imageFile || !user) return imageUrl;

    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/event-${eventId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("events")
      .upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type || `image/${ext}`,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("events").getPublicUrl(path);

    return publicUrl;
  }

  async function updateHashtags() {
    // Remove the event's previous hashtag associations.
    const { error: deleteError } = await supabase
      .from("event_hashtags")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const uniqueTags = [
      ...new Set(
        hashtags
          .map((tag) =>
            tag.trim().replace(/^#/, "").toLowerCase()
          )
          .filter(Boolean)
      ),
    ];

    for (const tag of uniqueTags) {
      const { data: existing, error: lookupError } =
        await supabase
          .from("hashtags")
          .select("id")
          .eq("tag", tag)
          .maybeSingle();

      if (lookupError) {
        throw new Error(lookupError.message);
      }

      let hashtagId = existing?.id;

      if (!hashtagId) {
        const { data: created, error: createError } =
          await supabase
            .from("hashtags")
            .insert({ tag })
            .select("id")
            .single();

        if (createError || !created) {
          throw new Error(
            createError?.message || "Failed to create hashtag."
          );
        }

        hashtagId = created.id;
      }

      const { error: linkError } = await supabase
        .from("event_hashtags")
        .insert({
          event_id: eventId,
          hashtag_id: hashtagId,
        });

      if (linkError) {
        throw new Error(linkError.message);
      }
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      setError("Please add an event name.");
      return;
    }

    if (!date) {
      setError("Please add an event date.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Verify ownership again before updating.
      const { data: existingEvent, error: ownerError } =
        await supabase
          .from("events")
          .select("organizer_id")
          .eq("id", eventId)
          .single();

      if (
        ownerError ||
        !existingEvent ||
        existingEvent.organizer_id !== user.id
      ) {
        throw new Error(
          "You don't have permission to edit this event."
        );
      }

      const updatedImageUrl = await uploadNewImage();

      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          event_date: date,
          event_time: time || null,
          location: location.trim() || null,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          image_url: updatedImageUrl,
        })
        .eq("id", eventId)
        .eq("organizer_id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await updateHashtags();

      router.push(`/event/${eventId}`);
      router.refresh();
    } catch (err) {
      console.error("Error updating event:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="md:hidden flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-transparent" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="md:hidden min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-foreground/30 bg-background px-4 pb-3 pt-4">
        <h1 className="flex-1 text-xl font-bold">
          Edit Event
        </h1>

        <button
          type="button"
          onClick={() => router.push(`/event/${eventId}`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent"
          aria-label="Cancel editing"
        >
          <X size={20} />
        </button>
      </header>

      {/* Form */}
      <form
        id="edit-event-form"
        onSubmit={handleSubmit}
        className="mt-1 space-y-4 px-4"
      >
        {/* Image */}
        <div className="space-y-2 pt-2">
          <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-foreground/25 bg-accent/20">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-foreground/50">
                <ImagePlus size={32} />
                <span className="text-sm">Add event photo</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleImageChange(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>

          {imageFile && (
            <button
              type="button"
              onClick={removeNewImage}
              className="text-xs font-medium text-foreground/60 underline"
            >
              Undo image change
            </button>
          )}
        </div>

        {/* Event Name */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-sm font-semibold"
          >
            Event Name
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event name"
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-semibold"
          >
            Description
          </label>

          <div className="relative">
            <textarea
              id="description"
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Describe your event..."
              rows={1}
              className="w-full resize-none overflow-hidden rounded-xl border border-foreground/25 bg-background px-4 pt-3 pb-8 text-base outline-none transition focus:border-accent"
            />

            <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-foreground/50">
              {description.length}/500
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label
            htmlFor="date"
            className="text-sm font-semibold"
          >
            Date
          </label>

          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50"
            />

            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-foreground/25 bg-transparent py-3 pl-11 pr-4 text-base outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label
            htmlFor="time"
            className="text-sm font-semibold"
          >
            Time
          </label>

          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label
            htmlFor="location"
            className="text-sm font-semibold"
          >
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
                  setPlaceResults([]);
                  setLocationSearchError("");
                  setCoords(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearchLocation();
                  }
                }}
                placeholder="Search for a place"
                autoComplete="off"
                className="w-full rounded-xl border border-foreground/25 bg-transparent py-3 pl-11 pr-10 text-base outline-none focus:border-accent"
              />

              {location && (
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    setPlaceResults([]);
                    setLocationSearchError("");
                    setCoords(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  aria-label="Clear location"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleSearchLocation()}
              disabled={searchingLocation}
              className="shrink-0 rounded-xl bg-accent px-4 py-3 text-sm font-semibold disabled:opacity-60"
              aria-label="Search location"
            >
              {searchingLocation ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>

          {locationSearchError && (
            <p className="text-xs text-foreground/60">
              {locationSearchError}
            </p>
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
                  <span className="text-sm">
                    {place.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-foreground/50">
            Search for a place and select a result, or tap the map
            to place a pin.
          </p>
        </div>

        {/* Map */}
        <div className="relative z-0 space-y-2 rounded-xl bg-foreground/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                {coords ? "Pinned for the map" : "Add to Fandom Map"}
              </p>

              <p className="text-xs text-foreground/50">
                {coords
                  ? "This location will show up on the Fandom Map."
                  : "Tap the map to place a pin, or use your current location."}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePinLocation}
              disabled={locatingPin}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <MapPinned size={14} />
              {locatingPin ? "Locating..." : "My location"}
            </button>
          </div>

          <div className="relative z-0 w-full overflow-hidden rounded-lg">
            <div className="h-[220px] w-full">
              <MapErrorBoundary>
                <MapView
                  center={mapCenter}
                  markers={[]}
                  pickedLocation={
                    coords ? [coords.lat, coords.lng] : null
                  }
                  onMapClick={(lat, lng) =>
                    void handleMapClick(lat, lng)
                  }
                  zoom={13}
                />
              </MapErrorBoundary>
            </div>
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

        {pinError && (
          <p className="text-xs text-red-500">{pinError}</p>
        )}

        {/* Hashtags */}
        <TagInput
          label="Hashtags"
          placeholder="Add a hashtag"
          items={hashtags}
          setItems={setHashtags}
          maxItems={10}
          prefix="#"
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </form>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-foreground/30 bg-background p-4">
        <button
          type="submit"
          form="edit-event-form"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent-secondary font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
