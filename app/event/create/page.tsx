"use client";

import TagInput from "@/components/CreatePost/TagInput";
import {
  CalendarDays,
  ImagePlus,
  MapPin,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } =
    useSupabaseAuth();

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);
  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [description]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  async function uploadEventImage(
    userId: string
  ): Promise<string | null> {
    if (!imageFile) return null;

    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

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

  async function linkHashtags(eventId: string) {
    for (const rawTag of hashtags) {
      const tag = rawTag.trim().toLowerCase();

      if (!tag) continue;

      let hashtagId: string;

      const { data: existing, error: lookupError } =
        await supabase
          .from("hashtags")
          .select("id")
          .eq("tag", tag)
          .maybeSingle();

      if (lookupError) {
        console.error("Error looking up hashtag:", lookupError);
        continue;
      }

      if (existing) {
        hashtagId = existing.id;
      } else {
        const { data: created, error: createError } =
          await supabase
            .from("hashtags")
            .insert({ tag })
            .select("id")
            .single();

        if (createError || !created) {
          console.error("Error creating hashtag:", createError);
          continue;
        }

        hashtagId = created.id;
      }

      const { error: linkError } = await supabase
        .from("event_hashtags")
        .insert({ event_id: eventId, hashtag_id: hashtagId });

      if (linkError) {
        console.error("Error linking hashtag to event:", linkError);
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

    if (!title.trim() || !date) {
      setError("Please add at least an event name and date.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const imageUrl = await uploadEventImage(user.id);

      const { data: created, error: insertError } =
        await supabase
          .from("events")
          .insert({
            organizer_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            event_date: date,
            event_time: time || null,
            location: location.trim() || null,
            capacity: capacity ? parseInt(capacity, 10) : null,
            image_url: imageUrl,
          })
          .select("id")
          .single();

      if (insertError || !created) {
        throw new Error(
          insertError?.message || "Failed to create event."
        );
      }

      await linkHashtags(created.id);

      router.push(`/event/${created.id}`);
    } catch (err) {
      console.error("Error creating event:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating your event."
      );

      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:hidden">
      {/* Header */}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          items-center
          justify-between
          px-4
          pt-4
          pb-3
          bg-background
          border-b
          border-foreground/30
        "
      >
        <h1 className="text-xl font-bold">
          Create Event
        </h1>

        <button
          onClick={() =>
            router.push("/event")
          }
          className="
            h-10
            w-10
            rounded-full
            bg-accent
            flex
            items-center
            justify-center
          "
        >
          <X size={20} />
        </button>
      </header>

      {/* Form */}
      <form
        id="create-event-form"
        onSubmit={handleSubmit}
        className="space-y-2 px-4 mt-4"
      >
        {/* Event Photo */}
        <div className="space-y-2">
          <label
            className="
              flex
              aspect-video
              w-full
              cursor-pointer
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              border
              border-foreground/25
              bg-accent/20
            "
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Event preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-foreground/50">
                <ImagePlus
                  size={32}
                  className="text-[#7f8480]"
                />
                <span className="text-sm">
                  Add event photo
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }

                e.target.value = "";
              }}
            />
          </label>
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
            className="
              w-full
              rounded-xl
              border
              border-foreground/25
              bg-transparent
              px-4
              py-3
              text-base
              outline-none
              focus:border-accent
            "
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
              onChange={(e) =>
                setDescription(e.target.value)
              }
              maxLength={500}
              placeholder="Describe your event..."
              rows={1}
              className="
                w-full
                resize-none
                overflow-hidden
                rounded-xl
                border
                border-foreground/25
                bg-background
                p-4
                pb-8
                text-base
                outline-none
                transition
                focus:border-accent
              "
            />

            <span
              className="
                pointer-events-none
                absolute
                bottom-3
                right-4
                text-xs
                text-foreground/50
              "
            >
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
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-foreground/50
              "
            />

            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="
                w-full
                rounded-xl
                border
                border-foreground/25
                bg-transparent
                py-3
                pl-11
                pr-4
                text-base
                outline-none
                focus:border-accent
              "
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
            className="
              w-full
              rounded-xl
              border
              border-foreground/25
              bg-transparent
              px-4
              py-3
              text-base
              outline-none
              focus:border-accent
            "
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
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Add capacity"
            className="
              w-full
              rounded-xl
              border
              border-foreground/25
              bg-transparent
              px-4
              py-3
              text-base
              outline-none
              focus:border-accent
            "
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
              className="
                pointer-events-none
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-foreground/50
              "
            />

            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add event location"
              className="
                w-full
                rounded-xl
                border
                border-foreground/25
                bg-transparent
                py-3
                pl-11
                pr-4
                text-base
                outline-none
                focus:border-accent
              "
            />
          </div>
        </div>

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

      {/* Create Event Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/30 bg-background p-4">
        <button
          type="submit"
          form="create-event-form"
          disabled={submitting}
          className="
            flex
            h-12
            w-full
            items-center
            justify-center
            rounded-full
            bg-[#b8d8be]/90
            font-semibold
            text-foreground
            transition
            active:scale-[0.98]
            disabled:opacity-60
          "
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </main>
  );
}
