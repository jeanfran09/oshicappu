"use client";

import { formatCount } from "@/utils/formatNumber";
import {
  CalendarDays,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

const events = [
  {
    id: "1",
    title: "Idol Birthday Café",
    date: "September 14, 2026",
    time: "1:00 PM",
    location: "Makati City",
    interested: 1700,
    going: 700,
    image: "/posts/post1.png",
  },
  {
    id: "2",
    title: "Oshikatsu Meetup",
    date: "September 21, 2026",
    time: "3:30 PM",
    location: "Quezon City",
    interested: 77000,
    going: 7000,
    image: null,
  },
  {
    id: "3",
    title: "Anime Merch Trading Day",
    date: "October 3, 2026",
    time: "11:00 AM",
    location: "Pasay City",
    interested: 31,
    going: 7,
    image: "/posts/post2.jpg",
  },
];

export default function EventPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background pb-20 md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-foreground/10 bg-background px-3">
        <h1 className="text-xl font-bold">
          Events
        </h1>

        {/* Create Event */}
        <button
          type="button"
          onClick={() => {
            // router.push("/events/create");
          }}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-accent
          "
          aria-label="Create event"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Search Bar */}
      <section className="px-4 pt-4 pb-4">
        <div className="flex items-center rounded-xl bg-foreground/5 px-4">
          <Search
            size={18}
            className="shrink-0 text-foreground/50"
          />

          <input
            type="text"
            placeholder="Search events..."
            className="
              w-full
              bg-transparent
              px-3
              py-3
              text-sm
              outline-none
              placeholder:text-foreground/40
            "
          />
        </div>
      </section>

      
      {/* Intro */}
      {/** 
      <section className="px-4 pb-3">
        <h2 className="text-xl font-bold">
          Events For You
        </h2>
      </section>
      */}

      {/* Event List */}
      <section className="space-y-3 px-4">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
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
                  insert default photo
                  {/** 
                  <CalendarDays
                    size={42}
                    className="text-foreground/30"
                  />*/}
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
                <span className="text-foreground/60">•</span>
                <span>
                  {formatCount(event.going)} going
                </span>
              </div>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}