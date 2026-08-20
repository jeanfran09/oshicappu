"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import PostGrid from "@/components/Profile/PostGrid";
import { parsePostImages } from "@/utils/formatNumber";

type Post = {
  id: string;
  image: string | null;
};

type Hashtag = {
  id: string;
  tag: string;
};

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();

  const hashtagTag = decodeURIComponent(
    params.tag as string
  );

  const [hashtag, setHashtag] =
    useState<Hashtag | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hashtagTag) return;

    async function fetchHashtag() {
      setLoading(true);

      try {
        /*
         * Fetch hashtag information
         */
        const {
          data: hashtagData,
          error: hashtagError,
        } = await supabase
          .from("hashtags")
          .select("id, tag")
          .eq("tag", hashtagTag)
          .single();

        if (hashtagError) {
          throw hashtagError;
        }

        setHashtag(hashtagData);

        /*
         * Fetch posts belonging to this hashtag
         */
        const {
          data: postData,
          error: postsError,
        } = await supabase
          .from("post_hashtags")
          .select(`
            post_id,
            posts(
              id,
              image_url,
              created_at
            )
          `)
          .eq(
            "hashtag_id",
            hashtagData.id
          );

        if (postsError) {
          throw postsError;
        }

        /*
         * Convert posts to PostGrid format
         */
        const formattedPosts: Post[] = (
          postData ?? []
        )
          .map((item: any) => item.posts)
          .filter(Boolean)
          .sort(
            (a: any, b: any) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          )
          .map((post: any) => ({
            id: post.id,

            // image_url is stored as a JSON array
            image:
              parsePostImages(
                post.image_url
              )[0] ?? null,
          }));

        setPosts(formattedPosts);
      } catch (error) {
        console.error(
          "Error fetching hashtag:",
          error
        );

        setHashtag(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHashtag();
  }, [hashtagTag]);

  const handlePostClick = (
    postId: string
  ) => {
    router.push(`/post/${postId}`);
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="md:hidden min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronLeft size={22} />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
            Hashtag
          </h1>
        </header>

        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-foreground/40">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Hashtag not found
   */
  if (!hashtag) {
    return (
      <div className="md:hidden min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronLeft size={22} />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
            Hashtag
          </h1>
        </header>

        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-foreground/40">
            Hashtag not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="md:hidden min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background  py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Hashtag
        </h1>
      </header>

      {/* Hashtag Information */}
      <section className="px-4 py-5">
        <h2 className="text-2xl font-bold">
          #{hashtag.tag}
        </h2>

        <p className="mt-1 text-sm text-foreground/60">
          {posts.length}{" "}
          {posts.length === 1
            ? "post"
            : "posts"}
        </p>
      </section>

      {/* Posts */}
      {posts.length > 0 ? (
        <PostGrid
          posts={posts}
          onPostClick={handlePostClick}
        />
      ) : (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-foreground/40">
            No posts yet.
          </p>
        </div>
      )}
    </main>
  );
}