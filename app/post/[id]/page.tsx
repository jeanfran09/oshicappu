"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import Post from "@/components/Post";
import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";
import CommentsSheet from "@/components/CommentsSheet";

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

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useSupabaseAuth();

  const postId = params.id as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCommentsPostId, setActiveCommentsPostId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    async function fetchPost() {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
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
                display_name,
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
          .eq("id", postId)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
          setError("Failed to load post.");
          return;
        }

        if (!data) {
          setError("Post not found.");
          return;
        }

        const postData = data as any;

        setPost({
          id: postData.id,
          user_id: postData.user_id,
          content: postData.content ?? "",
          image_url: postData.image_url,
          created_at: postData.created_at,
          location: postData.location,

          likes_count: postData.likes?.[0]?.count ?? 0,
          comments_count: postData.comments?.[0]?.count ?? 0,

          username: postData.profiles?.username ?? "username",

          avatar:
            postData.profiles?.avatar_url ??
            "/icons/temp.jpg",

          oshis: (postData.post_oshis ?? [])
            .map((item: any) => item.oshis)
            .filter(Boolean)
            .map((oshi: any) => ({
              id: oshi.id,
              name: oshi.name,
              image:
                oshi.image_url ??
                "/icons/temp.jpg",
            })),

          fandoms: (postData.post_fandoms ?? [])
            .map((item: any) => item.fandoms)
            .filter(Boolean)
            .map((fandom: any) => ({
              id: fandom.id,
              name: fandom.name,
            })),

          hashtags: (postData.post_hashtags ?? [])
            .map((item: any) => item.hashtags?.tag)
            .filter(Boolean),
        });
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (authLoading || loading) {
    return (
      <div className="md:hidden min-h-screen flex items-center justify-center">
        <p className="text-sm text-foreground/50">
          Loading...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="md:hidden min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-foreground/10 bg-background px-3 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className="font-semibold">
            Post
          </h1>
        </header>

        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-foreground/50">
            {error || "Post not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-foreground/10 bg-background px-3 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="font-semibold">
          Post
        </h1>
      </header>

      {/* Post */}
      <Post
        id={post.id}
        username={post.username}
        avatar={post.avatar}
        images={parsePostImages(post.image_url)}
        caption={post.content}
        likes={post.likes_count}
        comments={post.comments_count}
        time={formatTimeAgo(post.created_at)}
        location={post.location ?? undefined}
        oshis={post.oshis}
        fandoms={post.fandoms}
        hashtags={post.hashtags}
        onCommentClick={() => {
          setActiveCommentsPostId(post.id);
        }}
      />

      {/* Comments */}
      {activeCommentsPostId && (
        <CommentsSheet
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}
    </div>
  );
}