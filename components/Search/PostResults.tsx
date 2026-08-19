"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import PostGrid from "@/components/Profile/PostGrid";
import { parsePostImages } from "@/utils/formatNumber";

type PostResult = {
  id: string;
  image_url: string | null;
  created_at: string;
};

type PostResultsProps = {
  query?: string;
};

export default function PostResults({
  query = "",
}: PostResultsProps) {
  const router = useRouter();

  const [posts, setPosts] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const term = query?.trim() ?? "";

    if (!term) {
      setPosts([]);
      setLoading(false);
      return;
    }

    async function searchPosts() {
      setLoading(true);

      try {
        /*
         * Search post captions
         */
        const { data: contentPosts, error: contentError } =
          await supabase
            .from("posts")
            .select("id, image_url, created_at")
            .ilike("content", `%${term}%`);

        if (contentError) {
          throw contentError;
        }

        /*
         * Search hashtags
         */
        const { data: hashtags, error: hashtagError } =
          await supabase
            .from("hashtags")
            .select("id")
            .ilike("tag", `%${term}%`);

        if (hashtagError) {
          throw hashtagError;
        }

        let hashtagPostIds: string[] = [];

        if (hashtags && hashtags.length > 0) {
          const hashtagIds = hashtags.map(
            (hashtag) => hashtag.id
          );

          const { data: postHashtags, error } =
            await supabase
              .from("post_hashtags")
              .select("post_id")
              .in("hashtag_id", hashtagIds);

          if (error) {
            throw error;
          }

          hashtagPostIds =
            postHashtags?.map(
              (item) => item.post_id
            ) ?? [];
        }

        /*
         * Search oshis
         */
        const { data: oshis, error: oshiError } =
          await supabase
            .from("oshis")
            .select("id")
            .ilike("name", `%${term}%`);

        if (oshiError) {
          throw oshiError;
        }

        let oshiPostIds: string[] = [];

        if (oshis && oshis.length > 0) {
          const oshiIds = oshis.map(
            (oshi) => oshi.id
          );

          const { data: postOshis, error } =
            await supabase
              .from("post_oshis")
              .select("post_id")
              .in("oshi_id", oshiIds);

          if (error) {
            throw error;
          }

          oshiPostIds =
            postOshis?.map(
              (item) => item.post_id
            ) ?? [];
        }

        /*
         * Search fandoms
         */
        const { data: fandoms, error: fandomError } =
          await supabase
            .from("fandoms")
            .select("id")
            .ilike("name", `%${term}%`);

        if (fandomError) {
          throw fandomError;
        }

        let fandomPostIds: string[] = [];

        if (fandoms && fandoms.length > 0) {
          const fandomIds = fandoms.map(
            (fandom) => fandom.id
          );

          const { data: postFandoms, error } =
            await supabase
              .from("post_fandoms")
              .select("post_id")
              .in("fandom_id", fandomIds);

          if (error) {
            throw error;
          }

          fandomPostIds =
            postFandoms?.map(
              (item) => item.post_id
            ) ?? [];
        }

        /*
         * Combine all matching post IDs
         */
        const contentPostIds =
          contentPosts?.map(
            (post) => post.id
          ) ?? [];

        const allPostIds = [
          ...new Set([
            ...contentPostIds,
            ...hashtagPostIds,
            ...oshiPostIds,
            ...fandomPostIds,
          ]),
        ];

        if (allPostIds.length === 0) {
          setPosts([]);
          return;
        }

        /*
         * Fetch matching posts
         */
        const { data: matchingPosts, error: postsError } =
          await supabase
            .from("posts")
            .select(
              "id, image_url, created_at"
            )
            .in("id", allPostIds)
            .order("created_at", {
              ascending: false,
            })
            .limit(30);

        if (postsError) {
          throw postsError;
        }

        setPosts(matchingPosts ?? []);
      } catch (error) {
        console.error(
          "Error searching posts:",
          error
        );

        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    searchPosts();
  }, [query]);

  const gridPosts = posts.map((post) => ({
    id: post.id,
    image:
      parsePostImages(post.image_url)[0] ?? null,
  }));

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          Searching posts...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          No posts found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <PostGrid
      posts={gridPosts}
      onPostClick={(postId) =>
        router.push(`/post/${postId}`)
      }
    />
  );
}