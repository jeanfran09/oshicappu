"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";

export default function HashtagPageSkeleton() {
  const router = useRouter();

  return (
    <main className="md:hidden min-h-screen bg-background">
      {/* Header */}
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
            #hashtag
        </h1>
      </header>

      {/* Hashtag Information */}
      <section className="px-4 py-5">
        <h2 className="text-2xl font-bold">
          #hashtag
        </h2>

        <p className="mt-1 text-sm text-foreground/60">
          0 posts
        </p>
      </section>

      {/* Posts */}
      <PostGridSkeleton />
    </main>
  );
}