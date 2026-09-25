"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import PhotoSpotList, {
  PhotoSpot,
} from "@/components/PhotoSpot/PhotoSpotList";
import PhotoSpotListSkeleton from "../Skeleton/PhotoSpotListSkeleton";

type PhotoSpotTab = "recommended" | "your";

type PhotoSpotRow = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  fandom_id: string | null;
  fandoms: {
    name: string;
  } | null;
};

type LoadedPhotoSpot = PhotoSpot & {
  createdBy: string;
  yourSpot?: boolean;
};

export default function PhotoSpotsSection() {
  const { user } = useSupabaseAuth();

  const [activeTab, setActiveTab] =
    useState<PhotoSpotTab>("recommended");

  const [searchQuery, setSearchQuery] = useState("");

  const [photoSpots, setPhotoSpots] =
    useState<LoadedPhotoSpot[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadPhotoSpots() {
      setIsLoading(true);
      setError("");

      const {
        data: photoSpotRows,
        error: photoSpotsError,
      } = await supabase
        .from("photo_spots")
        .select(`
          id,
          created_by,
          title,
          description,
          image_url,
          latitude,
          longitude,
          fandom_id,
          fandoms (
            name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (photoSpotsError) {
        console.error(
          "Error fetching photo spots:",
          photoSpotsError
        );

        if (!isCancelled) {
          setError(
            "Couldn't load photo spots. Try again later."
          );
          setIsLoading(false);
        }

        return;
      }

      const rows =
        (photoSpotRows ?? []) as unknown as PhotoSpotRow[];

      const mapped: LoadedPhotoSpot[] = rows.map(
        (row) => ({
          id: row.id,
          createdBy: row.created_by,
          title: row.title,
          description: row.description,
          image: row.image_url,
          latitude: row.latitude,
          longitude: row.longitude,
          fandomId: row.fandom_id,
          fandomName: row.fandoms?.name ?? null,
          yourSpot: row.created_by === user?.id,
        })
      );

      if (!isCancelled) {
        setPhotoSpots(mapped);
        setIsLoading(false);
      }
    }

    loadPhotoSpots();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const filteredPhotoSpots = useMemo(() => {
    const byTab = photoSpots.filter((photoSpot) =>
      activeTab === "your"
        ? photoSpot.createdBy === user?.id
        : photoSpot.createdBy !== user?.id
    );

    const query = searchQuery.trim().toLowerCase();

    if (!query) return byTab;

    return byTab.filter((photoSpot) => {
      const titleMatches = photoSpot.title
        .toLowerCase()
        .includes(query);

      const fandomMatches = photoSpot.fandomName
        ?.toLowerCase()
        .includes(query);

      return titleMatches || fandomMatches;
    });
  }, [
    photoSpots,
    activeTab,
    searchQuery,
    user?.id,
  ]);

  return (
    <section>
      {/* Photo Spot Tabs */}
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
            onClick={() =>
              setActiveTab("your")
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "your"
                ? "bg-accent text-foreground"
                : "bg-foreground/5 text-foreground/50"
            }`}
          >
            Your Spots
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
            placeholder="Search photo spots..."
            className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>
      </section>

      {/* Photo Spot List */}
      {isLoading ? (
        <PhotoSpotListSkeleton />
      ) : error ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {error}
          </p>
        </div>
      ) : filteredPhotoSpots.length > 0 ? (
        <PhotoSpotList
          photoSpots={filteredPhotoSpots}
        />
      ) : (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {activeTab === "recommended"
              ? "No photo spots yet."
              : "You haven't created any photo spots yet."}
          </p>
        </div>
      )}
    </section>
  );
}