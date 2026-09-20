"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  User as UserIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

type EditOshi = {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  anniversary: string | null;
  notes: string | null;
  fandom: string | null;
};

type Props = {
  oshi: EditOshi;
  onUpdated: (oshi: EditOshi) => void;
  onDeleted: (oshiId: string) => void;
  onClose: () => void;
  onOpenCropper: (image: string) => void;
  croppedImage: File | null;
};

export default function EditOshiForm({
  oshi,
  onUpdated,
  onDeleted,
  onClose,
  onOpenCropper,
  croppedImage,
}: Props) {
  const { user } = useSupabaseAuth();

  const [name, setName] = useState(
    oshi.name ?? ""
  );

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(
      oshi.image_url ?? null
    );

  const [anniversary, setAnniversary] =
    useState(
      oshi.anniversary ?? ""
    );

  const [notes, setNotes] = useState(
    oshi.notes ?? ""
  );

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const canSave =
    name.trim() !== "";

  /*
   * Receive cropped image from OshiPage.
   */
  useEffect(() => {
    if (!croppedImage) return;

    setImageFile(croppedImage);

    const previewUrl =
      URL.createObjectURL(
        croppedImage
      );

    setImagePreview((previousUrl) => {
      if (
        previousUrl &&
        previousUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previousUrl
        );
      }

      return previewUrl;
    });

    return () => {
      URL.revokeObjectURL(
        previewUrl
      );
    };
  }, [croppedImage]);

  /*
   * Select a new image.
   */
  function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const imageUrl =
      URL.createObjectURL(file);

    onOpenCropper(imageUrl);

    // Allow selecting the same image again.
    e.target.value = "";
  }

  /*
   * Save changes.
   */
  async function handleSave() {
    if (!user) return;

    if (!name.trim()) {
      setError(
        "Give your oshi a name"
      );
      return;
    }

    setError("");
    setSaving(true);

    try {
      let imageUrl =
        oshi.image_url;

      /*
       * Upload new image only
       * when one was selected.
       */
      if (imageFile) {
        const ext =
          imageFile.name
            .split(".")
            .pop() || "jpg";

        const path =
          `${user.id}/oshi-${Date.now()}.${ext}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("avatars")
          .upload(
            path,
            imageFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                imageFile.type ||
                `image/${ext}`,
            }
          );

        if (uploadError) {
          throw new Error(
            uploadError.message
          );
        }

        const {
          data: {
            publicUrl,
          },
        } =
          supabase.storage
            .from("avatars")
            .getPublicUrl(path);

        imageUrl = publicUrl;
      }

      /*
       * Update Oshi.
       */
      const {
        data,
        error: updateError,
      } = await supabase
        .from("oshis")
        .update({
          name: name.trim(),
          image_url: imageUrl,
          anniversary:
            anniversary || null,
          notes:
            notes.trim() || null,
        })
        .eq("id", oshi.id)
        .eq(
          "user_id",
          user.id
        )
        .select()
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      /*
       * Immediately update OshiPage.
       */
      onUpdated({
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        image_url:
          data.image_url,
        anniversary:
          data.anniversary,
        notes: data.notes,
        fandom:
          data.fandom ?? null,
      });

      onClose();
    } catch (err) {
      console.error(
        "Error updating oshi:",
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

  /*
   * Delete Oshi.
   */
  async function handleDelete() {
    if (!user) return;

    setError("");
    setDeleting(true);

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("oshis")
        .delete()
        .eq("id", oshi.id)
        .eq(
          "user_id",
          user.id
        );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      onDeleted(oshi.id);
      onClose();
    } catch (err) {
      console.error(
        "Error deleting oshi:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
    } finally {
      setDeleting(false);
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
              bg-accent
            "
            aria-label="Change Oshi photo"
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
          htmlFor="edit-oshi-name"
          className="text-sm font-semibold text-foreground"
        >
          Name
        </label>

        <input
          id="edit-oshi-name"
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
            text-base
            outline-none
            focus:border-accent
          "
        />
      </div>

      {/* Anniversary */}
      <div className="space-y-2">
        <label
          htmlFor="edit-oshi-anniversary"
          className="text-sm font-semibold text-foreground"
        >
          Oshi Anniversary
        </label>

        <p className="text-xs text-foreground/60">
          The date they became your oshi.
        </p>

        <input
          id="edit-oshi-anniversary"
          type="date"
          value={anniversary}
          onChange={(e) =>
            setAnniversary(
              e.target.value
            )
          }
          className="
            h-11
            w-full
            rounded-xl
            border
            border-foreground/10
            bg-accent/10
            px-4
            text-base
            outline-none
            focus:border-accent
          "
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label
          htmlFor="edit-oshi-notes"
          className="text-sm font-semibold text-foreground"
        >
          Notes
        </label>

        <textarea
          id="edit-oshi-notes"
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
            text-base
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
        disabled={
          !canSave ||
          saving ||
          deleting
        }
        className="
          h-11
          w-full
          rounded-xl
          bg-accent
          font-semibold
          text-foreground
          transition-opacity
          disabled:opacity-40
        "
      >
        {saving
          ? "Saving..."
          : "Save Changes"}
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={
          saving ||
          deleting
        }
        className="
          h-11
          w-full
          rounded-xl
          border
          border-red-500/30
          font-semibold
          text-red-500
          transition-opacity
          disabled:opacity-40
        "
      >
        {deleting
          ? "Deleting..."
          : "Delete Oshi"}
      </button>

    </div>
  );
}