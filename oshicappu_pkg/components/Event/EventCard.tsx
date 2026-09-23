"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Users,
  Share2,
} from "lucide-react";

import { formatCount } from "@/utils/formatNumber";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  interested: number;
  going: number;
  image: string | null;
  yourEvent?: boolean;
  rsvpStatus?: "interested" | "going" | null;
  fandomId?: string | null;
  fandomName?: string | null;
};

type EventCardProps = {
  event: Event;
};

type RSVPStatus = "interested" | "going" | null;

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

export default function EventCard({
  event,
}: EventCardProps) {
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const [rsvpStatus, setRsvpStatus] =
    useState<RSVPStatus>(event.rsvpStatus ?? null);

  const [interestedCount, setInterestedCount] =
    useState(event.interested);

  const [goingCount, setGoingCount] =
    useState(event.going);

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`;

    if (navigator.share) {
      await navigator.share({
        title: event.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const applyRsvp = async (nextStatus: RSVPStatus) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const prevStatus = rsvpStatus;

    // Optimistic UI update
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

    const { error } = await saveRsvp(
      event.id,
      user.id,
      nextStatus
    );

    if (error) {
      console.error("Failed to update RSVP:", error);

      // Revert on failure
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
  };

  const handleInterested = () => {
    applyRsvp(rsvpStatus === "interested" ? null : "interested");
  };

  const handleJoin = () => {
    applyRsvp(rsvpStatus === "going" ? null : "going");
  };

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-foreground/10
        bg-accent/10
      "
    >
      {/* Clickable Event Content */}
      <button
        type="button"
        onClick={() =>
          router.push(`/event/${event.id}`)
        }
        className="w-full text-left"
      >
        {/* Event Photo */}
        <div className="relative h-40 w-full bg-accent/20">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CalendarDays
                size={40}
                className="text-foreground/30"
              />
            </div>
          )}
        </div>

        {/* Event Information */}
        <div className="p-4">
          <h3 className="truncate text-base font-semibold">
            {event.title}
          </h3>

          {event.fandomName && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();

                if (event.fandomId) {
                  router.push(`/fandom/${event.fandomId}`);
                }
              }}
              className="mt-1.5 inline-block rounded-full bg-accent-secondary/70 px-2.5 py-1 text-xs font-medium"
            >
              {event.fandomName}
            </span>
          )}

          <p className="mt-1.5 text-sm text-foreground/60">
            {event.date} at {event.time}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-foreground/60">
            <MapPin size={15} />

            <span className="truncate">
              {event.location}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground/60">
            <Users size={15} />

            <span>
              {formatCount(interestedCount)} interested
            </span>

            <span>•</span>

            <span>
              {formatCount(goingCount)} going
            </span>
          </div>
        </div>
      </button>

      {/* Action Buttons */}
      {!event.yourEvent && (
        <div className="flex items-center gap-2 px-4 pb-4">

          {/* Interested */}
          <button
            type="button"
            onClick={handleInterested}
            className={`
              flex-1
              rounded-full
              py-2.5
              text-sm
              font-medium
              transition-colors
              ${
                rsvpStatus === "interested"
                  ? "bg-accent-secondary"
                  : "bg-foreground/5"
              }
            `}
          >
            {rsvpStatus === "interested"
              ? "Interested ✓"
              : "Interested"}
          </button>

          {/* Join */}
          <button
            type="button"
            onClick={handleJoin}
            className={`
              flex-1
              rounded-full
              py-2.5
              text-sm
              font-medium
              transition-colors
              ${
                rsvpStatus === "going"
                  ? "bg-accent-secondary"
                  : "bg-accent"
              }
            `}
          >
            {rsvpStatus === "going"
              ? "Going ✓"
              : "Join"}
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-foreground/5
            "
            aria-label="Share event"
          >
            <Share2 size={18} />
          </button>

        </div>
      )}
    </div>
  );
}