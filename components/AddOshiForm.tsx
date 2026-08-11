"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import type { Oshi } from "@/components/CreatePost/OshiPicker";

type Props = {
  onCreated: (oshi: Oshi) => void;
  onClose: () => void;
  onOpenCropper: (image: string) => void;
  croppedImage: File | null;
};

export default function AddOshiForm({
  onCreated,
  onClose,
  onOpenCropper,
  croppedImage,
}: Props) {
  const { user } = useSupabaseAuth();

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [fandom, setFandom] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSave = name.trim() !== "";

  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * Receive the cropped image from ProfilePage.
   *
   * The BottomSheet stays mounted while the cropper
   * is displayed, so all form data is preserved.
   */
  useEffect(() => {
    if (!croppedImage) return;

    setImageFile(croppedImage);

    const previewUrl = URL.createObjectURL(croppedImage);

    setImagePreview((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return previewUrl;
    });

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [croppedImage]);

  /*
   * Select an image.
   *
   * The original image is sent to ProfilePage,
   * which displays the cropper above the BottomSheet.
   */
  function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    onOpenCropper(imageUrl);

    // Allow selecting the same image again
    e.target.value = "";
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

      /*
       * Upload the cropped image.
       */
      if (imageFile) {
        const ext =
          imageFile.name.split(".").pop() || "jpg";

        const path =
          `${user.id}/oshi-${Date.now()}.${ext}`;

        const { error: uploadError } =
          await supabase.storage
            .from("avatars")
            .upload(path, imageFile, {
              cacheControl: "3600",
              upsert: false,
              contentType:
                imageFile.type || `image/${ext}`,
            });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);

        imageUrl = publicUrl;
      }

      /*
       * Create the Oshi.
       */
      const {
        data,
        error: insertError,
      } = await supabase
        .from("oshis")
        .insert({
          user_id: user.id,
          name: name.trim(),
          image_url: imageUrl,
          anniversary: anniversary || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      /*
       * Immediately update the OshiList.
       */
      onCreated({
        id: data.id,
        name: data.name,
        image:
          data.image_url ?? "/icons/temp.jpg",
      });

      /*
       * Close the BottomSheet after successfully saving.
       */
      onClose();
    } catch (err) {
      console.error(
        "Error creating oshi:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Oshi Photo */}
      <div className="flex justify-center">
        <div className="relative shrink-0">
          <div
            className="
              flex
              h-28
              w-28
              items-center
              justify-center
              overflow-hidden
              rounded-full
              bg-accent/50
            "
          >
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
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="
              absolute
              bottom-0
              right-0
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-accent-secondary
              text-white
            "
          >
            <Camera size={15} />
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
          onChange={(e) =>
            setName(e.target.value)
          }
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
          The date you started considering them
          your oshi.
        </p>

        <input
          id="oshi-anniversary"
          type="date"
          value={anniversary}
          onChange={(e) =>
            setAnniversary(e.target.value)
          }
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

      {/* Fandom */}
      <div className="space-y-2">
        <label
          htmlFor="oshi-fandom"
          className="text-sm font-semibold text-foreground"
        >
          Fandom
        </label>

        <input
          id="oshi-fandom"
          type="text"
          value={fandom}
          onChange={(e) =>
            setFandom(e.target.value)
          }
          placeholder="Enter fandom"
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

      {/* Notes */}
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
          onChange={(e) =>
            setNotes(e.target.value)
          }
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

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

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
          font-semibold
          text-foreground
          transition-opacity
          disabled:opacity-40
        "
      >
        {saving ? "Saving..." : "Add Oshi"}
      </button>
    </div>
  );
}