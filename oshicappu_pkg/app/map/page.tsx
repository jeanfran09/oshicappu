"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Camera,
  MapPin,
  Plus,
  Stamp,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import AddSpotSheet from "@/components/FandomMap/AddSpotSheet";
import type { MapMarker } from "@/components/FandomMap/MapView";
import {
  distanceKm,
  formatDistance,
  getCurrentPosition,
  toApproxCoordinate,
} from "@/utils/geo";
import { formatEventDate, formatEventTime } from "@/utils/formatEventDate";

const MapView = dynamic(
  () => import("@/components/FandomMap/MapView"),
  { ssr: false }
);

type Tab = "map" | "nearby" | "community";

type EventRow = {
  id: string;
  title: string;
  fandom_id: string | null;
  fandom_name: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
  latitude: number | null;
  longitude: number | null;
};

type SpotRow = {
  id: string;
  title: string;
  fandom_id: string | null;
  fandom_name: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
};

type FandomOption = { id: string; name: string };

type NearbyFan = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]; // Manila fallback

function flattenSpotRows(
  rows:
    | ({
        id: string;
        title: string;
        fandom_id: string | null;
        fandoms: { name: string } | { name: string }[] | null;
        description: string | null;
        latitude: number;
        longitude: number;
        image_url: string | null;
      }[])
    | null
): SpotRow[] {
  return (rows ?? []).map((row) => {
    const fandom = Array.isArray(row.fandoms)
      ? row.fandoms[0]
      : row.fandoms;

    return {
      id: row.id,
      title: row.title,
      fandom_id: row.fandom_id,
      fandom_name: fandom?.name ?? null,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      image_url: row.image_url,
    };
  });
}

export default function MapPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const [tab, setTab] = useState<Tab>("map");

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState("");

  const [fandomQuery, setFandomQuery] = useState("");
  const [fandomOptions, setFandomOptions] = useState<FandomOption[]>([]);

  useEffect(() => {
    async function loadFandoms() {
      const { data } = await supabase
        .from("fandoms")
        .select("id, name")
        .order("name", { ascending: true });

      setFandomOptions(data ?? []);
    }

    loadFandoms();
  }, []);

  // Pick up a `?fandom=` or `?event=` param (e.g. from a fandom hub's
  // "View on map" link, or an event's "View on map" button) without
  // opting the whole page into useSearchParams' suspense requirements.
  const [focusEventId, setFocusEventId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fandom = params.get("fandom");
    const eventId = params.get("event");

    if (fandom || eventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fandom) setFandomQuery(fandom);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (eventId) setFocusEventId(eventId);
    }
  }, []);

  const [showEvents, setShowEvents] = useState(true);
  const [showPhotoSpots, setShowPhotoSpots] = useState(true);
  const [showPilgrimage, setShowPilgrimage] = useState(true);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [photoSpots, setPhotoSpots] = useState<SpotRow[]>([]);
  const [pilgrimageSpots, setPilgrimageSpots] = useState<SpotRow[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingKind, setPendingKind] =
    useState<"photo_spot" | "pilgrimage" | null>(null);
  const [pickedLocation, setPickedLocation] =
    useState<[number, number] | null>(null);
  const [sheetKind, setSheetKind] =
    useState<"photo_spot" | "pilgrimage" | null>(null);

  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [hasSharedLocation, setHasSharedLocation] = useState(false);

  const [nearbyFans, setNearbyFans] = useState<NearbyFan[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState("");

  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Get the user's current position once on load, best-effort.
  useEffect(() => {
    getCurrentPosition()
      .then((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      })
      .catch(() => {
        setLocationError(
          "Couldn't get your location — showing the default area."
        );
      });
  }, []);

  useEffect(() => {
    async function checkSharedLocation() {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("approx_lat, approx_lng")
        .eq("id", user.id)
        .maybeSingle();

      setHasSharedLocation(
        Boolean(data?.approx_lat && data?.approx_lng)
      );
    }

    checkSharedLocation();
  }, [user]);

  useEffect(() => {
    let isCancelled = false;

    loadMapData(isCancelled);

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadMapData(isCancelled = false) {
    setLoading(true);

    const [eventsRes, photoSpotsRes, pilgrimageRes] = await Promise.all([
      supabase
        .from("events_with_counts")
        .select(
          "id, title, fandom_id, fandom_name, location, event_date, event_time, latitude, longitude"
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null),
      supabase
        .from("photo_spots")
        .select(
          "id, title, fandom_id, fandoms(name), description, latitude, longitude, image_url"
        ),
      supabase
        .from("pilgrimage_locations")
        .select(
          "id, title, fandom_id, fandoms(name), description, latitude, longitude, image_url"
        ),
    ]);

    if (isCancelled) return;

    if (eventsRes.error) {
      console.error("Error loading events for map:", eventsRes.error);
    } else {
      setEvents((eventsRes.data ?? []) as EventRow[]);
    }

    if (photoSpotsRes.error) {
      console.error(
        "Error loading photo spots:",
        photoSpotsRes.error
      );
    } else {
      setPhotoSpots(flattenSpotRows(photoSpotsRes.data));
    }

    if (pilgrimageRes.error) {
      console.error(
        "Error loading pilgrimage locations:",
        pilgrimageRes.error
      );
    } else {
      setPilgrimageSpots(flattenSpotRows(pilgrimageRes.data));
    }

    if (user) {
      const { data: stampRows, error: stampError } = await supabase
        .from("pilgrimage_stamps")
        .select("location_id")
        .eq("user_id", user.id);

      if (!stampError) {
        setVisitedIds(
          new Set((stampRows ?? []).map((r) => r.location_id))
        );
      }
    }

    setLoading(false);
  }

  const query = fandomQuery.trim().toLowerCase();

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (e) => !query || (e.fandom_name ?? "").toLowerCase().includes(query)
      ),
    [events, query]
  );

  const filteredPhotoSpots = useMemo(
    () =>
      photoSpots.filter(
        (s) => !query || (s.fandom_name ?? "").toLowerCase().includes(query)
      ),
    [photoSpots, query]
  );

  const filteredPilgrimage = useMemo(
    () =>
      pilgrimageSpots.filter(
        (s) => !query || (s.fandom_name ?? "").toLowerCase().includes(query)
      ),
    [pilgrimageSpots, query]
  );

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    if (showEvents) {
      for (const e of filteredEvents) {
        if (e.latitude == null || e.longitude == null) continue;

        list.push({
          id: e.id,
          kind: "event",
          lat: e.latitude,
          lng: e.longitude,
          title: e.title,
          subtitle: [e.fandom_name, formatEventDate(e.event_date)]
            .filter(Boolean)
            .join(" · "),
        });
      }
    }

    if (showPhotoSpots) {
      for (const s of filteredPhotoSpots) {
        list.push({
          id: s.id,
          kind: "photo_spot",
          lat: s.latitude,
          lng: s.longitude,
          title: s.title,
          subtitle: s.fandom_name ?? undefined,
        });
      }
    }

    if (showPilgrimage) {
      for (const s of filteredPilgrimage) {
        list.push({
          id: s.id,
          kind: "pilgrimage",
          lat: s.latitude,
          lng: s.longitude,
          title: s.title,
          subtitle: s.fandom_name ?? undefined,
          visited: visitedIds.has(s.id),
        });
      }
    }

    return list;
  }, [
    showEvents,
    showPhotoSpots,
    showPilgrimage,
    filteredEvents,
    filteredPhotoSpots,
    filteredPilgrimage,
    visitedIds,
  ]);

  type NearbyItem = {
    id: string;
    kind: "event" | "photo_spot" | "pilgrimage";
    title: string;
    subtitle: string;
    distance: number | null;
    lat: number;
    lng: number;
    visited?: boolean;
  };

  const nearbyList: NearbyItem[] = useMemo(() => {
    const items: NearbyItem[] = [];

    for (const e of filteredEvents) {
      if (e.latitude == null || e.longitude == null) continue;

      items.push({
        id: e.id,
        kind: "event",
        title: e.title,
        subtitle: [
          e.fandom_name,
          formatEventDate(e.event_date),
          formatEventTime(e.event_time),
        ]
          .filter(Boolean)
          .join(" · "),
        distance: position
          ? distanceKm(
              { lat: position[0], lng: position[1] },
              { lat: e.latitude, lng: e.longitude }
            )
          : null,
        lat: e.latitude,
        lng: e.longitude,
      });
    }

    for (const s of filteredPhotoSpots) {
      items.push({
        id: s.id,
        kind: "photo_spot",
        title: s.title,
        subtitle: s.fandom_name ?? "Photo spot",
        distance: position
          ? distanceKm(
              { lat: position[0], lng: position[1] },
              { lat: s.latitude, lng: s.longitude }
            )
          : null,
        lat: s.latitude,
        lng: s.longitude,
      });
    }

    for (const s of filteredPilgrimage) {
      items.push({
        id: s.id,
        kind: "pilgrimage",
        title: s.title,
        subtitle: s.fandom_name ?? "Pilgrimage spot",
        distance: position
          ? distanceKm(
              { lat: position[0], lng: position[1] },
              { lat: s.latitude, lng: s.longitude }
            )
          : null,
        lat: s.latitude,
        lng: s.longitude,
        visited: visitedIds.has(s.id),
      });
    }

    return items.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [filteredEvents, filteredPhotoSpots, filteredPilgrimage, position, visitedIds]);

  async function handleShareLocation() {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSharingLocation(true);

    try {
      const pos = await getCurrentPosition();

      const approxLat = toApproxCoordinate(pos.coords.latitude);
      const approxLng = toApproxCoordinate(pos.coords.longitude);

      const { error } = await supabase
        .from("profiles")
        .update({
          approx_lat: approxLat,
          approx_lng: approxLng,
          location_shared_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setHasSharedLocation(true);
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    } catch (err) {
      console.error("Error sharing location:", err);
      setLocationError("Couldn't share your location. Check permissions.");
    } finally {
      setIsSharingLocation(false);
    }
  }

  async function handleFindFans() {
    if (!query) {
      setCommunityError("Enter a fandom to find nearby fans.");
      return;
    }

    if (!position) {
      setCommunityError("We need your location to find fans nearby.");
      return;
    }

    setCommunityLoading(true);
    setCommunityError("");

    const { data, error } = await supabase.rpc("nearby_fans", {
      p_fandom: fandomQuery.trim(),
      p_lat: position[0],
      p_lng: position[1],
      p_radius_km: 15,
    });

    if (error) {
      console.error("Error fetching nearby fans:", error);
      setCommunityError("Couldn't load nearby fans. Try again.");
      setNearbyFans([]);
    } else {
      setNearbyFans((data ?? []) as NearbyFan[]);
    }

    setCommunityLoading(false);
  }

  async function handleCheckIn(locationId: string) {
    if (!user) {
      router.push("/login");
      return;
    }

    setCheckingInId(locationId);

    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true });

      const { error } = await supabase.rpc("collect_stamp", {
        p_location_id: locationId,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
      });

      if (error) throw error;

      setVisitedIds((prev) => new Set(prev).add(locationId));
    } catch (err) {
      console.error("Error collecting stamp:", err);
      alert(
        err instanceof Error
          ? err.message
          : "You need to be within 300m of this spot to check in."
      );
    } finally {
      setCheckingInId(null);
    }
  }

  function handleMapClick(lat: number, lng: number) {
    if (!pendingKind) return;

    setPickedLocation([lat, lng]);
    setSheetKind(pendingKind);
    setPendingKind(null);
  }

  function startAdding(kind: "photo_spot" | "pilgrimage") {
    if (!user) {
      router.push("/login");
      return;
    }

    setAddMenuOpen(false);
    setPendingKind(kind);
  }

  const focusedEvent = focusEventId
    ? events.find((e) => e.id === focusEventId)
    : null;

  const mapCenter: [number, number] =
    focusedEvent && focusedEvent.latitude != null && focusedEvent.longitude != null
      ? [focusedEvent.latitude, focusedEvent.longitude]
      : position ?? DEFAULT_CENTER;

  return (
    <main className="flex min-h-screen flex-col bg-background pb-20 md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-[1100] flex items-center justify-between border-b border-foreground/10 bg-background px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">Fandom Map</h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3">
        {(
          [
            { id: "map", label: "Map" },
            { id: "nearby", label: "Nearby" },
            { id: "community", label: "Community" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-foreground"
                : "bg-foreground/5 text-foreground/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Fandom filter */}
      <div className="px-4 pt-3">
        <input
          type="text"
          list="fandom-options"
          value={fandomQuery}
          onChange={(e) => setFandomQuery(e.target.value)}
          placeholder="Filter by fandom"
          className="w-full rounded-xl border border-foreground/20 bg-foreground/5 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />

        <datalist id="fandom-options">
          {fandomOptions.map((f) => (
            <option key={f.id} value={f.name} />
          ))}
        </datalist>
      </div>

      {locationError && (
        <p className="px-4 pt-2 text-xs text-foreground/40">
          {locationError}
        </p>
      )}

      {tab === "map" && (
        <>
          {/* Layer toggles */}
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            <ToggleChip
              active={showEvents}
              onClick={() => setShowEvents((v) => !v)}
              label="🎉 Events"
            />
            <ToggleChip
              active={showPhotoSpots}
              onClick={() => setShowPhotoSpots((v) => !v)}
              label="📸 Photo spots"
            />
            <ToggleChip
              active={showPilgrimage}
              onClick={() => setShowPilgrimage((v) => !v)}
              label="🗺️ Pilgrimage"
            />
          </div>

          {pendingKind && (
            <div className="mx-4 mt-3 flex items-center justify-between rounded-xl bg-accent px-4 py-2.5 text-sm">
              <span>Tap the map to place your spot</span>

              <button
                type="button"
                onClick={() => setPendingKind(null)}
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="relative mt-3 h-[55vh] w-full">
            <MapView
              center={mapCenter}
              markers={markers}
              onMapClick={handleMapClick}
              pickedLocation={pickedLocation}
              onMarkerClick={(marker) => {
                if (marker.kind === "event") {
                  router.push(`/event/${marker.id}`);
                }
              }}
            />

            {/* Add button */}
            <div className="absolute bottom-4 right-4 z-[1000]">
              {addMenuOpen && (
                <div className="mb-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => startAdding("photo_spot")}
                    className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-md"
                  >
                    <Camera size={16} /> Add photo spot
                  </button>

                  <button
                    type="button"
                    onClick={() => startAdding("pilgrimage")}
                    className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-md"
                  >
                    <Stamp size={16} /> Add pilgrimage spot
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setAddMenuOpen((v) => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-secondary shadow-lg"
                aria-label="Add a spot"
              >
                {addMenuOpen ? <X size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </div>

          {!hasSharedLocation && (
            <div className="mx-4 mt-4 rounded-xl bg-foreground/5 p-4">
              <p className="text-sm font-medium">
                Share your approximate area
              </p>

              <p className="mt-1 text-xs text-foreground/50">
                See how many fans of a fandom are nearby. We only ever
                store a rounded, approximate area — never your exact
                location.
              </p>

              <button
                type="button"
                onClick={handleShareLocation}
                disabled={isSharingLocation}
                className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isSharingLocation ? "Sharing..." : "Share my area"}
              </button>
            </div>
          )}
        </>
      )}

      {tab === "nearby" && (
        <section className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-foreground/60">
            What&apos;s happening around you
          </h2>

          {loading ? (
            <p className="mt-6 text-center text-sm text-foreground/40">
              Loading...
            </p>
          ) : nearbyList.length === 0 ? (
            <p className="mt-6 text-center text-sm text-foreground/40">
              Nothing found yet. Try clearing the fandom filter.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {nearbyList.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="rounded-xl border border-foreground/10 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        item.kind === "event" &&
                        router.push(`/event/${item.id}`)
                      }
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-semibold">
                        {KIND_EMOJI[item.kind]} {item.title}
                      </p>

                      <p className="mt-0.5 text-xs text-foreground/50">
                        {item.subtitle}
                      </p>

                      {item.distance !== null && (
                        <p className="mt-1 text-xs text-foreground/40">
                          {formatDistance(item.distance)}
                        </p>
                      )}
                    </button>

                    {item.kind === "pilgrimage" && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(item.id)}
                        disabled={
                          item.visited || checkingInId === item.id
                        }
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          item.visited
                            ? "bg-accent/50 text-foreground/50"
                            : "bg-accent-secondary"
                        }`}
                      >
                        {item.visited
                          ? "Visited"
                          : checkingInId === item.id
                          ? "Checking in..."
                          : "Check in"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "community" && (
        <section className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-foreground/60">
            Find fans nearby
          </h2>

          <p className="mt-1 text-xs text-foreground/50">
            Enter a fandom above, then look for other fans nearby.
            We only ever show who&apos;s nearby — never exactly where.
          </p>

          <button
            type="button"
            onClick={handleFindFans}
            disabled={communityLoading}
            className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {communityLoading ? "Searching..." : "Find nearby fans"}
          </button>

          {communityError && (
            <p className="mt-3 text-sm text-red-500">{communityError}</p>
          )}

          {nearbyFans.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Users size={16} />
                {nearbyFans.length >= 5
                  ? `${nearbyFans.length} fans nearby`
                  : "A few fans nearby"}
              </p>

              <ul className="mt-3 space-y-2">
                {nearbyFans.map((fan) => (
                  <li key={fan.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/profile/${fan.username}`)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-foreground/5"
                    >
                      {fan.avatar_url ? (
                        <img
                          src={fan.avatar_url}
                          alt={fan.display_name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-accent" />
                      )}

                      <div>
                        <p className="text-sm font-semibold">
                          {fan.display_name}
                        </p>
                        <p className="text-xs text-foreground/50">
                          @{fan.username}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {query && (() => {
            const matched = fandomOptions.find(
              (f) => f.name.toLowerCase() === query
            );

            return (
              <button
                type="button"
                onClick={() =>
                  matched
                    ? router.push(`/fandom/${matched.id}`)
                    : setCommunityError(
                        "That fandom doesn't have a community hub yet — try one from the suggestions."
                      )
                }
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent-secondary underline"
              >
                <MapPin size={14} />
                View full community hub for &quot;{fandomQuery.trim()}&quot;
              </button>
            );
          })()}
        </section>
      )}

      {sheetKind && user && (
        <AddSpotSheet
          kind={sheetKind}
          userId={user.id}
          initialLat={pickedLocation?.[0] ?? null}
          initialLng={pickedLocation?.[1] ?? null}
          onClose={() => {
            setSheetKind(null);
            setPickedLocation(null);
          }}
          onCreated={() => {
            setSheetKind(null);
            setPickedLocation(null);
            loadMapData();
          }}
        />
      )}
    </main>
  );
}

const KIND_EMOJI: Record<"event" | "photo_spot" | "pilgrimage", string> = {
  event: "🎉",
  photo_spot: "📸",
  pilgrimage: "🗺️",
};

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-accent-secondary text-foreground"
          : "bg-foreground/5 text-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}
