"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ChevronLeft,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import PostGrid from "@/components/Profile/PostGrid";

import PostModal, {
  type ProfilePost,
} from "@/components/Profile/PostModal";

import BottomSheet from "@/components/BottomSheet";
import EditOshiForm from "@/components/EditOshiForm";
import ImageCropper from "@/components/CreatePost/ImageCropper";

import {
  formatTimeAgo,
  parsePostImages,
} from "@/utils/formatNumber";

type Oshi = {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  anniversary: string | null;
  notes: string | null;
  fandom: string | null;
};

type OwnerProfile = {
  username: string;
  avatar_url: string | null;
};

export default function OshiPage() {
  const params = useParams();
  const router = useRouter();

  const { user } =
    useSupabaseAuth();

  const [oshi, setOshi] =
    useState<Oshi | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [owner, setOwner] =
    useState<OwnerProfile | null>(
      null
    );

  const [posts, setPosts] =
    useState<ProfilePost[]>([]);

  const [
    postsLoading,
    setPostsLoading,
  ] = useState(true);

  const [
    selectedPostId,
    setSelectedPostId,
  ] = useState<string | null>(
    null
  );

  /*
   * Edit Oshi Bottom Sheet
   */
  const [
    showEditSheet,
    setShowEditSheet,
  ] = useState(false);

  /*
   * Image Cropper
   */
  const [
    cropImage,
    setCropImage,
  ] = useState<string | null>(
    null
  );

  const [
    croppedImage,
    setCroppedImage,
  ] = useState<File | null>(
    null
  );

  /*
   * Fetch Oshi
   */
  useEffect(() => {
    async function fetchOshi() {
      const id = params.id;

      if (
        !id ||
        typeof id !== "string"
      ) {
        setLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("oshis")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(
          "Error fetching oshi:",
          error
        );
      } else {
        setOshi(data);
      }

      setLoading(false);
    }

    fetchOshi();
  }, [params.id]);

  /*
   * Fetch posts this Oshi
   * has been tagged in.
   */
  useEffect(() => {
    async function fetchOshiPosts() {
      const id = params.id;

      if (
        !id ||
        typeof id !== "string"
      ) {
        setPostsLoading(false);
        return;
      }

      setPostsLoading(true);

      const {
        data: postOshiRows,
        error: postOshiError,
      } = await supabase
        .from("post_oshis")
        .select("post_id")
        .eq("oshi_id", id);

      if (postOshiError) {
        console.error(
          "Error fetching post_oshis:",
          postOshiError
        );

        setPosts([]);
        setPostsLoading(false);
        return;
      }

      const postIds =
        (postOshiRows ?? []).map(
          (row) => row.post_id
        );

      if (postIds.length === 0) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("posts")
        .select(
          `
            *,
            likes(count),
            comments(count),
            post_oshis(
              oshis(
                id,
                name,
                image_url
              )
            ),
            post_fandoms(
              fandoms(
                id,
                name
              )
            ),
            post_hashtags(
              hashtags(tag)
            )
          `
        )
        .in("id", postIds)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "Error fetching oshi posts:",
          error
        );

        setPosts([]);
      } else {
        setPosts(
          (data ?? []).map(
            (post: any) => ({
              id: post.id,

              images:
                parsePostImages(
                  post.image_url
                ),

              caption:
                post.content,

              time:
                formatTimeAgo(
                  post.created_at
                ),

              location:
                post.location ??
                undefined,

              likes:
                post.likes?.[0]
                  ?.count ?? 0,

              comments:
                post.comments?.[0]
                  ?.count ?? 0,

              /*
               * Do NOT use temp.jpg.
               * Keep null when there
               * is no Oshi image.
               */
              oshis: (
                post.post_oshis ??
                []
              )
                .filter(
                  (po: any) =>
                    po.oshis
                )
                .map(
                  (po: any) => ({
                    id:
                      po.oshis.id,

                    name:
                      po.oshis.name,

                    image:
                      po.oshis
                        .image_url ??
                      null,
                  })
                ),

              fandoms: (
                post.post_fandoms ??
                []
              )
                .filter(
                  (pf: any) =>
                    pf.fandoms
                )
                .map(
                  (pf: any) => ({
                    id:
                      pf.fandoms.id,

                    name:
                      pf.fandoms.name,
                  })
                ),

              hashtags: (
                post.post_hashtags ??
                []
              )
                .filter(
                  (ph: any) =>
                    ph.hashtags
                )
                .map(
                  (ph: any) =>
                    ph.hashtags.tag
                ),
            })
          )
        );
      }

      setPostsLoading(false);
    }

    fetchOshiPosts();
  }, [params.id]);

  /*
   * Fetch Oshi owner's profile.
   */
  useEffect(() => {
    async function fetchOwner() {
      if (!oshi) return;

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "username, avatar_url"
        )
        .eq(
          "id",
          oshi.user_id
        )
        .single();

      if (error) {
        console.error(
          "Error fetching oshi owner:",
          error
        );
      } else {
        setOwner(data);
      }
    }

    fetchOwner();
  }, [oshi]);

  /*
   * Post grid items.
   */
  const postGridItems =
    posts.map((post) => ({
      id: post.id,
      image:
        post.images[0] ?? null,
    }));

  /*
   * Close the Edit Oshi sheet
   * and reset cropper state.
   */
  function closeEditSheet() {
    setShowEditSheet(false);
    setCropImage(null);
    setCroppedImage(null);
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-foreground/50">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Oshi not found
   */
  if (!oshi) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
          <p className="text-foreground/50">
            Oshi not found.
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm font-medium"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const isOwner =
    user?.id ===
    oshi.user_id;

  return (
    <main className="min-h-dvh bg-background">

      {/* Header */}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          h-14
          items-center
          justify-between
          border-b
          border-foreground/10
          bg-background
          px-4
        "
      >

        {/* Back */}
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
          "
          aria-label="Go back"
        >
          <ChevronLeft
            size={22}
          />
        </button>

        {/* Title */}
        <h1 className="text-lg font-semibold">
          {oshi.name}
        </h1>

        {/* Edit */}
        <div className="h-9 w-9">
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setCroppedImage(
                  null
                );

                setCropImage(
                  null
                );

                setShowEditSheet(
                  true
                );
              }}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
              "
              aria-label="Edit Oshi"
            >
              <Pencil
                size={20}
              />
            </button>
          )}
        </div>

      </header>

      {/* Profile */}
      <section
        className="
          flex
          flex-col
          items-center
          px-4
          pt-4
          text-center
        "
      >

        {/* Oshi Image */}
        <div
          className="
            flex
            h-40
            w-40
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-accent/20
          "
        >
          {oshi.image_url ? (
            <Image
              src={
                oshi.image_url
              }
              alt={
                oshi.name
              }
              width={160}
              height={160}
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <UserIcon
              size={40}
              className="
                text-foreground/30
              "
            />
          )}
        </div>

        <div className="flex-1 pt-2">

          <h2 className="text-2xl font-bold">
            {oshi.name}
          </h2>

          {oshi.anniversary && (
            <p className="mt-1 text-sm text-foreground/60">
              Oshi since{" "}
              {new Date(
                oshi.anniversary
              ).toLocaleDateString()}
            </p>
          )}

        </div>

        {/* Notes */}
        {oshi.notes && (
          <div className="mt-1">
            <p
              className="
                whitespace-pre-wrap
                break-words
                text-base
                leading-relaxed
              "
            >
              {oshi.notes}
            </p>
          </div>
        )}

      </section>

      {/* Posts */}
      <section className="mt-3">

        <div
          className="
            border-b
            border-foreground/10
            px-4
            pb-3
          "
        >
          <h2 className="font-semibold">
            Album
          </h2>
        </div>

        {postsLoading ? (
          <div
            className="
              flex
              min-h-40
              items-center
              justify-center
            "
          >
            <p className="text-sm text-foreground/40">
              Loading posts...
            </p>
          </div>
        ) : posts.length > 0 ? (
          <PostGrid
            posts={
              postGridItems
            }
            onPostClick={
              setSelectedPostId
            }
          />
        ) : (
          <div
            className="
              flex
              min-h-40
              items-center
              justify-center
            "
          >
            <p className="text-sm text-foreground/40">
              No posts yet.
            </p>
          </div>
        )}

      </section>

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          posts={posts}
          initialPostId={
            selectedPostId
          }
          username={
            owner?.username ??
            "username"
          }
          avatar={
            owner?.avatar_url ||
            ""
          }
          ownerId={
            oshi.user_id
          }
          onClose={() =>
            setSelectedPostId(
              null
            )
          }
          onPostDeleted={(
            postId
          ) => {
            setPosts((prev) =>
              prev.filter(
                (p) =>
                  p.id !==
                  postId
              )
            );

            setSelectedPostId(
              null
            );
          }}
        />
      )}

      {/* Edit Oshi Bottom Sheet */}
      {showEditSheet && (
        <BottomSheet
          title="Edit Oshi"
          onClose={
            closeEditSheet
          }
        >
          <EditOshiForm
            oshi={oshi}

            onUpdated={(
              updatedOshi
            ) => {
              setOshi(
                updatedOshi
              );
            }}

            onDeleted={() => {
              router.back();
            }}

            onClose={
              closeEditSheet
            }

            onOpenCropper={(
              image
            ) => {
              setCropImage(
                image
              );
            }}

            croppedImage={
              croppedImage
            }
          />
        </BottomSheet>
      )}

      {/* Image Cropper */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          aspectRatio={1}
          isFirstImage={true}
          onCropChange={() => {}}
          onRatioChange={() => {}}
          onComplete={(
            file
          ) => {
            setCroppedImage(
              file
            );

            setCropImage(
              null
            );
          }}
          onCancel={() => {
            setCropImage(
              null
            );
          }}
        />
      )}

    </main>
  );
}