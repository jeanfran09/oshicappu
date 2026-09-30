"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  MapPin,
  MapPinned,
  Share2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import PilgrimagePageSkeleton from "@/components/Skeleton/PilgrimageSkeleton";

type Pilgrimage = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  fandom_id: string | null;
  fandom_name: string | null;
  created_by: string;
};

type Creator = {
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function PilgrimagePage() {
  const router = useRouter();
  const params = useParams();
  const pilgrimageId = params.id as string;

  const [pilgrimage, setPilgrimage] =
    useState<Pilgrimage | null>(null);

  const [creator, setCreator] =
    useState<Creator | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPilgrimage() {
      setIsLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("pilgrimage_locations")
        .select(
          `
          id,
          title,
          description,
          image_url,
          latitude,
          longitude,
          fandom_id,
          created_by,
          fandoms (
            id,
            name
          )
          `
        )
        .eq("id", pilgrimageId)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.error(
            "Error fetching pilgrimage:",
            error
          );
        }

        if (!cancelled) {
          setNotFound(true);
          setIsLoading(false);
        }

        return;
      }

      const fandom = Array.isArray(data.fandoms)
        ? data.fandoms[0]
        : data.fandoms;

      const { data: creatorData } =
        await supabase
          .from("profiles")
          .select(
            "username, display_name, avatar_url"
          )
          .eq("id", data.created_by)
          .maybeSingle();

      if (cancelled) return;

      setPilgrimage({
        id: data.id,
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        latitude: data.latitude,
        longitude: data.longitude,
        fandom_id: data.fandom_id,
        fandom_name: fandom?.name ?? null,
        created_by: data.created_by,
      });

      setCreator(
        creatorData ?? null
      );

      setIsLoading(false);
    }

    loadPilgrimage();

    return () => {
      cancelled = true;
    };
  }, [pilgrimageId]);

  async function handleShare() {
    const url = `${window.location.origin}/pilgrimage/${pilgrimageId}`;

    if (navigator.share) {
      await navigator.share({
        title: pilgrimage?.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function handleViewMap() {
    if (!pilgrimage) return;

    router.push(
      `/map?lat=${pilgrimage.latitude}&lng=${pilgrimage.longitude}`
    );
  }

  if (isLoading) {
    return <PilgrimagePageSkeleton />;
  }

  if (notFound || !pilgrimage) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <p className="text-sm text-foreground/40">
          This pilgrimage location couldn&apos;t be found.
        </p>

        <button
          type="button"
          onClick={() => router.push("/landmarks")}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium"
        >
          Back to Landmarks
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.push("/landmarks")}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Pilgrimage
        </h1>

        <button
          type="button"
          onClick={handleShare}
          className="ml-auto mr-3 flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Share pilgrimage"
        >
          <Share2 size={20} />
        </button>
      </header>

      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-accent">
        {pilgrimage.image_url ? (
          <Image
            src={pilgrimage.image_url}
            alt={pilgrimage.title}
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPinned
              size={40}
              className="text-foreground/30"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <main className="px-4 pb-24 pt-5">
        <h2 className="text-2xl font-bold">
          {pilgrimage.title}
        </h2>

        {/* Fandom + Map */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {pilgrimage.fandom_name && (
            <button
              type="button"
              onClick={() =>
                pilgrimage.fandom_id &&
                router.push(
                  `/fandom/${pilgrimage.fandom_id}`
                )
              }
              className="rounded-full bg-accent-secondary/70 px-3 py-1 text-xs font-semibold"
            >
              {pilgrimage.fandom_name}
            </button>
          )}

          {pilgrimage.latitude != null &&
            pilgrimage.longitude != null && (
              <button
                type="button"
                onClick={handleViewMap}
                className="flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium"
              >
                <MapPin size={12} />
                View on map
              </button>
            )}
        </div>

        {/* Location */}
        {pilgrimage.latitude != null &&
          pilgrimage.longitude != null && (
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                <MapPin size={19} />
              </div>

              <div>
                <p className="text-sm text-foreground/50">
                  Location
                </p>

                <p className="text-sm font-medium">
                  {pilgrimage.latitude.toFixed(6)},{" "}
                  {pilgrimage.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}

        {/* Description */}
        {pilgrimage.description && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold">
              About this pilgrimage
            </h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/70">
              {pilgrimage.description}
            </p>
          </section>
        )}

        {/* Creator */}
        {creator && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold">
              Added by
            </h3>

            <button
              type="button"
              onClick={() =>
                router.push(`/${creator.username}`)
              }
              className="mt-3 flex items-center gap-3 text-left"
            >
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-accent" />
              )}

              <div>
                <p className="text-sm font-semibold">
                  {creator.display_name}
                </p>

                <p className="text-xs text-foreground/50">
                  @{creator.username}
                </p>
              </div>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
