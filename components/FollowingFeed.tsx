"use client";

import { useEffect, useState } from "react";

import Divider from "./Divider";
import Post from "./Post";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";

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
  avatar: string;
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
  onCommentClick: (postId: string) => void;
};

export default function FollowingFeed({
  onCommentClick,
}: Props) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowingPosts() {
      setLoading(true);

      try {
        /*
         * Get the currently logged-in user
         */
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPosts([]);
          return;
        }

        /*
         * Get users that the current user follows
         */
        const {
          data: follows,
          error: followsError,
        } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followsError) {
          throw followsError;
        }

        /*
         * Include the current user's own ID
         * along with the users they follow.
         */
        const followingIds = [
          user.id,
          ...(follows ?? []).map(
            (follow) => follow.following_id
          ),
        ];

        /*
         * Fetch posts from:
         * - The current user
         * - Users the current user follows
         */
        const {
          data,
          error,
        } = await supabase
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
          .in("user_id", followingIds)
          .order("created_at", {
            ascending: false,
          });

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
              "/icons/temp.jpg",

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
                  "/icons/temp.jpg",
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
          "Error fetching following posts:",
          error
        );

        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowingPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          Loading...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center px-4 text-center">
        <p className="text-sm text-foreground/40">
          No posts from you or people you follow yet.
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
              onCommentClick(post.id)
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