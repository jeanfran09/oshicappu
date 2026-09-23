"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Users,
  Share2,
  Check,
  Camera,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import {
  formatEventDate,
  formatEventTime,
} from "@/utils/formatEventDate";

type RSVPStatus = "interested" | "going" | null;

type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  organizerId: string;
  organizerUsername: string | null;
  organizerDisplayName: string | null;
  organizerAvatarUrl: string | null;
  fandomId: string | null;
  fandomName: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Attendee = {
  user_id: string;
  status: "interested" | "going";
  username: string;
  display_name: string;
  avatar_url: string | null;
};

async function saveRsvp(
  eventId: string,
  userId: string,
  status: RSVPStatus
) {
  if (status === null) {
    return supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
  }

  return supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: "event_id,user_id" }
    );
}

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const { user } = useSupabaseAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [rsvpStatus, setRsvpStatus] =
    useState<RSVPStatus>(null);
  const [interestedCount, setInterestedCount] = useState(0);
  const [goingCount, setGoingCount] = useState(0);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadEvent() {
      setIsLoading(true);
      setNotFound(false);

      const { data: row, error: eventError } = await supabase
        .from("events_with_counts")
        .select(
          "id, title, description, event_date, event_time, location, image_url, interested_count, going_count, organizer_id, organizer_username, organizer_display_name, organizer_avatar_url, fandom_id, fandom_name, latitude, longitude"
        )
        .eq("id", eventId)
        .maybeSingle();

      if (eventError || !row) {
        if (eventError) {
          console.error("Error fetching event:", eventError);
        }

        if (!isCancelled) {
          setNotFound(true);
          setIsLoading(false);
        }

        return;
      }

      const { data: hashtagRows } = await supabase
        .from("event_hashtags")
        .select("hashtags(tag)")
        .eq("event_id", eventId);

      const { data: attendeeRows } = await supabase
        .from("event_attendees")
        .select("user_id, status, username, display_name, avatar_url")
        .eq("event_id", eventId);

      const { data: rsvpRow } = user
        ? await supabase
            .from("event_rsvps")
            .select("status")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .maybeSingle()
        : { data: null };

      if (isCancelled) return;

      setEvent({
        id: row.id,
        title: row.title,
        description: row.description,
        date: formatEventDate(row.event_date),
        time: formatEventTime(row.event_time),
        location: row.location ?? "",
        image_url: row.image_url,
        organizerId: row.organizer_id,
        organizerUsername: row.organizer_username,
        organizerDisplayName: row.organizer_display_name,
        organizerAvatarUrl: row.organizer_avatar_url,
        fandomId: row.fandom_id,
        fandomName: row.fandom_name,
        latitude: row.latitude,
        longitude: row.longitude,
      });

      setInterestedCount(row.interested_count);
      setGoingCount(row.going_count);
      setAttendees((attendeeRows ?? []) as Attendee[]);

      const hashtagJoins = (hashtagRows ?? []) as unknown as {
        hashtags: { tag: string } | { tag: string }[] | null;
      }[];

      setHashtags(
        hashtagJoins
          .map((r) =>
            Array.isArray(r.hashtags)
              ? r.hashtags[0]?.tag
              : r.hashtags?.tag
          )
          .filter((tag): tag is string => Boolean(tag))
      );

      setRsvpStatus(
        (rsvpRow?.status as RSVPStatus) ?? null
      );

      setIsLoading(false);
    }

    loadEvent();

    return () => {
      isCancelled = true;
    };
  }, [eventId, user]);

  function renderDescription(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split(urlRegex).map((part, index) => {
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-secondary underline"
          >
            {part}
          </a>
        );
      }

      return (
        <span key={index}>
          {part.split("\n").map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      );
    });
  }

  async function applyRsvp(nextStatus: RSVPStatus) {
    if (!user) {
      router.push("/login");
      return;
    }

    const prevStatus = rsvpStatus;

    setRsvpStatus(nextStatus);

    if (prevStatus === "interested" && nextStatus !== "interested") {
      setInterestedCount((prev) => Math.max(0, prev - 1));
    }
    if (prevStatus === "going" && nextStatus !== "going") {
      setGoingCount((prev) => Math.max(0, prev - 1));
    }
    if (nextStatus === "interested" && prevStatus !== "interested") {
      setInterestedCount((prev) => prev + 1);
    }
    if (nextStatus === "going" && prevStatus !== "going") {
      setGoingCount((prev) => prev + 1);
    }

    const { error } = await saveRsvp(eventId, user.id, nextStatus);

    if (error) {
      console.error("Failed to update RSVP:", error);

      setRsvpStatus(prevStatus);

      if (prevStatus === "interested" && nextStatus !== "interested") {
        setInterestedCount((prev) => prev + 1);
      }
      if (prevStatus === "going" && nextStatus !== "going") {
        setGoingCount((prev) => prev + 1);
      }
      if (nextStatus === "interested" && prevStatus !== "interested") {
        setInterestedCount((prev) => Math.max(0, prev - 1));
      }
      if (nextStatus === "going" && prevStatus !== "going") {
        setGoingCount((prev) => Math.max(0, prev - 1));
      }
    }
  }

  function handleInterested() {
    applyRsvp(rsvpStatus === "interested" ? null : "interested");
  }

  function handleJoinEvent() {
    applyRsvp(rsvpStatus === "going" ? null : "going");
  }

  async function handleShare() {
    const url = `${window.location.origin}/event/${eventId}`;

    if (navigator.share) {
      await navigator.share({ title: event?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  async function handlePhotoSelected(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !user || !event) return;

    setPhotoError("");
    setIsUploadingPhoto(true);

    // Show the new photo immediately while it uploads
    const previewUrl = URL.createObjectURL(file);
    const prevImageUrl = event.image_url;
    setEvent({ ...event, image_url: previewUrl });

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${eventId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("events")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || `image/${ext}`,
        });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("events").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("events")
        .update({ image_url: publicUrl })
        .eq("id", eventId);

      if (updateError) throw new Error(updateError.message);

      setEvent((current) =>
        current ? { ...current, image_url: publicUrl } : current
      );
    } catch (err) {
      console.error("Error updating event photo:", err);

      setPhotoError("Couldn't update the photo. Try again.");
      setEvent((current) =>
        current ? { ...current, image_url: prevImageUrl } : current
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploadingPhoto(false);
    }
  }

  if (isLoading) {
    return (
      <div className="md:hidden flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/40">
          Loading event...
        </p>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <p className="text-sm text-foreground/40">
          This event couldn&apos;t be found.
        </p>

        <button
          type="button"
          onClick={() => router.push("/event")}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen bg-background">

      {/* Header */}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          items-center
          border-b
          border-foreground/10
          bg-background
          py-3
        "
      >
        <button
          type="button"
          onClick={() => router.push("/event")}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
          "
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1
          className="
            absolute
            left-1/2
            -translate-x-1/2
            text-lg
            font-semibold
          "
        >
          Event
        </h1>

        <button
          type="button"
          onClick={handleShare}
          className="
            ml-auto
            mr-3
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
          "
          aria-label="Share event"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Event Image */}
      <div
        className="
          relative
          aspect-[16/9]
          w-full
          overflow-hidden
          bg-accent
        "
      >
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt="Event banner"
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized={event.image_url.startsWith("blob:")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CalendarDays
              size={40}
              className="text-foreground/30"
            />
          </div>
        )}

        {event.organizerId === user?.id && (
          <>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoSelected}
            />

            {isUploadingPhoto && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  bg-background/40
                "
              >
                <p className="rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium">
                  Uploading photo...
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              aria-label={
                event.image_url ? "Change event photo" : "Add event photo"
              }
              className="
                absolute
                bottom-3
                right-3
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-background/80
                backdrop-blur
                disabled:opacity-60
              "
            >
              <Camera size={18} />
            </button>
          </>
        )}
      </div>

      {photoError && (
        <p className="px-4 pt-2 text-xs text-red-500">
          {photoError}
        </p>
      )}

      {/* Event Information */}
      <main className="px-4 pb-24 pt-5">

        <h2 className="text-2xl font-bold">
          {event.title}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {event.fandomName && (
            <button
              type="button"
              onClick={() =>
                event.fandomId && router.push(`/fandom/${event.fandomId}`)
              }
              className="rounded-full bg-accent-secondary/70 px-3 py-1 text-xs font-semibold"
            >
              {event.fandomName}
            </button>
          )}

          {event.latitude != null && event.longitude != null && (
            <button
              type="button"
              onClick={() => router.push(`/map?event=${event.id}`)}
              className="flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium"
            >
              <MapPin size={12} /> View on map
            </button>
          )}
        </div>

        {/* Event Details */}
        <div className="mt-5 space-y-4">

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-accent
              "
            >
              <CalendarDays size={19} />
            </div>

            <div>
              <p className="text-sm text-foreground/50">
                Date & Time
              </p>

              <p className="text-sm font-medium">
                {event.date}
                {event.time ? ` · ${event.time}` : ""}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-accent
              "
            >
              <MapPin size={19} />
            </div>

            <div>
              <p className="text-sm text-foreground/50">
                Location
              </p>

              <p className="text-sm font-medium">
                {event.location || "Location TBA"}
              </p>
            </div>
          </div>

          {/* Event Interest */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-accent
              "
            >
              <Users size={19} />
            </div>

            <div>
              <p className="text-sm text-foreground/50">
                Event Interest
              </p>

              <p className="text-sm font-medium">
                {interestedCount} interested

                <span className="mx-1.5 text-foreground/40">
                  •
                </span>

                {goingCount} going
              </p>
            </div>
          </div>
        </div>

        {/* Event RSVP */}
        {event.organizerId !== user?.id && (
          <div className="mt-6 flex gap-3">

            {/* Interested */}
            <button
              type="button"
              onClick={handleInterested}
              className={`
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-full
                border
                py-3
                text-sm
                font-semibold
                transition-colors
                ${
                  rsvpStatus === "interested"
                    ? "border-accent-secondary bg-accent-secondary"
                    : "border-foreground/20 bg-background"
                }
              `}
            >
              {rsvpStatus === "interested" && (
                <Check size={17} />
              )}

              Interested
            </button>

            {/* Join Event */}
            <button
              type="button"
              onClick={handleJoinEvent}
              className={`
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-full
                py-3
                text-sm
                font-semibold
                transition-colors
                ${
                  rsvpStatus === "going"
                    ? "bg-accent-secondary"
                    : "bg-accent"
                }
              `}
            >
              {rsvpStatus === "going" && (
                <Check size={17} />
              )}

              {rsvpStatus === "going" ? "Going" : "Join Event"}
            </button>

          </div>
        )}

        {/* Who's going (event participation discovery) */}
        {attendees.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold">
              Who&apos;s interested & going
            </h3>

            <ul className="mt-3 flex flex-wrap gap-3">
              {attendees.map((a) => (
                <li key={a.user_id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/profile/${a.username}`)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="relative">
                      {a.avatar_url ? (
                        <img
                          src={a.avatar_url}
                          alt={a.display_name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-accent" />
                      )}

                      <span
                        className={`absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          a.status === "going"
                            ? "bg-accent-secondary"
                            : "bg-foreground/10"
                        }`}
                      >
                        {a.status === "going" ? "Going" : "Interested"}
                      </span>
                    </div>

                    <span className="max-w-[60px] truncate text-[11px]">
                      {a.display_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Description */}
        {event.description && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold">
              About this event
            </h3>

            <p className="mt-2 text-sm leading-6 text-foreground/70">
              {renderDescription(event.description)}
            </p>
          </section>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <section className="mt-6">
            <h3 className="text-lg font-semibold">
              Hashtags
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-3 py-1.5 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Organizer */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            Organized by
          </h3>

          <button
            type="button"
            onClick={() =>
              event.organizerUsername &&
              router.push(`/profile/${event.organizerUsername}`)
            }
            className="mt-3 flex items-center gap-3 text-left"
          >
            {event.organizerAvatarUrl ? (
              <img
                src={event.organizerAvatarUrl}
                alt={event.organizerDisplayName ?? "Organizer"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-accent" />
            )}

            <div>
              <p className="text-sm font-semibold">
                {event.organizerDisplayName ?? "Event Organizer"}
              </p>

              <p className="text-xs text-foreground/50">
                @{event.organizerUsername ?? "organizer"}
              </p>
            </div>
          </button>
        </section>

      </main>
    </div>
  );
}
