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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-accent/10 p-4">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full truncate bg-transparent text-2xl font-semibold outline-none placeholder:text-foreground/30"
          />
          <p className="mt-1 text-xs text-foreground/40">
            Your oshi&apos;s name
          </p>
        </div>

        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent/20">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Oshi preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon size={24} className="text-foreground/30" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-secondary text-white"
          >
            <Camera size={12} />
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="h-10 w-full rounded-lg bg-accent-secondary font-medium text-white disabled:opacity-40"
      >
        {saving ? "Saving..." : "Add Oshi"}
      </button>
    </div>
  );
}