"use client";

import { useRef, useState } from "react";
import { Camera, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import type { Oshi } from "@/components/CreatePost/OshiPicker";

type Props = {
  onCreated: (oshi: Oshi) => void;
  onClose: () => void;
};

export default function AddOshiForm({ onCreated, onClose }: Props) {
  const { user } = useSupabaseAuth();

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canSave = name.trim() !== "";

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;

    if (!name.trim()) {
      setError("Give your oshi a name");
      return;
    }

    setError("");
    setSaving(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/oshi-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || `image/${ext}`,
          });

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        imageUrl = publicUrl;
      }

      const { data, error: insertError } = await supabase
        .from("oshis")
        .insert({
          user_id: user.id,
          name: name.trim(),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      onCreated({
        id: data.id,
        name: data.name,
        image: data.image_url ?? "/icons/temp.jpg",
      });

      onClose();
    } catch (err) {
      console.error("Error creating oshi:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Oshi Photo */}
      <div className="flex justify-center">
        <div className="relative shrink-0">
          <div className="flex h-30 w-30 items-center justify-center overflow-hidden rounded-full bg-accent/50">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Oshi preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon
                size={32}
                className="text-foreground/30"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="
              absolute
              bottom-0
              right-0
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              bg-accent-secondary
              text-white
            "
          >
            <Camera size={14} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label
          htmlFor="oshi-name"
          className="text-sm font-semibold text-foreground"
        >
          Name
        </label>

        <input
          id="oshi-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          className="
            h-11
            w-full
            rounded-xl
            border
            border-foreground/10
            bg-accent/10
            px-4
            outline-none
            focus:border-accent
          "
        />
      </div>

      {/* Oshi Anniversary */}
      <div className="space-y-2">
        <label
          htmlFor="oshi-anniversary"
          className="text-sm font-semibold text-foreground"
        >
          Oshi Anniversary
        </label>

        <p className="text-xs text-foreground/60">
          The date you started considering them your oshi.
        </p>

        <input
          id="oshi-anniversary"
          type="date"
          value={anniversary}
          onChange={(e) => setAnniversary(e.target.value)}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-foreground/10
            bg-accent/10
            px-4
            outline-none
            focus:border-accent
          "
        />
      </div>

      {/* Notes / Bio */}
      <div className="space-y-2">
        <label
          htmlFor="oshi-notes"
          className="text-sm font-semibold text-foreground"
        >
          Notes
        </label>

        <textarea
          id="oshi-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write something about your oshi..."
          rows={4}
          className="
            w-full
            resize-none
            rounded-xl
            border
            border-foreground/10
            bg-accent/10
            px-4
            py-3
            outline-none
            focus:border-accent
          "
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || saving}
        className="
          h-11
          w-full
          rounded-xl
          bg-accent-secondary
          font-medium
          text-foreground
          font-semibold
          transition-opacity
          disabled:opacity-40
        "
      >
        {saving ? "Saving..." : "Add Oshi"}
      </button>
    </div>
  );
}