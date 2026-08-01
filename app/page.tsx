"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FollowingFeed from "@/components/FollowingFeed";
import ForYouFeed from "@/components/ForYouFeed";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import Divider from "@/components/Divider"
import PullToRefresh from "@/components/PullToRefresh";
import CreatePostButton from "@/components/CreatePostButton";

async function refreshFeed() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // fetch posts here
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">("foryou");
  const { isLoggedIn, isLoading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <main className="pb-4 flex items-center justify-center min-h-screen">
        <p className="text-foreground">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <main className="pb-4">
      {/* Logo */}
      <h1 className="font-sacramento text-4xl text-center p-4 text-foreground">
        OshiCappu
      </h1>

      {/* Following / For You Tabs */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex">
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 relative ${
              activeTab === "following"
                ? "font-bold text-foreground text-xl"
                : "font-bold text-foreground/50 text-xl"
            }`}
          >
            Following

            {activeTab === "following" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-secondary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("foryou")}
            className={`flex-1 py-3 relative ${
              activeTab === "foryou"
                ? "font-bold text-foreground text-xl"
                : "font-bold text-foreground/50 text-xl"
            }`}
          >
            For You

            {activeTab === "foryou" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-secondary rounded-full" />
            )}
          </button>
        </div>

        <Divider/>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        <PullToRefresh onRefresh={refreshFeed}>
          <div className="min-h-[625px]">
            {activeTab === "following" ? (
              <FollowingFeed />
            ) : (
              <ForYouFeed />
            )}
          </div>
        </PullToRefresh>
      </div>
      
      <CreatePostButton />
    </main>
  );
}
