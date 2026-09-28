"use client";

import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Users,
  Share2,
} from "lucide-react";

export default function EventPageSkeleton() {
  return (
    <div className="md:hidden min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          disabled
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Event
        </h1>

        <button
          type="button"
          disabled
          className="ml-auto mr-3 flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Share event"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Event Image */}
      <div className="aspect-[16/9] w-full animate-pulse bg-foreground/10" />

      {/* Event Information */}
      <main className="px-4 pb-24 pt-5">
        {/* Event Title */}
        <div className="h-7 w-3/4 animate-pulse rounded-md bg-foreground/10" />

        {/* Event Details */}
        <div className="mt-5 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <CalendarDays size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm text-foreground/50">
                Date & Time
              </p>

              <div className="mt-1 h-4 w-40 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <MapPin size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm text-foreground/50">
                Location
              </p>

              <div className="mt-1 h-4 w-48 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>

          {/* Event Interest */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <Users size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm text-foreground/50">
                Event Interest
              </p>

              <div className="mt-1 h-4 w-36 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
        </div>

        {/* RSVP Buttons */}
        <div className="mt-6 flex gap-3">
          <div className="flex flex-1 items-center justify-center rounded-full border border-foreground/20 py-3">
            <span className="text-sm font-semibold">
              Interested
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center rounded-full bg-accent py-3">
            <span className="text-sm font-semibold">
              Join Event
            </span>
          </div>
        </div>

        {/* Who's Interested & Going */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            Who&apos;s interested & going
          </h3>

          <div className="mt-3 flex gap-3">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1"
                >
                   <div className="h-12 w-12 animate-pulse rounded-full bg-foreground/10" />
                </div>
              )
            )}
          </div>
        </section>

        {/* Description */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            About this event
          </h3>

          <div className="mt-3 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-foreground/10" />
          </div>
        </section>

        {/* Hashtags */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold">
            Hashtags
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="h-8 w-20 animate-pulse rounded-full bg-foreground/10" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-foreground/10" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-foreground/10" />
          </div>
        </section>

        {/* Organizer */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            Organized by
          </h3>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-foreground/10" />

            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-foreground/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}