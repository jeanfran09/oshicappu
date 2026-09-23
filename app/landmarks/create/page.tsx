"use client";

import TagInput from "@/components/CreatePost/TagInput";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  ImagePlus,
  MapPin,
  MapPinned,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { findOrCreateFandom } from "@/utils/findOrCreateFandom";
import { getCurrentPosition } from "@/utils/geo";
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

type LandmarkType = "event" | "photo_spot" | "pilgrimage";

const TYPE_LABELS: Record<LandmarkType, string> = {
  event: "Event",
  photo_spot: "Photo Spot",
  pilgrimage: "Pilgrimage",
};

export default function CreateLandmarkPage() {
  const router = useRouter();

  const {
    user,
    isLoggedIn,
    isLoading: authLoading,
  } = useSupabaseAuth();

  const [type, setType] =
    useState<LandmarkType>("event");

  // Shared fields
  const [title, setTitle] = useState("");
  const [fandom, setFandom] = useState("");
  const [fandomOptions, setFandomOptions] =
    useState<string[]>([]);
  const [description, setDescription] =
    useState("");

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);
  const [imageFile, setImageFile] =
    useState<File | null>(null);

  // Event fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState<
    string[]
  >([]);

  // Map
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [mapCenter, setMapCenter] =
    useState<[number, number]>(
      DEFAULT_MAP_CENTER
    );

  const [locatingPin, setLocatingPin] =
    useState(false);

  const [pinError, setPinError] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [
    authLoading,
    isLoggedIn,
    router,
  ]);

  useEffect(() => {
    async function loadFandoms() {
      const { data } = await supabase
        .from("fandoms")
        .select("name")
        .order("name", {
          ascending: true,
        });

      setFandomOptions(
        (data ?? []).map((f) => f.name)
      );
    }

    loadFandoms();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [description]);

  useEffect(() => {
    if (type === "event") return;

    getCurrentPosition()
      .then((pos) => {
        setMapCenter([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      })
      .catch(() => {
        // Keep default map center.
      });
  }, [type]);

  function handleTypeChange(
    newType: LandmarkType
  ) {
    setType(newType);
    setError("");
    setPinError("");

    if (newType === "event") {
      setCoords(null);
    } else {
      setDate("");
      setTime("");
      setCapacity("");
      setLocation("");
      setHashtags([]);
    }
  }

  async function handlePinLocation() {
    setLocatingPin(true);
    setPinError("");

    try {
      const pos = await getCurrentPosition();

      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      setMapCenter([
        pos.coords.latitude,
        pos.coords.longitude,
      ]);
    } catch (err) {
      console.error(
        "Error getting location:",
        err
      );

      setPinError(
        err instanceof Error
          ? err.message
          : "Couldn't get your location. Check permissions."
      );
    } finally {
      setLocatingPin(false);
    }
  }

  async function uploadImage(
    userId: string,
    bucket:
      | "events"
      | "fandom-locations",
    prefix?: string
  ): Promise<string | null> {
    if (!imageFile) return null;

    const ext =
      imageFile.name.split(".").pop() ||
      "jpg";

    const filePrefix =
      prefix ?? Date.now().toString();

    const path = `${userId}/${filePrefix}.${ext}`;

    const { error: uploadError } =
      await supabase.storage
        .from(bucket)
        .upload(path, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            imageFile.type ||
            `image/${ext}`,
        });

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  async function linkHashtags(
    eventId: string
  ) {
    for (const rawTag of hashtags) {
      const tag = rawTag
        .trim()
        .toLowerCase();

      if (!tag) continue;

      let hashtagId: string;

      const {
        data: existing,
        error: lookupError,
      } = await supabase
        .from("hashtags")
        .select("id")
        .eq("tag", tag)
        .maybeSingle();

      if (lookupError) {
        console.error(
          "Error looking up hashtag:",
          lookupError
        );
        continue;
      }

      if (existing) {
        hashtagId = existing.id;
      } else {
        const {
          data: created,
          error: createError,
        } = await supabase
          .from("hashtags")
          .insert({ tag })
          .select("id")
          .single();

        if (
          createError ||
          !created
        ) {
          console.error(
            "Error creating hashtag:",
            createError
          );
          continue;
        }

        hashtagId = created.id;
      }

      const { error: linkError } =
        await supabase
          .from("event_hashtags")
          .insert({
            event_id: eventId,
            hashtag_id: hashtagId,
          });

      if (linkError) {
        console.error(
          "Error linking hashtag to event:",
          linkError
        );
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
      setError(
        type === "event"
          ? "Please add an event name."
          : `Please add a ${type === "photo_spot" ? "photo spot" : "pilgrimage location"} name.`
      );
      return;
    }

    if (!fandom.trim()) {
      setError(
        "Please add a fandom."
      );
      return;
    }

    if (type === "event" && !date) {
      setError(
        "Please add at least an event name and date."
      );
      return;
    }

    if (
      type !== "event" &&
      !coords
    ) {
      setError(
        "Tap on the map to place this spot first."
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (type === "event") {
        const imageUrl =
          await uploadImage(
            user.id,
            "events"
          );

        const fandomId =
          await findOrCreateFandom(
            fandom
          );

        const {
          data: created,
          error: insertError,
        } = await supabase
          .from("events")
          .insert({
            organizer_id: user.id,
            title: title.trim(),
            description:
              description.trim() ||
              null,
            event_date: date,
            event_time:
              time || null,
            location:
              location.trim() ||
              null,
            fandom_id: fandomId,
            latitude:
              coords?.lat ?? null,
            longitude:
              coords?.lng ?? null,
            capacity: capacity
              ? parseInt(
                  capacity,
                  10
                )
              : null,
            image_url: imageUrl,
          })
          .select("id")
          .single();

        if (
          insertError ||
          !created
        ) {
          throw new Error(
            insertError?.message ||
              "Failed to create event."
          );
        }

        await linkHashtags(
          created.id
        );

        router.push(
          `/event/${created.id}`
        );

        return;
      }

      const imageUrl =
        await uploadImage(
          user.id,
          "fandom-locations",
          `${type}-${Date.now()}`
        );

      const fandomId =
        await findOrCreateFandom(
          fandom
        );

      const table =
        type === "photo_spot"
          ? "photo_spots"
          : "pilgrimage_locations";

      const {
        error: insertError,
      } = await supabase
        .from(table)
        .insert({
          created_by: user.id,
          title: title.trim(),
          fandom_id: fandomId,
          description:
            description.trim() ||
            null,
          latitude: coords!.lat,
          longitude: coords!.lng,
          image_url: imageUrl,
        });

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      router.push("/landmarks");
    } catch (err) {
      console.error(
        "Error creating landmark:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again."
      );

      setSubmitting(false);
    }
  }

  const isEvent =
    type === "event";

  const isPhotoSpot =
    type === "photo_spot";

  return (
    <main className="min-h-screen bg-background pb-22 md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/30 bg-background px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold">
          Create Landmark
        </h1>

        <button
          type="button"
          onClick={() =>
            router.push("/landmarks")
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      {/* Form */}
      <form
        id="create-landmark-form"
        onSubmit={handleSubmit}
        className="mt-1 space-y-4 px-4 "
      >
        {/* Type */}
        <div className="space-y-2">
          <label
            htmlFor="landmark-type"
            className="text-sm font-semibold"
          >
            Type
          </label>

          <div className="relative">
            <select
              id="landmark-type"
              value={type}
              onChange={(e) =>
                handleTypeChange(
                  e.target
                    .value as LandmarkType
                )
              }
              className="w-full appearance-none rounded-xl border border-foreground/25 bg-transparent px-4 py-3 pr-11 text-base outline-none focus:border-accent"
            >
              <option value="event">
                Event
              </option>
              <option value="photo_spot">
                Photo Spot
              </option>
              <option value="pilgrimage">
                Pilgrimage
              </option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50"
            />
          </div>
        </div>

        {/* Image */}
        <div className="space-y-2">
          <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-foreground/25 bg-accent/20">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={`${TYPE_LABELS[type]} preview`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-foreground/50">
                {isEvent ? (
                  <ImagePlus
                    size={32}
                    className="text-[#7f8480]"
                  />
                ) : (
                  <Camera size={28} />
                )}

                <span className="text-sm">
                  {isEvent
                    ? "Add event photo"
                    : "Add a photo"}
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  setImageFile(file);
                  setImagePreview(
                    URL.createObjectURL(
                      file
                    )
                  );
                }

                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-sm font-semibold"
          >
            {isEvent
              ? "Event Name"
              : "Name"}
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder={
              isEvent
                ? "Enter event name"
                : isPhotoSpot
                  ? "e.g. Mural wall by the station"
                  : "e.g. Cafe from the drama filming site"
            }
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        {/* Description / Notes */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-semibold"
          >
            {isEvent
              ? "Description"
              : "Notes"}
          </label>

          {isEvent ? (
            <div className="relative">
              <textarea
                id="description"
                ref={textareaRef}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                maxLength={500}
                placeholder="Describe your event..."
                rows={1}
                className="w-full resize-none overflow-hidden rounded-xl border border-foreground/25 bg-background p-4 pb-8 text-base outline-none transition focus:border-accent"
              />

              <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-foreground/50">
                {description.length}/500
              </span>
            </div>
          ) : (
            <textarea
              id="description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={3}
              placeholder={
                isPhotoSpot
                  ? "Best angle, lighting tips, what to bring..."
                  : "Why this place matters, what to look for..."
              }
              className="w-full resize-none rounded-xl border border-foreground/25 bg-transparent p-4 text-base outline-none focus:border-accent"
            />
          )}
        </div>

        {/* Event Fields */}
        {isEvent && (
          <>
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
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
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
                onChange={(e) =>
                  setTime(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
              />
            </div>

            {/* Maximum Attendees */}
            <div className="space-y-2">
              <label
                htmlFor="capacity"
                className="text-sm font-semibold"
              >
                Maximum Attendees
              </label>

              <input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) =>
                  setCapacity(
                    e.target.value
                  )
                }
                placeholder="Add capacity"
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

              <div className="relative">
                <MapPin
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50"
                />

                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) =>
                    setLocation(
                      e.target.value
                    )
                  }
                  placeholder="Add event location"
                  className="w-full rounded-xl border border-foreground/25 bg-transparent py-3 pl-11 pr-4 text-base outline-none focus:border-accent"
                />
              </div>
            </div>
          </>
        )}

        {/* Map */}
        <div className="relative z-0 space-y-2 rounded-xl bg-foreground/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isEvent
                  ? coords
                    ? "Pinned for the map"
                    : "Add to Fandom Map"
                  : coords
                    ? "Spot location"
                    : `Add ${isPhotoSpot ? "photo spot" : "pilgrimage"} location`}
              </p>

              <p className="text-xs text-foreground/50">
                {coords
                  ? "This location will show up on the Fandom Map."
                  : "Tap the map to place a pin, or use your current location."}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handlePinLocation
              }
              disabled={
                locatingPin
              }
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <MapPinned size={14} />

              {locatingPin
                ? "Locating..."
                : "My location"}
            </button>
          </div>

          {/* Map */}
          <div className="relative z-0 w-full overflow-hidden rounded-lg">
            <div
              className="h-[220px] w-full"
            >
              <MapErrorBoundary>
                <MapView
                  center={mapCenter}
                  markers={[]}
                  pickedLocation={
                    coords
                      ? [
                          coords.lat,
                          coords.lng,
                        ]
                      : null
                  }
                  onMapClick={(
                    lat,
                    lng
                  ) =>
                    setCoords({
                      lat,
                      lng,
                    })
                  }
                  zoom={13}
                />
              </MapErrorBoundary>
            </div>
          </div>

          {coords && (
            <button
              type="button"
              onClick={() =>
                setCoords(null)
              }
              className="text-xs font-medium text-foreground/50 underline"
            >
              Remove pin
            </button>
          )}
        </div>

        {pinError && (
          <p className="text-xs text-red-500">
            {pinError}
          </p>
        )}

        {/* Fandom */}
        <div className="space-y-2">
          <label
            htmlFor="fandom"
            className="text-sm font-semibold"
          >
            Fandom
          </label>

          <input
            id="fandom"
            type="text"
            list="fandom-options"
            value={fandom}
            onChange={(e) =>
              setFandom(
                e.target.value
              )
            }
            placeholder="Add Fandom"
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />

          <datalist id="fandom-options">
            {fandomOptions.map(
              (name) => (
                <option
                  key={name}
                  value={name}
                />
              )
            )}
          </datalist>
        </div>

        {/* Hashtags */}
        {isEvent && (
          <TagInput
            label="Hashtags"
            placeholder="Add a hashtag"
            items={hashtags}
            setItems={setHashtags}
            maxItems={10}
            prefix="#"
          />
        )}

        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </form>

      {/* Fixed Create Button */}
      <div className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-foreground/30 bg-background p-4">
        <button
          type="submit"
          form="create-landmark-form"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent-secondary font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting
            ? "Creating..."
            : "Create"}
        </button>
      </div>
    </main>
  );
}