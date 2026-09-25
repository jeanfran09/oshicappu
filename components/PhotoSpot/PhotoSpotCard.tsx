"use client";

import { useRouter } from "next/navigation";
import {
  Camera,
  MapPin,
  Share2,
} from "lucide-react";

export type PhotoSpot = {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  latitude: number;
  longitude: number;
  fandomId?: string | null;
  fandomName?: string | null;
  yourSpot?: boolean;
};

type PhotoSpotCardProps = {
  photoSpot: PhotoSpot;
};

export default function PhotoSpotCard({
  photoSpot,
}: PhotoSpotCardProps) {
  const router = useRouter();

  const handleShare = async () => {
    const url = `${window.location.origin}/photo-spot/${photoSpot.id}`;

    if (navigator.share) {
      await navigator.share({
        title: photoSpot.title,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-foreground/10 bg-accent/10">
      {/* Clickable Photo Spot Content */}
      <button
        type="button"
        onClick={() =>
          router.push(`/photo-spot/${photoSpot.id}`)
        }
        className="w-full text-left"
      >
        {/* Photo */}
        <div className="relative h-40 w-full bg-accent/20">
          {photoSpot.image ? (
            <img
              src={photoSpot.image}
              alt={photoSpot.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera
                size={40}
                className="text-foreground/30"
              />
            </div>
          )}
        </div>

        {/* Photo Spot Information */}
        <div className="p-4">
          <h3 className="truncate text-base font-semibold">
            {photoSpot.title}
          </h3>

          {/* Fandom */}
          {photoSpot.fandomName && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();

                if (photoSpot.fandomId) {
                  router.push(
                    `/fandom/${photoSpot.fandomId}`
                  );
                }
              }}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" ||
                    e.key === " ") &&
                  photoSpot.fandomId
                ) {
                  e.preventDefault();
                  e.stopPropagation();

                  router.push(
                    `/fandom/${photoSpot.fandomId}`
                  );
                }
              }}
              className="mt-1.5 inline-block rounded-full bg-accent-secondary/70 px-2.5 py-1 text-xs font-medium"
            >
              {photoSpot.fandomName}
            </span>
          )}

          {/* Description */}
          {photoSpot.description && (
            <p className="mt-2 line-clamp-2 text-sm text-foreground/60">
              {photoSpot.description}
            </p>
          )}

          {/* Coordinates */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-foreground/60">
            <MapPin
              size={15}
              className="shrink-0"
            />

            <span className="truncate">
              {photoSpot.latitude.toFixed(5)},{" "}
              {photoSpot.longitude.toFixed(5)}
            </span>
          </div>
        </div>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {/* View Spot */}
        <button
          type="button"
          onClick={() =>
            router.push(
              `/photo-spot/${photoSpot.id}`
            )
          }
          className="flex-1 rounded-full bg-accent py-2.5 text-sm font-medium"
        >
          View Spot
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5"
          aria-label="Share photo spot"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}