"use client";

import FollowingFeed from "@/components/FollowingFeed";
import ForYouFeed from "@/components/ForYouFeed";
import { useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">("foryou");

  return (
    <main className="pb-4">
      {/* Logo */}
      <h1 className="font-sacramento text-4xl text-center p-4 text-foreground">
        OshiCappu
      </h1>

      {/* Following / For You Tabs */}
      <div className="flex">
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-3 relative ${
            activeTab === "following"
              ? "font-bold text-foreground"
              : "font-bold text-foreground/50"
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
              ? "font-bold text-foreground"
              : "font-bold text-foreground/50"
          }`}
        >
          For You

          {activeTab === "foryou" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-secondary rounded-full" />
          )}
        </button>
      </div>

      <hr className="h-[0.5px] bg-foreground/50 border-0"/>

      {/* Feed */}
      {activeTab === "following" ? (
        <FollowingFeed/>
      ) : (
        <ForYouFeed/>
      )}
    </main>
  );
}