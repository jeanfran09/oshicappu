"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditPostSkeleton() {
  const router = useRouter();

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/30 bg-background px-4 pb-3 pt-4">
        <h1 className="text-xl font-bold">
          Edit Post
        </h1>

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
        <div className="mt-4">
          {/* Main Image */}
          <div className="mb-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-foreground/10" />
          </div>

          {/* Caption */}
          <div className="mb-5 space-y-2">
            <div className="h-4 w-20 rounded bg-foreground/10" />
            <div className="h-24 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Location */}
          <div className="mb-5 space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10" />
            <div className="h-11 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Hashtags */}
          <div className="mb-5 space-y-2">
            <div className="h-4 w-24 rounded bg-foreground/10" />
            <div className="h-11 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Fandoms */}
          <div className="mb-5 space-y-2">
            <div className="h-4 w-20 rounded bg-foreground/10" />
            <div className="h-11 w-full rounded-xl bg-foreground/5" />
          </div>

          {/* Oshis */}
          <div className="mb-5 space-y-3">
            <div className="h-4 w-16 rounded bg-foreground/10" />

            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex shrink-0 flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full bg-foreground/10" />
                  <div className="h-3 w-12 rounded bg-foreground/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/30 bg-background p-4">
        <div className="h-12 w-full rounded-full bg-foreground/10" />
      </div>
    </div>
  );
}