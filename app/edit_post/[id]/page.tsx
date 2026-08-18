"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import CaptionInput from "@/components/CreatePost/CaptionInput";
import LocationInput from "@/components/CreatePost/LocationInput";
import TagInput from "@/components/CreatePost/TagInput";
import ThumbnailStrip from "@/components/CreatePost/ThumbnailStrip";
import OshiPicker, {
  type Oshi,
} from "@/components/CreatePost/OshiPicker";

type PostData = {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  location: string | null;
};

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params.id as string;

  const {
    user,
    isLoggedIn,
    isLoading: authLoading,
  } = useSupabaseAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");

  const [hashtags, setHashtags] = useState<string[]>([]);
  const [fandoms, setFandoms] = useState<string[]>([]);
  const [selectedOshis, setSelectedOshis] =
    useState<string[]>([]);

  const [imageUrls, setImageUrls] = useState<string[]>(
    []
  );

  const [images, setImages] = useState<File[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [oshis, setOshis] = useState<Oshi[]>([]);

  const [loading, setLoading] = useState(false);

  /*
   * Load existing post
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isLoggedIn || !user) {
      router.push("/login");
      return;
    }

    if (!postId) {
      setError("Post ID is missing.");
      setPageLoading(false);
      return;
    }

    /*
     * Store the authenticated user in a local constant.
     * This lets TypeScript know that user is not null
     * inside the async function below.
     */
    const currentUser = user;

    async function loadPost() {
      setPageLoading(true);
      setError("");

      try {
        /*
         * Get post
         */
        const {
          data: post,
          error: postError,
        } = await supabase
          .from("posts")
          .select(
            "id, user_id, content, image_url, location"
          )
          .eq("id", postId)
          .eq("user_id", currentUser.id)
          .single();

        if (postError) {
          console.error(
            "Error fetching post:",
            postError
          );

          setError(postError.message);
          return;
        }

        if (!post) {
          setError("Post not found.");
          return;
        }

        const postData = post as PostData;

        /*
         * Existing caption
         */
        setCaption(postData.content ?? "");

        /*
         * Existing location
         */
        setLocation(postData.location ?? "");

        /*
         * Existing images
         */
        let parsedImages: string[] = [];

        if (postData.image_url) {
          try {
            const parsed = JSON.parse(
              postData.image_url
            );

            if (Array.isArray(parsed)) {
              parsedImages = parsed;
            } else {
              parsedImages = [
                postData.image_url,
              ];
            }
          } catch {
            parsedImages = [
              postData.image_url,
            ];
          }
        }

        setImageUrls(parsedImages);

        /*
         * Convert existing image URLs to Files
         * so ThumbnailStrip can display them.
         */
        const imageFiles: File[] = [];

        for (
          let i = 0;
          i < parsedImages.length;
          i++
        ) {
          try {
            const response = await fetch(
              parsedImages[i]
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch image ${i + 1}`
              );
            }

            const blob = await response.blob();

            const file = new File(
              [blob],
              `post-image-${i + 1}.jpg`,
              {
                type:
                  blob.type ||
                  "image/jpeg",
              }
            );

            imageFiles.push(file);
          } catch (imageError) {
            console.error(
              "Error loading post image:",
              imageError
            );
          }
        }

        setImages(imageFiles);

        /*
         * Existing hashtags
         */
        const {
          data: hashtagRows,
          error: hashtagError,
        } = await supabase
          .from("post_hashtags")
          .select(
            `
              hashtags (
                tag
              )
            `
          )
          .eq("post_id", postId);

        if (hashtagError) {
          console.error(
            "Error fetching hashtags:",
            hashtagError
          );
        } else {
          setHashtags(
            (hashtagRows ?? [])
              .map(
                (row: any) =>
                  row.hashtags?.tag
              )
              .filter(Boolean)
          );
        }

        /*
         * Existing fandoms
         */
        const {
          data: fandomRows,
          error: fandomError,
        } = await supabase
          .from("post_fandoms")
          .select(
            `
              fandoms (
                name
              )
            `
          )
          .eq("post_id", postId);

        if (fandomError) {
          console.error(
            "Error fetching fandoms:",
            fandomError
          );
        } else {
          setFandoms(
            (fandomRows ?? [])
              .map(
                (row: any) =>
                  row.fandoms?.name
              )
              .filter(Boolean)
          );
        }

        /*
         * Existing Oshis
         */
        const {
          data: oshiRows,
          error: oshiError,
        } = await supabase
          .from("post_oshis")
          .select("oshi_id")
          .eq("post_id", postId);

        if (oshiError) {
          console.error(
            "Error fetching oshis:",
            oshiError
          );
        } else {
          setSelectedOshis(
            (oshiRows ?? []).map(
              (row) => row.oshi_id
            )
          );
        }

        /*
         * User's Oshis
         */
        const {
          data: oshiData,
          error: oshisError,
        } = await supabase
          .from("oshis")
          .select(
            "id, name, image_url"
          )
          .eq(
            "user_id",
            currentUser.id
          )
          .order("created_at", {
            ascending: true,
          });

        if (oshisError) {
          console.error(
            "Error fetching user's oshis:",
            oshisError
          );
        } else {
          setOshis(
            (oshiData ?? []).map(
              (oshi) => ({
                id: oshi.id,
                name: oshi.name,
                image:
                  oshi.image_url ??
                  "/icons/temp.jpg",
              })
            )
          );
        }
      } catch (err) {
        console.error(
          "Error loading post:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load post."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadPost();
  }, [
    authLoading,
    isLoggedIn,
    user,
    postId,
    router,
  ]);

  /*
   * Authentication loading
   */
  if (authLoading) {
    return (
      <div className="md:hidden flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  /*
   * Redirecting
   */
  if (!isLoggedIn || !user) {
    return null;
  }

  /*
   * Post loading
   */
  if (pageLoading) {
    return (
      <div className="md:hidden flex min-h-screen items-center justify-center">
        Loading post...
      </div>
    );
  }

  /*
   * Insert hashtags (find-or-create + link)
   */
  async function insertHashtags(postId: string) {
    for (const rawTag of hashtags) {
      const tag = rawTag.trim().toLowerCase();

      if (!tag) continue;

      let hashtagId: string;

      const { data: existing, error: lookupError } =
        await supabase
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
        const { data: created, error: createError } =
          await supabase
            .from("hashtags")
            .insert({ tag })
            .select("id")
            .single();

        if (createError || !created) {
          console.error(
            "Error creating hashtag:",
            createError
          );
          continue;
        }

        hashtagId = created.id;
      }

      const { error: linkError } = await supabase
        .from("post_hashtags")
        .insert({
          post_id: postId,
          hashtag_id: hashtagId,
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
   * Insert fandoms (find-or-create + link)
   */
  async function insertFandoms(postId: string) {
    for (const rawFandom of fandoms) {
      const name = rawFandom.trim();

      if (!name) continue;

      let fandomId: string;

      const { data: existing, error: lookupError } =
        await supabase
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
        const { data: created, error: createError } =
          await supabase
            .from("fandoms")
            .insert({ name })
            .select("id")
            .single();

        if (createError || !created) {
          console.error(
            "Error creating fandom:",
            createError
          );
          continue;
        }

        fandomId = created.id;
      }

      const { error: linkError } = await supabase
        .from("post_fandoms")
        .insert({
          post_id: postId,
          fandom_id: fandomId,
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
  async function insertOshiTags(postId: string) {
    if (selectedOshis.length === 0) return;

    const rows = selectedOshis.map((oshiId) => ({
      post_id: postId,
      oshi_id: oshiId,
    }));

    const { error: oshiLinkError } = await supabase
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
   * Save changes to the post.
   */
  async function handleSave() {
    if (!user || loading) return;

    setLoading(true);
    setError("");

    try {
      /*
       * Update the post row itself.
       */
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          content: caption.trim(),
          location: location.trim() || null,
          image_url:
            imageUrls.length > 0
              ? JSON.stringify(imageUrls)
              : null,
        })
        .eq("id", postId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      /*
       * Clear existing tag links, then re-insert
       * from the current form state. Simplest way
       * to keep everything in sync without diffing.
       */
      await Promise.all([
        supabase
          .from("post_hashtags")
          .delete()
          .eq("post_id", postId),
        supabase
          .from("post_fandoms")
          .delete()
          .eq("post_id", postId),
        supabase
          .from("post_oshis")
          .delete()
          .eq("post_id", postId),
      ]);

      await Promise.all([
        insertHashtags(postId),
        insertFandoms(postId),
        insertOshiTags(postId),
      ]);

      router.replace(`/post/${postId}`);
    } catch (err) {
      console.error("Error saving post:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save changes."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Handle adding images.
   *
   * Currently disabled because this edit page only
   * works with the existing images.
   */
  function handleSelectImages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    e.target.value = "";
  }

  /*
   * Keep imageUrls synchronized if a thumbnail
   * is removed.
   *
   * ThumbnailStrip changes the File[] state,
   * so we use the same indexes to update URLs.
   */
  function handleSetImages(
    newImages: React.SetStateAction<File[]>
  ) {
    setImages((previousImages) => {
      const updatedImages =
        typeof newImages === "function"
          ? newImages(previousImages)
          : newImages;

      /*
       * If images were removed, keep only the
       * corresponding existing URLs.
       */
      setImageUrls((previousUrls) =>
        previousUrls.slice(
          0,
          updatedImages.length
        )
      );

      /*
       * Prevent currentIndex from pointing
       * to an image that no longer exists.
       */
      setCurrentIndex((previousIndex) =>
        Math.min(
          previousIndex,
          Math.max(
            updatedImages.length - 1,
            0
          )
        )
      );

      return updatedImages;
    });
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          items-center
          justify-between
          border-b
          border-foreground/30
          bg-background
          px-4
          pb-3
          pt-4
        "
      >
        <h1 className="text-2xl">
          Edit Post
        </h1>

        <button
          type="button"
          onClick={() => router.back()}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-accent
          "
        >
          <X size={20} />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mt-4">
          {/* Main Image */}
          {images.length > 0 && (
            <div className="mb-4">
              <div
                className="
                  relative
                  aspect-square
                  w-full
                  overflow-hidden
                  rounded-xl
                "
              >
                <img
                  src={
                    imageUrls[currentIndex]
                  }
                  alt={`Post image ${
                    currentIndex + 1
                  }`}
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            </div>
          )}

          {/* Thumbnail Strip */}
          {images.length > 0 && (
            <div className="mb-5">
              <ThumbnailStrip
                images={images}
                currentIndex={currentIndex}
                setCurrentIndex={
                  setCurrentIndex
                }
                setImages={handleSetImages}
                onSelectImages={
                  handleSelectImages
                }
                showAddButton={false}
              />
            </div>
          )}

          {/* Caption */}
          <CaptionInput
            caption={caption}
            setCaption={setCaption}
          />

          {/* Location */}
          <LocationInput
            location={location}
            setLocation={setLocation}
          />

          {/* Hashtags */}
          <TagInput
            label="Hashtags"
            placeholder="Add a hashtag"
            items={hashtags}
            setItems={setHashtags}
            maxItems={10}
            prefix="#"
          />

          {/* Fandoms */}
          <TagInput
            label="Fandoms"
            placeholder="Add a fandom"
            items={fandoms}
            setItems={setFandoms}
            maxItems={5}
          />

          {/* Oshis */}
          {oshis.length > 0 && (
            <OshiPicker
              oshis={oshis}
              selected={selectedOshis}
              setSelected={
                setSelectedOshis
              }
              onAdd={() => {
                // Not implemented yet
              }}
            />
          )}

          {/* Error */}
          {error && (
            <div
              className="
                mt-4
                rounded-xl
                border
                border-red-500
                bg-red-500/10
                p-3
              "
            >
              <p className="text-sm text-red-500">
                {error}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Save button */}
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-foreground/30
          bg-background
          p-4
        "
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="
            flex
            h-12
            w-full
            items-center
            justify-center
            rounded-full
            bg-[#b8d8be]/90
            font-semibold
            text-foreground
            transition
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? (
            <Loader2
              size={20}
              className="animate-spin"
            />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}