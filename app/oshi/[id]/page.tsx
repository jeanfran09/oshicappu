"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import PostGrid from "@/components/Profile/PostGrid";
import PostModal, {
  type ProfilePost,
} from "@/components/Profile/PostModal";
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
};

type OwnerProfile = {
  username: string;
  avatar_url: string | null;
};

export default function OshiPage() {
  const params = useParams();
  const router = useRouter();

  const { user } = useSupabaseAuth();

  const [oshi, setOshi] = useState<Oshi | null>(null);
  const [loading, setLoading] = useState(true);

  const [owner, setOwner] = useState<OwnerProfile | null>(null);

  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [selectedPostId, setSelectedPostId] =
    useState<string | null>(null);

  useEffect(() => {
    async function fetchOshi() {
      const id = params.id;

      if (!id || typeof id !== "string") {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("oshis")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching oshi:", error);
      } else {
        setOshi(data);
      }

      setLoading(false);
    }

    fetchOshi();
  }, [params.id]);

  /*
   * Posts this oshi has been tagged in.
   */
  useEffect(() => {
    async function fetchOshiPosts() {
      const id = params.id;

      if (!id || typeof id !== "string") {
        setPostsLoading(false);
        return;
      }

      setPostsLoading(true);

      const { data: postOshiRows, error: postOshiError } =
        await supabase
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

      const postIds = (postOshiRows ?? []).map(
        (row) => row.post_id
      );

      if (postIds.length === 0) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          likes(count),
          comments(count),
          post_oshis(oshis(id, name, image_url)),
          post_fandoms(fandoms(id, name)),
          post_hashtags(hashtags(tag))
          `
        )
        .in("id", postIds)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error fetching oshi posts:",
          error
        );

        setPosts([]);
      } else {
        setPosts(
          (data ?? []).map((post: any) => ({
            id: post.id,
            images: parsePostImages(post.image_url),
            caption: post.content,
            time: formatTimeAgo(post.created_at),
            location: post.location ?? undefined,
            likes: post.likes?.[0]?.count ?? 0,
            comments: post.comments?.[0]?.count ?? 0,
            oshis: (post.post_oshis ?? []).map(
              (po: any) => ({
                id: po.oshis.id,
                name: po.oshis.name,
                image:
                  po.oshis.image_url ??
                  "/icons/temp.jpg",
              })
            ),
            fandoms: (post.post_fandoms ?? []).map(
              (pf: any) => ({
                id: pf.fandoms.id,
                name: pf.fandoms.name,
              })
            ),
            hashtags: (post.post_hashtags ?? []).map(
              (ph: any) => ph.hashtags.tag
            ),
          }))
        );
      }

      setPostsLoading(false);
    }

    fetchOshiPosts();
  }, [params.id]);

  /*
   * Owner's username/avatar, for the post modal header.
   */
  useEffect(() => {
    async function fetchOwner() {
      if (!oshi) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", oshi.user_id)
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

  const postGridItems = posts.map((post) => ({
    id: post.id,
    image: post.images[0] ?? null,
  }));

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

  if (!oshi) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center gap-3">
          <p className="text-foreground/50">
            Oshi not found.
          </p>

          <button
            onClick={() => router.back()}
            className="text-sm font-medium"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const isOwner = user?.id === oshi.user_id;

  return (
    <main className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-foreground/10 bg-background px-4">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
          "
        >
          <ArrowLeft size={22} />
        </button>

        {/* Title */}
        <h1 className="font-semibold">
          {oshi.name}
        </h1>

        {/* Edit */}
        <div className="h-9 w-9">
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                // Open edit Oshi modal here
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
              <Pencil size={20} />
            </button>
          )}
        </div>

      </header>


      {/* Profile */}
      <section className="px-4 pt-6">

        <div className="flex items-center gap-5">

          {/* Oshi Image */}
          <div className="
            flex
            h-24
            w-24
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-accent/20
          ">
            {oshi.image_url ? (
              <Image
                src={oshi.image_url}
                alt={oshi.name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon
                size={40}
                className="text-foreground/30"
              />
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">

            <h2 className="text-xl font-bold">
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

        </div>


        {/* Notes / Bio */}
        {oshi.notes && (
          <div className="mt-5">
            <p className="
              whitespace-pre-wrap
              break-words
              text-sm
              leading-relaxed
            ">
              {oshi.notes}
            </p>
          </div>
        )}

      </section>


      {/* Posts */}
      <section className="mt-8">

        <div className="
          border-b
          border-foreground/10
          px-4
          pb-3
        ">
          <h2 className="font-semibold">
            Posts
          </h2>
        </div>

        {postsLoading ? (
          <div className="
            flex
            min-h-40
            items-center
            justify-center
          ">
            <p className="text-sm text-foreground/40">
              Loading posts...
            </p>
          </div>
        ) : posts.length > 0 ? (
          <PostGrid
            posts={postGridItems}
            onPostClick={setSelectedPostId}
          />
        ) : (
          <div className="
            flex
            min-h-40
            items-center
            justify-center
          ">
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
          initialPostId={selectedPostId}
          username={owner?.username ?? "username"}
          avatar={owner?.avatar_url || "/icons/temp.jpg"}
          onClose={() => setSelectedPostId(null)}
        />
      )}

    </main>
  );
}