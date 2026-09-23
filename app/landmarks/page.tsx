"use client";

import { useState } from "react";
import { Map, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import EventsSection from "@/components/Landmarks/EventsSection";

type LandmarkTab = "events" | "photo-spots" | "pilgrimage";

export default function LandmarksPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<LandmarkTab>("events");

  return (
    <main className="min-h-screen bg-background pb-20 md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-foreground/10 bg-background px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">
          Landmarks
        </h1>

        <div className="flex items-center gap-2">
          {/* Map */}
          <button
            type="button"
            onClick={() => router.push("/map")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent"
            aria-label="Open map"
          >
            <Map size={20} />
          </button>

          {/* Create Event */}
          <button
            type="button"
            onClick={() => router.push("/landmarks/create")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent"
            aria-label="Create event"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Landmark Tabs */}
      <section className="border-b border-foreground/10">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "events"
                ? "border-accent-secondary text-foreground"
                : "border-transparent text-foreground/40"
            }`}
          >
            Events
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo-spots")}
            className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "photo-spots"
                ? "border-accent-secondary text-foreground"
                : "border-transparent text-foreground/40"
            }`}
          >
            Photo Spots
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pilgrimage")}
            className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "pilgrimage"
                ? "border-accent-secondary text-foreground"
                : "border-transparent text-foreground/40"
            }`}
          >
            Pilgrimage
          </button>
        </div>
      </section>

      {/* Section Content */}
      {activeTab === "events" && <EventsSection />}

      {activeTab === "photo-spots" && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            Photo spots coming soon.
          </p>
        </div>
      )}

      {activeTab === "pilgrimage" && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-foreground/40">
            Pilgrimage coming soon.
          </p>
        </div>
      )}
    </main>
  );
}