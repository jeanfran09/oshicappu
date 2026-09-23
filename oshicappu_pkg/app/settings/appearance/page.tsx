"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { useTheme } from "@/components/ThemeContext";
import {
  colorFromString,
  getAverageColorFromImage,
  normalizeHex,
} from "@/utils/color";
import BottomSheet from "@/components/BottomSheet";

const OVERRIDES_KEY = "oshicappu-oshi-colors";
const MAX_HISTORY = 8;

type Oshi = {
  id: string;
  name: string;
  image_url: string | null;
};

type OshiColorEntry = {
  color: string;
  history: string[];
};

type OverridesMap = Record<string, OshiColorEntry>;

function loadOverrides(): OverridesMap {
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Error loading saved oshi colors:", error);
    return {};
  }
}

function saveOverrides(overrides: OverridesMap) {
  try {
    window.localStorage.setItem(
      OVERRIDES_KEY,
      JSON.stringify(overrides)
    );
  } catch (error) {
    console.error("Error saving oshi colors:", error);
  }
}

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const { activeOshiId, setTheme, resetTheme } = useTheme();

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [loading, setLoading] = useState(true);

  // color + history per oshi id
  const [colors, setColors] = useState<
    Record<string, OshiColorEntry>
  >({});

  const [editingOshi, setEditingOshi] = useState<Oshi | null>(
    null
  );
  const [hexInput, setHexInput] = useState("");
  const [hexError, setHexError] = useState("");

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

  // Figure out a color for each oshi: use a saved custom color if
  // there is one, otherwise sample the image, otherwise fall back
  // to a color derived from the name.
  useEffect(() => {
    let cancelled = false;

    async function loadColors() {
      const overrides = loadOverrides();

      const entries = await Promise.all(
        oshis.map(async (oshi) => {
          const existing = overrides[oshi.id];

          if (existing) {
            return [oshi.id, existing] as const;
          }

          if (oshi.image_url) {
            try {
              const color = await getAverageColorFromImage(
                oshi.image_url
              );
              return [
                oshi.id,
                { color, history: [] },
              ] as const;
            } catch {
              // fall through to name-based color
            }
          }

          return [
            oshi.id,
            { color: colorFromString(oshi.name), history: [] },
          ] as const;
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
    const entry = colors[oshi.id];
    const color = entry?.color ?? colorFromString(oshi.name);
    setTheme(oshi.id, oshi.name, color);
  }

  function openEditor(oshi: Oshi) {
    const entry = colors[oshi.id];
    setEditingOshi(oshi);
    setHexInput(entry?.color ?? "");
    setHexError("");
  }

  function closeEditor() {
    setEditingOshi(null);
    setHexInput("");
    setHexError("");
  }

  function applyColor(rawHex: string) {
    if (!editingOshi) return;

    const normalized = normalizeHex(rawHex);

    if (!normalized) {
      setHexError("Enter a valid hex code, e.g. #A7C4AD");
      return;
    }

    const previous = colors[editingOshi.id];

    const history = [...(previous?.history ?? [])];

    // Record the color we're moving away from, most recent
    // first, without duplicates.
    if (previous && previous.color !== normalized) {
      const withoutDupe = history.filter(
        (h) => h !== previous.color
      );
      withoutDupe.unshift(previous.color);
      history.splice(
        0,
        history.length,
        ...withoutDupe.slice(0, MAX_HISTORY)
      );
    }

    const nextEntry: OshiColorEntry = {
      color: normalized,
      history,
    };

    const nextColors = {
      ...colors,
      [editingOshi.id]: nextEntry,
    };

    setColors(nextColors);

    const overrides = loadOverrides();
    overrides[editingOshi.id] = nextEntry;
    saveOverrides(overrides);

    // If this oshi's theme is currently applied, refresh it live.
    if (activeOshiId === editingOshi.id) {
      setTheme(editingOshi.id, editingOshi.name, normalized);
    }

    closeEditor();
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
          color from their picture, or you can set your own.
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
            const entry = colors[oshi.id];
            const selected = activeOshiId === oshi.id;

            return (
              <div
                key={oshi.id}
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
                "
              >
                <button
                  type="button"
                  onClick={() => handleSelectOshi(oshi)}
                  className="flex flex-1 items-center gap-3 text-left"
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

                  <div className="flex-1">
                    <p className="text-base font-medium">
                      {oshi.name}
                    </p>

                    {entry && (
                      <p className="text-xs uppercase text-foreground/50">
                        {entry.color}
                      </p>
                    )}
                  </div>

                  <div
                    className="h-5 w-5 shrink-0 rounded-full border border-foreground/10"
                    style={{
                      backgroundColor:
                        entry?.color ?? "#e5e5e5",
                    }}
                  />

                  {selected && (
                    <Check size={18} className="ml-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openEditor(oshi)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/60"
                  aria-label={`Edit color for ${oshi.name}`}
                >
                  <Pencil size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editingOshi && (
        <BottomSheet
          title={`${editingOshi.name}'s color`}
          onClose={closeEditor}
          size="small"
        >
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-full border border-foreground/10"
                style={{
                  backgroundColor:
                    normalizeHex(hexInput) ??
                    colors[editingOshi.id]?.color ??
                    "#e5e5e5",
                }}
              />

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-foreground/50">
                  Hex code
                </label>

                <input
                  value={hexInput}
                  onChange={(e) => {
                    setHexInput(e.target.value);
                    setHexError("");
                  }}
                  placeholder="#A7C4AD"
                  className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-base outline-none"
                />
              </div>
            </div>

            {hexError && (
              <p className="text-sm text-red-500">
                {hexError}
              </p>
            )}

            {(colors[editingOshi.id]?.history?.length ?? 0) >
              0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-foreground/50">
                  Previously used
                </p>

                <div className="flex flex-wrap gap-2">
                  {colors[editingOshi.id]!.history.map(
                    (hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setHexInput(hex);
                          setHexError("");
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-foreground/10 py-1 pl-1 pr-2.5"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-foreground/10"
                          style={{
                            backgroundColor: hex,
                          }}
                        />

                        <span className="text-xs uppercase text-foreground/60">
                          {hex}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="flex-1 h-11 rounded-xl border border-foreground/20 font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => applyColor(hexInput)}
                className="flex-1 h-11 rounded-xl bg-accent font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
