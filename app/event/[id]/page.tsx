"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Users,
  Share2,
  Check,
} from "lucide-react";

type RSVPStatus = "interested" | "going" | null;

export default function EventPage() {
  const router = useRouter();
  const params = useParams();

  const [rsvpStatus, setRsvpStatus] =
    useState<RSVPStatus>(null);

  const [interestedCount, setInterestedCount] =
    useState(128);

  const [goingCount, setGoingCount] =
    useState(45);

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

  function handleInterested() {
    if (rsvpStatus === "interested") {
      // Deselect Interested
      setRsvpStatus(null);
      setInterestedCount((prev) =>
        Math.max(0, prev - 1)
      );
      return;
    }

    // If currently Going, remove Going first
    if (rsvpStatus === "going") {
      setGoingCount((prev) =>
        Math.max(0, prev - 1)
      );
    }

    setInterestedCount((prev) => prev + 1);
    setRsvpStatus("interested");
  }

  function handleJoinEvent() {
    if (rsvpStatus === "going") {
      // Deselect Going
      setRsvpStatus(null);
      setGoingCount((prev) =>
        Math.max(0, prev - 1)
      );

      return;
    }

    // If currently Interested, remove Interested first
    if (rsvpStatus === "interested") {
      setInterestedCount((prev) =>
        Math.max(0, prev - 1)
      );
    }

    setGoingCount((prev) => prev + 1);
    setRsvpStatus("going");
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
        <Image
          src="/posts/post1.png"
          alt="Event banner"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Event Information */}
      <main className="px-4 pb-24 pt-5">

        <h2 className="text-2xl font-bold">
          Anime & Manga Convention 2026
        </h2>

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
                September 20, 2026 · 10:00 AM
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
                SMX Convention Center
              </p>

              <p className="text-xs text-foreground/50">
                Pasay City, Philippines
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

            {rsvpStatus === "interested"
              ? "Interested"
              : "Interested"}
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

            {rsvpStatus === "going"
              ? "Going"
              : "Join Event"}
          </button>

        </div>

        {/* Description */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            About this event
          </h3>

          <p className="mt-2 text-sm leading-6 text-foreground/70">
            {renderDescription(
              "Join fellow fans for a day filled with anime, manga, cosplay, merchandise, and activities. Meet other fans, discover new series, and enjoy the event together.\n\nSign up here: https://forms.google.com"
            )}
          </p>
        </section>

        {/* Hashtags */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold">
            Hashtags
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-3 py-1.5 text-sm">
              #Anime
            </span>

            <span className="rounded-full bg-accent px-3 py-1.5 text-sm">
              #Manga
            </span>

            <span className="rounded-full bg-accent px-3 py-1.5 text-sm">
              #Cosplay
            </span>

            <span className="rounded-full bg-accent px-3 py-1.5 text-sm">
              #Oshikatsu
            </span>
          </div>
        </section>

        {/* Organizer */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            Organized by
          </h3>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent" />

            <div>
              <p className="text-sm font-semibold">
                Event Organizer
              </p>

              <p className="text-xs text-foreground/50">
                @eventorganizer
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}