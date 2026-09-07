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
};

type EventCardProps = {
  event: Event;
};

export default function EventCard({
  event,
}: EventCardProps) {
  const router = useRouter();

  const [interested, setInterested] = useState(false);
  const [joined, setJoined] = useState(false);

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

          <p className="mt-1 text-sm text-foreground/60">
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
              {formatCount(
                event.interested +
                  (interested ? 1 : 0)
              )}{" "}
              interested
            </span>

            <span>•</span>

            <span>
              {formatCount(
                event.going + (joined ? 1 : 0)
              )}{" "}
              going
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
            onClick={() =>
              setInterested((prev) => !prev)
            }
            className={`
              flex-1
              rounded-full
              py-2.5
              text-sm
              font-medium
              transition-colors
              ${
                interested
                  ? "bg-accent-secondary"
                  : "bg-foreground/5"
              }
            `}
          >
            {interested ? "Interested ✓" : "Interested"}
          </button>

          {/* Join */}
          <button
            type="button"
            onClick={() =>
              setJoined((prev) => !prev)
            }
            className={`
              flex-1
              rounded-full
              py-2.5
              text-sm
              font-medium
              transition-colors
              ${
                joined
                  ? "bg-accent-secondary"
                  : "bg-accent"
              }
            `}
          >
            {joined ? "Going ✓" : "Join"}
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