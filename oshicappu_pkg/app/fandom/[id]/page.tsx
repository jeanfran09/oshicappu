"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { formatEventDate } from "@/utils/formatEventDate";
import { getCurrentPosition } from "@/utils/geo";

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
};

type SpotRow = {
  id: string;
  title: string;
  image_url: string | null;
};

type FanRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function FandomHubPage() {
  const params = useParams();
  const router = useRouter();

  const fandomId = params.id as string;

  const [fandomName, setFandomName] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [photoSpots, setPhotoSpots] = useState<SpotRow[]>([]);
  const [pilgrimageSpots, setPilgrimageSpots] = useState<SpotRow[]>([]);
  const [members, setMembers] = useState<FanRow[]>([]);
  const [nearbyCount, setNearbyCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);

      const { data: fandomRow, error: fandomError } = await supabase
        .from("fandoms")
        .select("id, name")
        .eq("id", fandomId)
        .maybeSingle();

      if (isCancelled) return;

      if (fandomError || !fandomRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setFandomName(fandomRow.name);

      const [eventsRes, photoRes, pilgrimageRes, oshiRes, postFandomRes] =
        await Promise.all([
          supabase
            .from("events")
            .select("id, title, event_date, location")
            .eq("fandom_id", fandomId)
            .order("event_date", { ascending: true }),
          supabase
            .from("photo_spots")
            .select("id, title, image_url")
            .eq("fandom_id", fandomId)
            .limit(12),
          supabase
            .from("pilgrimage_locations")
            .select("id, title, image_url")
            .eq("fandom_id", fandomId)
            .limit(12),
          supabase
            .from("oshis")
            .select("profiles(id, username, display_name, avatar_url)")
            .ilike("fandom", fandomRow.name)
            .limit(30),
          supabase
            .from("post_fandoms")
            .select("posts(user_id, profiles(id, username, display_name, avatar_url))")
            .eq("fandom_id", fandomId)
            .limit(30),
        ]);

      if (isCancelled) return;

      if (!eventsRes.error) setEvents(eventsRes.data ?? []);
      if (!photoRes.error) setPhotoSpots(photoRes.data ?? []);
      if (!pilgrimageRes.error)
        setPilgrimageSpots(pilgrimageRes.data ?? []);

      const seen = new Map<string, FanRow>();

      if (!oshiRes.error) {
        const rows = (oshiRes.data ?? []) as unknown as {
          profiles: FanRow | FanRow[] | null;
        }[];

        for (const row of rows) {
          const profile = Array.isArray(row.profiles)
            ? row.profiles[0]
            : row.profiles;

          if (profile) seen.set(profile.id, profile);
        }
      }

      if (!postFandomRes.error) {
        const rows = (postFandomRes.data ?? []) as unknown as {
          posts: { profiles: FanRow | FanRow[] | null } | null;
        }[];

        for (const row of rows) {
          const postProfiles = row.posts?.profiles;
          const profile = Array.isArray(postProfiles)
            ? postProfiles[0]
            : postProfiles;

          if (profile) seen.set(profile.id, profile);
        }
      }

      setMembers(Array.from(seen.values()));
      setLoading(false);
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [fandomId]);

  async function handleCheckNearby() {
    setNearbyCount(null);

    try {
      const pos = await getCurrentPosition();

      const { data, error } = await supabase.rpc("nearby_fans", {
        p_fandom: fandomName,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_radius_km: 15,
      });

      if (error) throw error;

      setNearbyCount((data ?? []).length);
    } catch (err) {
      console.error("Error checking nearby fans:", err);
      setNearbyCount(-1);
    }
  }

  if (notFound) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <p className="text-sm text-foreground/40">
          This fandom couldn&apos;t be found.
        </p>

        <button
          type="button"
          onClick={() => router.push("/map")}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium"
        >
          Back to the map
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          {fandomName || "Fandom"}
        </h1>
      </header>

      <main className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{fandomName}</h2>
            <p className="text-sm text-foreground/50">
              {members.length} fan{members.length === 1 ? "" : "s"} on
              Oshicappu
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/map?fandom=${encodeURIComponent(fandomName)}`)
            }
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-xs font-semibold"
          >
            <MapPin size={14} /> View on map
          </button>
        </div>

        {/* Nearby fans */}
        <section className="mt-5 rounded-xl bg-foreground/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Users size={16} /> Fans nearby
          </p>

          {nearbyCount === null ? (
            <button
              type="button"
              onClick={handleCheckNearby}
              className="mt-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold"
            >
              Check who&apos;s nearby
            </button>
          ) : nearbyCount === -1 ? (
            <p className="mt-2 text-xs text-foreground/50">
              Couldn&apos;t check — allow location access and try again.
            </p>
          ) : (
            <p className="mt-2 text-sm text-foreground/70">
              {nearbyCount >= 5
                ? `${nearbyCount} fans nearby`
                : nearbyCount > 0
                ? "A few fans nearby"
                : "No fans nearby yet — be the first to explore!"}
            </p>
          )}
        </section>

        {/* Upcoming events */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Upcoming events</h3>

          {loading ? (
            <p className="mt-2 text-sm text-foreground/40">Loading...</p>
          ) : events.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/40">
              No events tagged with this fandom yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {events.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/event/${e.id}`)}
                    className="w-full rounded-xl border border-foreground/10 p-3 text-left"
                  >
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {formatEventDate(e.event_date)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Photo spots */}
        {photoSpots.length > 0 && (
          <section className="mt-6">
            <h3 className="text-lg font-semibold">Photo spots</h3>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {photoSpots.map((s) => (
                <div
                  key={s.id}
                  className="aspect-square overflow-hidden rounded-lg bg-accent/30"
                >
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] text-foreground/50">
                      {s.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pilgrimage spots */}
        {pilgrimageSpots.length > 0 && (
          <section className="mt-6">
            <h3 className="text-lg font-semibold">Pilgrimage spots</h3>

            <ul className="mt-3 space-y-2">
              {pilgrimageSpots.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-foreground/10 p-3 text-sm font-medium"
                >
                  🗺️ {s.title}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Members */}
        <section className="mt-6">
          <h3 className="text-lg font-semibold">Fans on Oshicappu</h3>

          {members.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/40">
              No one has tagged themselves with this fandom yet.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/profile/${m.username}`)}
                    className="flex flex-col items-center gap-1"
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.display_name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-accent" />
                    )}

                    <span className="max-w-[64px] truncate text-[11px]">
                      {m.display_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
