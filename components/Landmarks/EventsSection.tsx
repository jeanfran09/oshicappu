"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import {
  formatEventDate,
  formatEventTime,
} from "@/utils/formatEventDate";

import EventList, {
  Event,
} from "@/components/Event/EventList";

type EventTab = "recommended" | "your";

type EventRow = {
  id: string;
  organizer_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  interested_count: number;
  going_count: number;
  fandom_id: string | null;
  fandom_name: string | null;
};

type LoadedEvent = Event & {
  organizerId: string;
  yourEvent?: boolean;
};

export default function EventsSection() {
  const { user } = useSupabaseAuth();

  const [activeTab, setActiveTab] =
    useState<EventTab>("recommended");

  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] =
    useState<LoadedEvent[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadEvents() {
      setIsLoading(true);
      setError("");

      const {
        data: eventRows,
        error: eventsError,
      } = await supabase
        .from("events_with_counts")
        .select(
          "id, organizer_id, title, event_date, event_time, location, image_url, interested_count, going_count, fandom_id, fandom_name"
        )
        .order("event_date", {
          ascending: true,
        });

      if (eventsError) {
        console.error(
          "Error fetching events:",
          eventsError
        );

        if (!isCancelled) {
          setError(
            "Couldn't load events. Try again later."
          );
          setIsLoading(false);
        }

        return;
      }

      const rows =
        (eventRows ?? []) as EventRow[];

      let rsvpByEventId = new Map<
        string,
        "interested" | "going"
      >();

      if (user && rows.length > 0) {
        const {
          data: rsvpRows,
          error: rsvpError,
        } = await supabase
          .from("event_rsvps")
          .select("event_id, status")
          .eq("user_id", user.id)
          .in(
            "event_id",
            rows.map((row) => row.id)
          );

        if (rsvpError) {
          console.error(
            "Error fetching RSVP status:",
            rsvpError
          );
        } else {
          rsvpByEventId = new Map(
            (rsvpRows ?? []).map((row) => [
              row.event_id,
              row.status as
                | "interested"
                | "going",
            ])
          );
        }
      }

      const mapped: LoadedEvent[] =
        rows.map((row) => ({
          id: row.id,
          organizerId: row.organizer_id,
          title: row.title,
          date: formatEventDate(
            row.event_date
          ),
          time: formatEventTime(
            row.event_time
          ),
          location: row.location ?? "",
          interested: row.interested_count,
          going: row.going_count,
          image: row.image_url,
          rsvpStatus:
            rsvpByEventId.get(row.id) ?? null,
          yourEvent:
            row.organizer_id === user?.id,
          fandomId: row.fandom_id,
          fandomName: row.fandom_name,
        }));

      if (!isCancelled) {
        setEvents(mapped);
        setIsLoading(false);
      }
    }

    loadEvents();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const filteredEvents = useMemo(() => {
    const byTab = events.filter((event) =>
      activeTab === "your"
        ? event.organizerId === user?.id
        : event.organizerId !== user?.id
    );

    const query =
      searchQuery.trim().toLowerCase();

    if (!query) return byTab;

    return byTab.filter((event) =>
      event.title
        .toLowerCase()
        .includes(query)
    );
  }, [
    events,
    activeTab,
    searchQuery,
    user?.id,
  ]);

  return (
    <section>
      {/* Event Tabs */}
      <section className="px-4 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab("recommended")
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "recommended"
                ? "bg-accent text-foreground"
                : "bg-foreground/5 text-foreground/50"
            }`}
          >
            Recommended
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("your")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "your"
                ? "bg-accent text-foreground"
                : "bg-foreground/5 text-foreground/50"
            }`}
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
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search events..."
            className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>
      </section>

      {/* Event List */}
      {isLoading ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            Loading events...
          </p>
        </div>
      ) : error ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {error}
          </p>
        </div>
      ) : filteredEvents.length > 0 ? (
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
    </section>
  );
}