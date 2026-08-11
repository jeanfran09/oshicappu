"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Camera, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { motion } from "framer-motion";

type Props = {
  onClose: () => void;
};

export default function EditProfileModal({ onClose }: Props) {
  const { user, profile, refreshProfile } = useSupabaseAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url ?? null
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    profile?.banner_url ?? null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File, kind: "avatar" | "banner") {
    if (!user) throw new Error("Not logged in");

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || `image/${ext}`,
      });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    return publicUrl;
  }

  async function handleSave() {
    if (!user) return;

    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username can't be empty");
      return;
    }

    setError("");
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url ?? null;
      let bannerUrl = profile?.banner_url ?? null;

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, "avatar");
      }

      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, "banner");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await refreshProfile();
      onClose();
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
      className="fixed inset-0 z-[999] flex flex-col bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-foreground/10 bg-background px-3 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ArrowLeft size={22} />
          </button>

          <p className="font-semibold">Edit Profile</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-accent-secondary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div className="relative h-36 w-full bg-accent/20">
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerPreview}
              alt="Banner preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-accent/40 to-accent-secondary/30" />
          )}

          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white"
          >
            <Camera size={14} />
            Change banner
          </button>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerSelect}
          />

          {/* Avatar, overlapping the bottom of the banner */}
          <div className="absolute -bottom-10 left-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-accent/20">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon size={32} className="text-foreground/20" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-secondary text-white"
            >
              <Camera size={13} />
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
        </div>

        {/* Form fields */}
        <div className="mt-14 space-y-4 px-4 pb-8">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Username
            </label>
            <div className="flex items-center rounded-lg border border-foreground/20">
              <span className="pl-3 text-sm text-foreground/40">@</span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.replace(/\s/g, "").toLowerCase()
                  )
                }
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={150}
              className="w-full resize-none rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none"
              placeholder="Tell people about yourself..."
            />
            <p className="mt-1 text-right text-xs text-foreground/40">
              {bio.length}/150
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}