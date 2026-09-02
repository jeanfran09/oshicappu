"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronLeft, User as UserIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { useTheme } from "@/components/ThemeContext";
import {
  colorFromString,
  getAverageColorFromImage,
} from "@/utils/color";

type Oshi = {
  id: string;
  name: string;
  image_url: string | null;
};

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const { activeOshiId, setTheme, resetTheme } = useTheme();

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [loading, setLoading] = useState(true);

  // color per oshi id, filled in as each one is sampled
  const [colors, setColors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchOshis() {
      setLoading(true);

      const { data, error } = await supabase
        .from("oshis")
        .select("id, name, image_url")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Error fetching oshis:", error);
        setOshis([]);
      } else {
        setOshis(data ?? []);
      }

      setLoading(false);
    }

    fetchOshis();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Figure out a color for each oshi: sample the image if there
  // is one, otherwise fall back to a color derived from the name.
  useEffect(() => {
    let cancelled = false;

    async function loadColors() {
      const entries = await Promise.all(
        oshis.map(async (oshi) => {
          if (oshi.image_url) {
            try {
              const color = await getAverageColorFromImage(
                oshi.image_url
              );
              return [oshi.id, color] as const;
            } catch {
              // fall through to name-based color
            }
          }

          return [oshi.id, colorFromString(oshi.name)] as const;
        })
      );

      if (!cancelled) {
        setColors(Object.fromEntries(entries));
      }
    }

    if (oshis.length > 0) {
      loadColors();
    }

    return () => {
      cancelled = true;
    };
  }, [oshis]);

  function handleSelectOshi(oshi: Oshi) {
    const color = colors[oshi.id] ?? colorFromString(oshi.name);
    setTheme(oshi.id, oshi.name, color);
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Appearance
        </h1>
      </header>

      <div className="px-4 pt-4 pb-8">
        <p className="text-sm text-foreground/60">
          Theme the app around one of your oshis. We'll pull a
          color from their picture and use it for the background
          and accents.
        </p>

        {/* Default option */}
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={resetTheme}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-foreground/10
              px-3
              py-3
              text-left
            "
          >
            <div className="h-9 w-9 shrink-0 rounded-full border border-foreground/10 bg-[#C8E1CC]" />

            <span className="flex-1 text-base font-medium">
              Default
            </span>

            {activeOshiId === null && (
              <Check size={18} />
            )}
          </button>

          {loading && (
            <p className="py-6 text-center text-sm text-foreground/40">
              Loading your oshis...
            </p>
          )}

          {!loading && oshis.length === 0 && (
            <p className="py-6 text-center text-sm text-foreground/40">
              Add an oshi first to theme the app around them.
            </p>
          )}

          {oshis.map((oshi) => {
            const swatch = colors[oshi.id];
            const selected = activeOshiId === oshi.id;

            return (
              <button
                key={oshi.id}
                type="button"
                onClick={() => handleSelectOshi(oshi)}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-foreground/10
                  px-3
                  py-3
                  text-left
                "
              >
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-accent">
                  {oshi.image_url ? (
                    <Image
                      src={oshi.image_url}
                      alt={oshi.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon
                        size={18}
                        className="text-foreground/30"
                      />
                    </div>
                  )}
                </div>

                <span className="flex-1 text-base font-medium">
                  {oshi.name}
                </span>

                <div
                  className="h-5 w-5 shrink-0 rounded-full border border-foreground/10"
                  style={{
                    backgroundColor: swatch ?? "#e5e5e5",
                  }}
                />

                {selected && <Check size={18} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
