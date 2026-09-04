"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Users,
  Share2,
} from "lucide-react";

export default function EventPage() {
  const router = useRouter();

  return (
    <div className="md:hidden min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.push("/event")}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Event
        </h1>
    
        <button
          type="button"
          className="ml-auto mr-3 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Event Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-accent">
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
        <div className="flex items-start justify-between gap-4">
          <div>
            {/** 
            <p className="mb-1 text-sm font-medium text-accent-secondary">
              EVENT
            </p>
            */}
            <h2 className="text-2xl font-bold">
              Anime & Manga Convention 2026
            </h2>
          </div>
        </div>

        {/* Event Details */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
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

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
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

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <Users size={19} />
            </div>

            <div>
              <p className="text-sm text-foreground/50">
                Attendees
              </p>

              <p className="text-sm font-medium">
                128 people are attending
              </p>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          type="button"
          className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold"
        >
          Join Event
        </button>

        {/* Description */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            About this event
          </h3>

          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Join fellow fans for a day filled with anime,
            manga, cosplay, merchandise, and activities.
            Meet other fans, discover new series, and enjoy
            the event together.
          </p>
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