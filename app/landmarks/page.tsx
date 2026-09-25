"use client";

import { useState } from "react";
import { Map, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import EventsSection from "@/components/Landmarks/EventsSection";
import PhotoSpotsSection from "@/components/Landmarks/PhotoSpotsSection";
import PilgrimageSection from "@/components/Landmarks/PilgrimageSection";

type LandmarkTab =
  | "events"
  | "photo-spots"
  | "pilgrimage";

export default function LandmarksPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<LandmarkTab>("events");

  return (
    <main className="min-h-screen bg-background pb-20 md:hidden">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-50 bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 pb-1 pt-4">
          <h1 className="text-xl font-bold">
            Landmarks
          </h1>

          <div className="flex items-center gap-2">
            {/* Map */}
            <button
              type="button"
              onClick={() =>
                router.push("/map")
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent"
              aria-label="Open map"
            >
              <Map size={20} />
            </button>

            {/* Create Landmark */}
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/landmarks/create"
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent"
              aria-label="Create landmark"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Landmark Tabs */}
        <section className="border-b border-foreground/10 bg-background">
          <div className="flex">
            <button
              type="button"
              onClick={() =>
                setActiveTab("events")
              }
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
              onClick={() =>
                setActiveTab(
                  "photo-spots"
                )
              }
              className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                activeTab ===
                "photo-spots"
                  ? "border-accent-secondary text-foreground"
                  : "border-transparent text-foreground/40"
              }`}
            >
              Photo Spots
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "pilgrimage"
                )
              }
              className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                activeTab ===
                "pilgrimage"
                  ? "border-accent-secondary text-foreground"
                  : "border-transparent text-foreground/40"
              }`}
            >
              Pilgrimage
            </button>
          </div>
        </section>
      </div>

      {/* Section Content */}
      {activeTab === "events" && <EventsSection />}

      {activeTab === "photo-spots" && <PhotoSpotsSection />}

      {activeTab === "pilgrimage" && <PilgrimageSection />}
    </main>
  );
}