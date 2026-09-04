"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";

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
};

type EventCardProps = {
  event: Event;
};

export default function EventCard({
  event,
}: EventCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/event/${event.id}`)}
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-foreground/10
        bg-accent/10
        text-left
      "
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
              size={42}
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
            {formatCount(event.interested)} interested
          </span>

          <span className="text-foreground/60">
            •
          </span>

          <span>
            {formatCount(event.going)} going
          </span>
        </div>
      </div>
    </button>
  );
}