"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import ImagePreview from "@/components/CreatePost/ImagePreview";
import ThumbnailStrip from "@/components/CreatePost/ThumbnailStrip";
import CaptionInput from "@/components/CreatePost/CaptionInput";
import LocationInput from "@/components/CreatePost/LocationInput";
import PostButton from "@/components/CreatePost/PostButton";
import ImageCropper from "@/components/CreatePost/ImageCropper";
import TagInput from "@/components/CreatePost/TagInput";
import OshiPicker, {
  type Oshi,
} from "@/components/CreatePost/OshiPicker";
import AddOshiForm from "@/components/AddOshiForm";
import BottomSheet from "@/components/BottomSheet";

type CropData = {
  crop: {
    x: number;
    y: number;
  };
  zoom: number;
};

export default function CreatePostPage() {
  const MAX_IMAGES = 10;

  const [images, setImages] = useState<File[]>([]);
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [cropImage, setCropImage] = useState<string | null>(null);

  // Final image array index
  const [cropIndex, setCropIndex] = useState(0);

  // Upload queue index
  const [pendingIndex, setPendingIndex] = useState(0);

  const [aspectRatio, setAspectRatio] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [hashtags, setHashtags] = useState<string[]>([]);
  const [fandoms, setFandoms] = useState<string[]>([]);
  const [location, setLocation] = useState("");

  const [selectedOshis, setSelectedOshis] = useState<string[]>([]);

  const [showBottomSheet, setShowBottomSheet] =
    useState(false);

  const [oshis, setOshis] = useState<Oshi[]>([]);
  const [oshisLoading, setOshisLoading] = useState(true);

  /*
   * Add Oshi cropper state
   */
  const [showOshiCropper, setShowOshiCropper] =
    useState(false);

  const [oshiCropImage, setOshiCropImage] =
    useState<string | null>(null);

  const [croppedOshiImage, setCroppedOshiImage] =
    useState<File | null>(null);

  const {
    user,
    isLoggedIn,
    isLoading,
  } = useSupabaseAuth();

  const router = useRouter();

  /*
   * Fetch user's oshis
   */
  useEffect(() => {
    if (!user) return;

    async function fetchOshis() {
      setOshisLoading(true);

      const { data, error: fetchError } =
        await supabase
          .from("oshis")
          .select("id, name, image_url")
          .eq("user_id", user!.id)
          .order("created_at", {
            ascending: true,
          });

      if (fetchError) {
        console.error(
          "Error fetching oshis:",
          fetchError
        );
      } else {
        setOshis(
          (data ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            image:
              o.image_url ??
              "/icons/temp.jpg",
          }))
        );
      }

      setOshisLoading(false);
    }

    fetchOshis();
  }, [user]);

  /*
   * Redirect if not logged in
   */
  if (!isLoading && !isLoggedIn) {
    router.push("/login");
    return null;
  }

  const canPost =
    (caption.trim().length > 0 ||
      images.length > 0) &&
    !loading;

  /*
   * Select post images
   */
  function handleSelectImages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(
      e.target.files ?? []
    );

    if (!selected.length) {
      return;
    }

    const remaining =
      MAX_IMAGES - originalImages.length;

    if (remaining <= 0) {
      setMessage(
        "You can only upload up to 10 photos"
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);

      e.target.value = "";
      return;
    }

    if (selected.length > remaining) {
      setMessage(
        `You can only select ${remaining} more photo${
          remaining === 1 ? "" : "s"
        }`
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);

      e.target.value = "";
      return;
    }

    const startIndex =
      originalImages.length;

    setOriginalImages((prev) => [
      ...prev,
      ...selected,
    ]);

    setPendingImages(selected);

    setCropIndex(startIndex);

    setCropImage(
      URL.createObjectURL(selected[0])
    );

    e.target.value = "";
  }

  /*
   * Edit an existing post image
   */
  function handleEditImage() {
    const original =
      originalImages[currentIndex];

    if (!original) return;

    setPendingImages([]);
    setPendingIndex(0);
    setCropIndex(currentIndex);

    setCropImage(
      URL.createObjectURL(original)
    );
  }

  /*
   * Finish cropping a post image
   */
  function handleCropComplete(
    croppedFile: File
  ) {
    setImages((prev) => {
      const updated = [...prev];

      if (cropIndex < updated.length) {
        updated[cropIndex] =
          croppedFile;
      } else {
        updated.push(croppedFile);
      }

      return updated;
    });

    const nextPending =
      pendingIndex + 1;

    if (
      nextPending <
      pendingImages.length
    ) {
      setPendingIndex(nextPending);

      setCropIndex((prev) =>
        prev + 1
      );

      setCropImage(
        URL.createObjectURL(
          pendingImages[nextPending]
        )
      );
    } else {
      if (cropImage) {
        URL.revokeObjectURL(cropImage);
      }

      setCropImage(null);
      setPendingImages([]);
      setPendingIndex(0);
    }
  }

  /*
   * Cancel post image cropping
   */
  function cancelCrop() {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setPendingImages([]);
    setPendingIndex(0);
  }

  /*
   * Open the Oshi cropper.
   *
   * The BottomSheet stays open.
   */
  function handleOpenOshiCropper(
    imageUrl: string
  ) {
    setOshiCropImage(imageUrl);
    setShowOshiCropper(true);

    // DO NOT close the BottomSheet.
  }

  /*
   * Finish cropping the Oshi image.
   *
   * The BottomSheet remains open.
   */
  function handleOshiCropComplete(
    croppedFile: File
  ) {
    setCroppedOshiImage(
      croppedFile
    );

    setShowOshiCropper(false);

    if (oshiCropImage) {
      URL.revokeObjectURL(
        oshiCropImage
      );
    }

    setOshiCropImage(null);
  }

  /*
   * Cancel Oshi cropping.
   *
   * The BottomSheet remains open.
   */
  function handleCancelOshiCropper() {
    if (oshiCropImage) {
      URL.revokeObjectURL(
        oshiCropImage
      );
    }

    setOshiCropImage(null);
    setShowOshiCropper(false);
  }

  /*
   * Close the Add Oshi sheet
   * and completely reset its state.
   */
  function resetOshiForm() {
    setShowBottomSheet(false);

    setCroppedOshiImage(null);

    if (oshiCropImage) {
      URL.revokeObjectURL(
        oshiCropImage
      );
    }

    setOshiCropImage(null);
    setShowOshiCropper(false);
  }

  /*
   * Upload post images
   */
  async function uploadImages(
    userId: string
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (
      let i = 0;
      i < images.length;
      i++
    ) {
      const file = images[i];

      const ext =
        file.name.split(".").pop() ||
        "jpg";

      const path =
        `${userId}/${Date.now()}-${i}.${ext}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("posts")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            file.type ||
            `image/${ext}`,
        });

      if (uploadError) {
        console.error(
          "Image upload failed:",
          uploadError
        );

        throw new Error(
          uploadError.message
        );
      }

      const {
        data: { publicUrl },
      } =
        supabase.storage
          .from("posts")
          .getPublicUrl(path);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  }

  /*
   * Insert hashtags
   */
  async function insertHashtags(
    postId: string
  ) {
    for (const rawTag of hashtags) {
      const tag =
        rawTag.trim().toLowerCase();

      if (!tag) continue;

      let hashtagId: string;

      const {
        data: existing,
        error: lookupError,
      } = await supabase
        .from("hashtags")
        .select("id")
        .eq("tag", tag)
        .maybeSingle();

      if (lookupError) {
        console.error(
          "Error looking up hashtag:",
          lookupError
        );

        continue;
      }

      if (existing) {
        hashtagId = existing.id;
      } else {
        const {
          data: created,
          error: createError,
        } = await supabase
          .from("hashtags")
          .insert({ tag })
          .select("id")
          .single();

        if (
          createError ||
          !created
        ) {
          console.error(
            "Error creating hashtag:",
            createError
          );

          continue;
        }

        hashtagId =
          created.id;
      }

      const {
        error: linkError,
      } = await supabase
        .from("post_hashtags")
        .insert({
          post_id: postId,
          hashtag_id:
            hashtagId,
        });

      if (linkError) {
        console.error(
          "Error linking hashtag to post:",
          linkError
        );
      }
    }
  }

  /*
   * Insert fandoms
   */
  async function insertFandoms(
    postId: string
  ) {
    for (const rawFandom of fandoms) {
      const name =
        rawFandom.trim();

      if (!name) continue;

      let fandomId: string;

      const {
        data: existing,
        error: lookupError,
      } = await supabase
        .from("fandoms")
        .select("id")
        .ilike("name", name)
        .maybeSingle();

      if (lookupError) {
        console.error(
          "Error looking up fandom:",
          lookupError
        );

        continue;
      }

      if (existing) {
        fandomId = existing.id;
      } else {
        const {
          data: created,
          error: createError,
        } = await supabase
          .from("fandoms")
          .insert({ name })
          .select("id")
          .single();

        if (
          createError ||
          !created
        ) {
          console.error(
            "Error creating fandom:",
            createError
          );

          continue;
        }

        fandomId =
          created.id;
      }

      const {
        error: linkError,
      } = await supabase
        .from("post_fandoms")
        .insert({
          post_id: postId,
          fandom_id:
            fandomId,
        });

      if (linkError) {
        console.error(
          "Error linking fandom to post:",
          linkError
        );
      }
    }
  }

  /*
   * Insert Oshi tags
   */
  async function insertOshiTags(
    postId: string
  ) {
    if (
      selectedOshis.length === 0
    ) {
      return;
    }

    const rows =
      selectedOshis.map(
        (oshiId) => ({
          post_id: postId,
          oshi_id: oshiId,
        })
      );

    const {
      error: oshiLinkError,
    } = await supabase
      .from("post_oshis")
      .insert(rows);

    if (oshiLinkError) {
      console.error(
        "Error linking oshis to post:",
        oshiLinkError
      );
    }
  }

  /*
   * Submit post
   */
  async function handleSubmit() {
    setError("");

    if (!user) {
      setError(
        "You must be logged in to create a post"
      );

      return;
    }

    if (!canPost) {
      setError(
        "Post cannot be empty"
      );

      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];

      if (images.length > 0) {
        imageUrls =
          await uploadImages(
            user.id
          );
      }

      const {
        data: insertedPost,
        error: insertError,
      } =
        await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            content:
              caption.trim(),
            image_url:
              imageUrls.length > 0
                ? JSON.stringify(
                    imageUrls
                  )
                : null,
            location:
              location.trim() ||
              null,
          })
          .select("id")
          .single();

      if (
        insertError ||
        !insertedPost
      ) {
        console.error(
          "Post insert failed:",
          insertError
        );

        setError(
          insertError?.message ??
            "Failed to create post"
        );

        return;
      }

      await Promise.all([
        insertHashtags(
          insertedPost.id
        ),
        insertFandoms(
          insertedPost.id
        ),
        insertOshiTags(
          insertedPost.id
        ),
      ]);

      setImages([]);
      setOriginalImages([]);
      setCropData([]);
      setCaption("");
      setLocation("");
      setHashtags([]);
      setFandoms([]);
      setSelectedOshis([]);
      setCurrentIndex(0);

      router.push("/profile");
    } catch (err) {
      console.error(
        "Post creation failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="
          md:hidden
          min-h-screen
          flex
          items-center
          justify-center
        "
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">

      {/* Post Image Cropper */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          aspectRatio={aspectRatio}
          isFirstImage={
            images.length === 0
          }
          initialCrop={
            cropData[cropIndex]
          }
          onCropChange={(data) => {
            setCropData((prev) => {
              const updated = [
                ...prev,
              ];

              updated[cropIndex] =
                data;

              return updated;
            });
          }}
          onRatioChange={
            setAspectRatio
          }
          onComplete={
            handleCropComplete
          }
          onCancel={cancelCrop}
        />
      )}

      {/* Message */}
      {message && (
        <div
          className="
            fixed
            top-20
            left-1/2
            -translate-x-1/2
            z-[200]
            rounded-full
            bg-black/50
            px-4
            py-3
            text-sm
            text-white
            text-center
            whitespace-nowrap
            shadow-lg
          "
        >
          {message}
        </div>
      )}

      {/* Header */}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          items-center
          justify-between
          px-4
          pt-4
          pb-3
          bg-background
          border-b
          border-foreground/30
        "
      >
        <h1 className="text-xl font-bold">
          Create Post
        </h1>

        <button
          onClick={() =>
            router.push("/")
          }
          className="
            h-10
            w-10
            rounded-full
            bg-accent
            flex
            items-center
            justify-center
          "
        >
          <X size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mt-4">
          <div className="space-y-4 pb-4">

            <ImagePreview
              images={images}
              currentIndex={currentIndex}
              setCurrentIndex={
                setCurrentIndex
              }
              onEdit={
                handleEditImage
              }
              aspectRatio={
                aspectRatio
              }
            />

            <ThumbnailStrip
              images={images}
              currentIndex={currentIndex}
              setCurrentIndex={
                setCurrentIndex
              }
              setImages={setImages}
              onSelectImages={
                handleSelectImages
              }
            />
          </div>

          <CaptionInput
            caption={caption}
            setCaption={setCaption}
          />

          <LocationInput
            location={location}
            setLocation={setLocation}
          />

          <TagInput
            label="Hashtags"
            placeholder="Add a hashtag"
            items={hashtags}
            setItems={setHashtags}
            maxItems={10}
            prefix="#"
          />

          {/*
          <TagInput
            label="Fandoms"
            placeholder="Add a fandom"
            items={fandoms}
            setItems={setFandoms}
            maxItems={5}
          />
          */}
          {oshisLoading ? (
            <p className="text-sm text-foreground/50">
              Loading oshis...
            </p>
          ) : (
            <OshiPicker
              oshis={oshis}
              selected={
                selectedOshis
              }
              setSelected={
                setSelectedOshis
              }
              onAdd={() =>
                setShowBottomSheet(
                  true
                )
              }
            />
          )}

          {/* Add Oshi Bottom Sheet */}
          {showBottomSheet && (
            <BottomSheet
              title="Add Oshi"
              onClose={
                resetOshiForm
              }
            >
              <AddOshiForm
                onCreated={(newOshi) =>
                  setOshis((prev) => [
                    ...prev,
                    newOshi,
                  ])
                }
                onClose={
                  resetOshiForm
                }
                onOpenCropper={
                  handleOpenOshiCropper
                }
                croppedImage={
                  croppedOshiImage
                }
              />
            </BottomSheet>
          )}

          {/* Oshi Image Cropper */}
          {showOshiCropper &&
            oshiCropImage && (
              <ImageCropper
                image={
                  oshiCropImage
                }
                aspectRatio={1}
                isFirstImage={true}
                onCropChange={() => {}}
                onRatioChange={() => {}}
                onComplete={
                  handleOshiCropComplete
                }
                onCancel={
                  handleCancelOshiCropper
                }
              />
            )}

          {/* Error */}
          {error && (
            <div
              className="
                rounded-xl
                border
                border-red-500
                bg-red-500/10
                p-3
              "
            >
              <p
                className="
                  text-sm
                  text-red-500
                "
              >
                {error}
              </p>
            </div>
          )}
        </div>
      </main>

      {!cropImage && (
        <PostButton
          disabled={!canPost}
          loading={loading}
          onClick={
            handleSubmit
          }
        />
      )}
    </div>
  );
}