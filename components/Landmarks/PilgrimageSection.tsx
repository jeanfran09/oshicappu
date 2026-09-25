"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import PilgrimageList, {
  Pilgrimage,
} from "@/components/Pilgrimage/PilgrimageList";
import PilgrimageListSkeleton from "../Skeleton/PilgrimageListSkeleton";

type PilgrimageTab =
  | "recommended"
  | "your";

type PilgrimageRow = {
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

type LoadedPilgrimage =
  Pilgrimage & {
    createdBy: string;
    yourPilgrimage?: boolean;
  };

export default function PilgrimageSection() {
  const { user } = useSupabaseAuth();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<PilgrimageTab>(
      "recommended"
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    pilgrimages,
    setPilgrimages,
  ] = useState<
    LoadedPilgrimage[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadPilgrimages() {
      setIsLoading(true);
      setError("");

      const {
        data: pilgrimageRows,
        error: pilgrimageError,
      } = await supabase
        .from(
          "pilgrimage_locations"
        )
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

      if (pilgrimageError) {
        console.error(
          "Error fetching pilgrimage locations:",
          pilgrimageError
        );

        if (!isCancelled) {
          setError(
            "Couldn't load pilgrimage locations. Try again later."
          );
          setIsLoading(false);
        }

        return;
      }

      const rows =
        (pilgrimageRows ??
          []) as unknown as PilgrimageRow[];

      const mapped: LoadedPilgrimage[] =
        rows.map((row) => ({
          id: row.id,
          createdBy:
            row.created_by,
          title: row.title,
          description:
            row.description,
          image: row.image_url,
          latitude: row.latitude,
          longitude:
            row.longitude,
          fandomId:
            row.fandom_id,
          fandomName:
            row.fandoms?.name ??
            null,
          yourPilgrimage:
            row.created_by ===
            user?.id,
        }));

      if (!isCancelled) {
        setPilgrimages(mapped);
        setIsLoading(false);
      }
    }

    loadPilgrimages();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const filteredPilgrimages =
    useMemo(() => {
      const byTab =
        pilgrimages.filter(
          (pilgrimage) =>
            activeTab === "your"
              ? pilgrimage.createdBy ===
                user?.id
              : pilgrimage.createdBy !==
                user?.id
        );

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) return byTab;

      return byTab.filter(
        (pilgrimage) => {
          const titleMatches =
            pilgrimage.title
              .toLowerCase()
              .includes(query);

          const fandomMatches =
            pilgrimage.fandomName
              ?.toLowerCase()
              .includes(query);

          return (
            titleMatches ||
            fandomMatches
          );
        }
      );
    }, [
      pilgrimages,
      activeTab,
      searchQuery,
      user?.id,
    ]);

  return (
    <section>
      {/* Pilgrimage Tabs */}
      <section className="px-4 pt-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "recommended"
              )
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab ===
              "recommended"
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
            Your Locations
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
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Search pilgrimage locations..."
            className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>
      </section>

      {/* Pilgrimage List */}
      {isLoading ? (
        <PilgrimageListSkeleton />
      ) : error ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {error}
          </p>
        </div>
      ) : filteredPilgrimages.length >
        0 ? (
        <PilgrimageList
          pilgrimages={
            filteredPilgrimages
          }
        />
      ) : (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            {activeTab ===
            "recommended"
              ? "No pilgrimage locations yet."
              : "You haven't created any pilgrimage locations yet."}
          </p>
        </div>
      )}
    </section>
  );
}