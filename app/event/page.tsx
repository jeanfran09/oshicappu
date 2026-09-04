"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import EventList, {
  Event,
} from "@/components/Event/EventList";

const events: (Event & { yourEvent?: boolean })[] = [
  {
    id: "1",
    title: "Idol Birthday Café",
    date: "September 14, 2026",
    time: "1:00 PM",
    location: "Makati City",
    interested: 1700,
    going: 700,
    image: "/posts/post1.png",
    yourEvent: false,
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
    yourEvent: false,
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
    yourEvent: false,
  },
];

type EventTab = "recommended" | "your";

export default function EventPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<EventTab>("recommended");

  const filteredEvents =
    activeTab === "recommended"
      ? events.filter((event) => !event.yourEvent)
      : events.filter((event) => event.yourEvent);

  return (
    <main className="min-h-screen bg-background pb-20 md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background px-3 pt-4 pb-3">
        <h1 className="text-xl font-bold">
          Events
        </h1>

        {/* Create Event */}
        <button
          type="button"
          onClick={() => {
            router.push("/event/create");
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

      {/* Capsule Filters */}
      <section className="px-4 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab("recommended")
            }
            className={`
              rounded-full
              px-4
              py-2
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "recommended"
                  ? "bg-accent text-foreground"
                  : "bg-foreground/5 text-foreground/50"
              }
            `}
          >
            Recommended
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("your")}
            className={`
              rounded-full
              px-4
              py-2
              text-sm
              font-medium
              transition-colors
              ${
                activeTab === "your"
                  ? "bg-accent text-foreground"
                  : "bg-foreground/5 text-foreground/50"
              }
            `}
          >
            Your Events
          </button>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 pb-4 pt-4">
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

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <EventList events={filteredEvents} />
      ) : (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {activeTab === "recommended"
              ? "No recommended events yet."
              : "You haven't created any events yet."}
          </p>
        </div>
      )}
    </main>
  );
}