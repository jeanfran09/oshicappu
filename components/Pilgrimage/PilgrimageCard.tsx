"use client";

import { useRouter } from "next/navigation";
import {
  MapPin,
  MapPinned,
  Share2,
} from "lucide-react";

export type Pilgrimage = {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  latitude: number;
  longitude: number;
  fandomId?: string | null;
  fandomName?: string | null;
  yourPilgrimage?: boolean;
};

type PilgrimageCardProps = {
  pilgrimage: Pilgrimage;
};

export default function PilgrimageCard({
  pilgrimage,
}: PilgrimageCardProps) {
  const router = useRouter();

  const handleShare = async () => {
    const url = `${window.location.origin}/pilgrimage/${pilgrimage.id}`;

    if (navigator.share) {
      await navigator.share({
        title: pilgrimage.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-foreground/10 bg-accent/10">
      {/* Clickable Pilgrimage Content */}
      <button
        type="button"
        onClick={() =>
          router.push(
            `/pilgrimage/${pilgrimage.id}`
          )
        }
        className="w-full text-left"
      >
        {/* Photo */}
        <div className="relative h-40 w-full bg-accent/20">
          {pilgrimage.image ? (
            <img
              src={pilgrimage.image}
              alt={pilgrimage.title}
              className="h-full w-full object-cover"
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

        {/* Pilgrimage Information */}
        <div className="p-4">
          <h3 className="truncate text-base font-semibold">
            {pilgrimage.title}
          </h3>

          {/* Fandom */}
          {pilgrimage.fandomName && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();

                if (
                  pilgrimage.fandomId
                ) {
                  router.push(
                    `/fandom/${pilgrimage.fandomId}`
                  );
                }
              }}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" ||
                    e.key === " ") &&
                  pilgrimage.fandomId
                ) {
                  e.preventDefault();
                  e.stopPropagation();

                  router.push(
                    `/fandom/${pilgrimage.fandomId}`
                  );
                }
              }}
              className="mt-1.5 inline-block rounded-full bg-accent-secondary/70 px-2.5 py-1 text-xs font-medium"
            >
              {pilgrimage.fandomName}
            </span>
          )}

          {/* Description */}
          {pilgrimage.description && (
            <p className="mt-2 line-clamp-2 text-sm text-foreground/60">
              {pilgrimage.description}
            </p>
          )}

          {/* Coordinates */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-foreground/60">
            <MapPin
              size={15}
              className="shrink-0"
            />

            <span className="truncate">
              {pilgrimage.latitude.toFixed(
                5
              )}
              ,{" "}
              {pilgrimage.longitude.toFixed(
                5
              )}
            </span>
          </div>
        </div>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {/* View Location */}
        <button
          type="button"
          onClick={() =>
            router.push(
              `/pilgrimage/${pilgrimage.id}`
            )
          }
          className="flex-1 rounded-full bg-accent py-2.5 text-sm font-medium"
        >
          View Location
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5"
          aria-label="Share pilgrimage location"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}