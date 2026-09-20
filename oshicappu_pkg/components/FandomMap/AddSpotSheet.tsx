"use client";

import { useEffect, useState } from "react";
import { Camera, MapPin } from "lucide-react";

import BottomSheet from "@/components/BottomSheet";
import { supabase } from "@/lib/supabase";
import { findOrCreateFandom } from "@/utils/findOrCreateFandom";

type SpotKind = "photo_spot" | "pilgrimage";

type AddSpotSheetProps = {
  kind: SpotKind;
  userId: string;
  initialLat: number | null;
  initialLng: number | null;
  onClose: () => void;
  onCreated: () => void;
};

const TABLE_BY_KIND: Record<SpotKind, "photo_spots" | "pilgrimage_locations"> = {
  photo_spot: "photo_spots",
  pilgrimage: "pilgrimage_locations",
};

export default function AddSpotSheet({
  kind,
  userId,
  initialLat,
  initialLng,
  onClose,
  onCreated,
}: AddSpotSheetProps) {
  const [title, setTitle] = useState("");
  const [fandom, setFandom] = useState("");
  const [fandomOptions, setFandomOptions] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFandoms() {
      const { data } = await supabase
        .from("fandoms")
        .select("name")
        .order("name", { ascending: true });

      setFandomOptions((data ?? []).map((f) => f.name));
    }

    loadFandoms();
  }, []);

  const label =
    kind === "photo_spot" ? "photo spot" : "pilgrimage location";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Give this spot a name.");
      return;
    }

    if (initialLat === null || initialLng === null) {
      setError("Tap on the map to place this spot first.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${userId}/${kind}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("fandom-locations")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || `image/${ext}`,
          });

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("fandom-locations")
          .getPublicUrl(path);

        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from(TABLE_BY_KIND[kind])
        .insert({
          created_by: userId,
          title: title.trim(),
          fandom_id: await findOrCreateFandom(fandom),
          description: description.trim() || null,
          latitude: initialLat,
          longitude: initialLng,
          image_url: imageUrl,
        });

      if (insertError) throw new Error(insertError.message);

      onCreated();
    } catch (err) {
      console.error(`Error creating ${label}:`, err);

      setError(
        err instanceof Error
          ? err.message
          : `Couldn't save this ${label}. Try again.`
      );

      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      title={
        kind === "photo_spot" ? "Add a photo spot" : "Save a pilgrimage spot"
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6 pt-2">
        <label className="flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-foreground/25 bg-accent/20">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Spot preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-foreground/50">
              <Camera size={28} />
              <span className="text-sm">Add a photo</span>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }

              e.target.value = "";
            }}
          />
        </label>

        <div className="space-y-2">
          <label htmlFor="spot-title" className="text-sm font-semibold">
            Name
          </label>

          <input
            id="spot-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "photo_spot"
                ? "e.g. Mural wall by the station"
                : "e.g. Cafe from the drama filming site"
            }
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="spot-fandom" className="text-sm font-semibold">
            Fandom
          </label>

          <input
            id="spot-fandom"
            type="text"
            list="fandom-options"
            value={fandom}
            onChange={(e) => setFandom(e.target.value)}
            placeholder="e.g. Hatsune Miku, BTS, Sanrio..."
            className="w-full rounded-xl border border-foreground/25 bg-transparent px-4 py-3 text-base outline-none focus:border-accent"
          />

          <datalist id="fandom-options">
            {fandomOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label htmlFor="spot-description" className="text-sm font-semibold">
            Notes
          </label>

          <textarea
            id="spot-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={
              kind === "photo_spot"
                ? "Best angle, lighting tips, what to bring..."
                : "Why this place matters, what to look for..."
            }
            className="w-full resize-none rounded-xl border border-foreground/25 bg-transparent p-4 text-base outline-none focus:border-accent"
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-foreground/50">
          <MapPin size={14} />
          {initialLat !== null && initialLng !== null
            ? "Using the spot you placed on the map."
            : "Tap the map to place this spot, then come back here."}
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent-secondary font-semibold text-foreground disabled:opacity-60"
        >
          {submitting ? "Saving..." : `Save ${label}`}
        </button>
      </form>
    </BottomSheet>
  );
}
