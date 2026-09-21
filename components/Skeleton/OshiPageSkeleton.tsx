"use client";

import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OshiPageSkeleton() {
  const router = useRouter();

  return (
    <main className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-foreground/10 bg-background animate-pulse">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Title */}
        <h1 className="text-lg font-semibold">
          oshi
        </h1>


        {/* Edit button */}
        <div className="h-9 w-9" />
      </header>

      {/* Profile */}
      <section className="flex flex-col items-center px-4 pt-4 text-center animate-pulse">
        {/* Oshi Image */}
        <div className="h-40 w-40 shrink-0 rounded-full bg-foreground/10" />

        {/* Oshi Name */}
        <div className="pt-2">
          <h2 className="text-2xl font-bold">
            oshi
          </h2>
        </div>
      </section>

      {/* Posts */}
      <section className="mt-3">
        <div className="border-b border-foreground/10 px-4 pb-3">
          <h2 className="font-semibold">
            Album
          </h2>
        </div>

        <PostGridSkeleton />
      </section>
    </main>
  );
}