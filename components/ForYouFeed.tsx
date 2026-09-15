"use client";

import { useEffect, useState } from "react";

import Divider from "./Divider";
import Post from "./Post";
import { supabase } from "@/lib/supabase";
import {
  formatTimeAgo,
  parsePostImages,
} from "@/utils/formatNumber";

type PostData = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  location: string | null;
  likes_count: number;
  comments_count: number;
  username: string;
  avatar: string | null;
  oshis: {
    id: string;
    name: string;
    image: string;
  }[];
  fandoms: {
    id: string;
    name: string;
  }[];
  hashtags: string[];
};

type Props = {
  onCommentClick: (
    postId: string,
    ownerId: string
  ) => void;
};

function PostSkeleton() {
  return (
    <article className="bg-background animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 shrink-0 rounded-full bg-foreground/10" />

          <div>
            {/* Username */}
            <div className="h-3.5 w-24 rounded bg-foreground/10" />

            {/* Location */}
            <div className="mt-2 h-3 w-20 rounded bg-foreground/5" />
          </div>
        </div>

      </div>

      {/* Post Image */}
      <div className="aspect-square w-full bg-foreground/10" />

      {/* Caption */}
      <div className="space-y-2 px-3 pt-2">
        <div className="h-3.5 w-4/5 rounded bg-foreground/10" />
        <div className="h-3.5 w-3/5 rounded bg-foreground/10" />
      </div>

      {/* Oshis */}
      <div className="flex gap-2 px-3 pt-2">
        <div className="h-9 w-24 rounded-full bg-foreground/10" />
        <div className="h-9 w-28 rounded-full bg-foreground/10" />
      </div>

      {/* Hashtags */}
      <div className="flex gap-3 px-3 pt-2">
        <div className="h-3.5 w-16 rounded bg-foreground/10" />
        <div className="h-3.5 w-20 rounded bg-foreground/10" />
        <div className="h-3.5 w-14 rounded bg-foreground/10" />
      </div>

      {/* Time */}
      <div className="px-3 pb-4 pt-1">
        <div className="h-3.5 w-16 rounded bg-foreground/10" />
      </div>
    </article>
  );
}

function ForYouFeedSkeleton() {
  return (
    <div>
      <PostSkeleton />
      <Divider />

      <PostSkeleton />
      <Divider />

      <PostSkeleton />
    </div>
  );
}

export default function ForYouFeed({
  onCommentClick,
}: Props) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForYouPosts() {
      setLoading(true);

      try {
        /*
         * Get the currently logged-in user
         */
        const {
          data: { user },
        } = await supabase.auth.getUser();

        /*
         * Fetch posts from all users.
         *
         * If a user is logged in, exclude their own posts.
         */
        let query = supabase
          .from("posts")
          .select(
            `
            id,
            user_id,
            content,
            image_url,
            created_at,
            location,

            likes(count),
            comments(count),

            profiles:user_id (
              username,
              avatar_url
            ),

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
              hashtags(
                tag
              )
            )
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (user) {
          query = query.neq(
            "user_id",
            user.id
          );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          throw error;
        }

        const formattedPosts: PostData[] =
          (data ?? []).map((post: any) => ({
            id: post.id,
            user_id: post.user_id,
            content: post.content ?? "",
            image_url: post.image_url,
            created_at: post.created_at,
            location: post.location,

            likes_count:
              post.likes?.[0]?.count ?? 0,

            comments_count:
              post.comments?.[0]?.count ?? 0,

            username:
              post.profiles?.username ??
              "username",

            avatar:
              post.profiles?.avatar_url ??
              null,

            oshis: (
              post.post_oshis ?? []
            )
              .map(
                (item: any) =>
                  item.oshis
              )
              .filter(Boolean)
              .map((oshi: any) => ({
                id: oshi.id,
                name: oshi.name,
                image:
                  oshi.image_url ??
                  "",
              })),

            fandoms: (
              post.post_fandoms ?? []
            )
              .map(
                (item: any) =>
                  item.fandoms
              )
              .filter(Boolean)
              .map(
                (fandom: any) => ({
                  id: fandom.id,
                  name: fandom.name,
                })
              ),

            hashtags: (
              post.post_hashtags ?? []
            )
              .map(
                (item: any) =>
                  item.hashtags?.tag
              )
              .filter(Boolean),
          }));

        setPosts(formattedPosts);
      } catch (error) {
        console.error(
          "Error fetching For You posts:",
          error
        );

        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchForYouPosts();
  }, []);

  if (loading) {
    return <ForYouFeedSkeleton />;
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center px-4 text-center">
        <p className="text-sm text-foreground/40">
          No posts available yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post, index) => (
        <div key={post.id}>
          <Post
            id={post.id}
            userId={post.user_id}
            username={post.username}
            avatar={post.avatar}
            images={parsePostImages(
              post.image_url
            )}
            caption={post.content}
            likes={post.likes_count}
            comments={post.comments_count}
            time={formatTimeAgo(
              post.created_at
            )}
            location={
              post.location ?? undefined
            }
            oshis={post.oshis}
            fandoms={post.fandoms}
            hashtags={post.hashtags}
            onCommentClick={() =>
              onCommentClick(post.id, post.user_id)
            }
            onDeleted={(postId) =>
              setPosts((prev) =>
                prev.filter((p) => p.id !== postId)
              )
            }
            priority={index === 0}
          />

          {index < posts.length - 1 && (
            <Divider />
          )}
        </div>
      ))}
    </div>
  );
}