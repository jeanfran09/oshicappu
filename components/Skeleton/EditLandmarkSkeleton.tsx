
"use client";

import {
  MapPinned,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type EditLandmarkSkeletonProps = {
  type: "photo_spot" | "pilgrimage";
};

export default function EditLandmarkSkeleton({
  type,
}: EditLandmarkSkeletonProps) {
  const router = useRouter();

  const title =
    type === "photo_spot"
      ? "Edit Photo Spot"
      : "Edit Pilgrimage";

  return (
    <div className="md:hidden min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/30 bg-background px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold">{title}</h1>

        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
          aria-label="Go back"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 animate-pulse">
        <div className="mt-4 space-y-4">
          {/* Image */}
          <div className="aspect-video w-full rounded-xl bg-foreground/10" />

          {/* Name */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10" />
            <div className="h-12 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10" />
            <div className="h-28 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-foreground/10" />

            <div className="flex gap-2">
              <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl bg-foreground/5 px-4"/>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent"/>
            </div>
          </div>

          {/* Map */}
          <div className="space-y-3 rounded-xl bg-foreground/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-foreground/10" />
                <div className="h-3 w-44 max-w-full rounded bg-foreground/10" />
              </div>

              <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent px-3">
                <MapPinned
                  size={14}
                  className="text-foreground/20"
                />
                <div className="h-3 w-16 rounded bg-foreground/10" />
              </div>
            </div>

            <div className="h-[220px] w-full rounded-lg bg-foreground/10" />
          </div>
        </div>
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/30 bg-background p-4">
        <div className="h-12 w-full rounded-full bg-accent-secondary" />
      </div>
    </div>
  );
}
