"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import Post from "@/components/Post";
import CommentsSheet from "@/components/CommentsSheet";
import Divider from "../Divider";

type Oshi = {
  id: string;
  name: string;
  image: string;
};

type Fandom = {
  id: string;
  name: string;
};

export type ProfilePost = {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  images: string[];
  caption: string;
  time: string;
  location?: string;
  likes?: number;
  comments?: number;
  oshis?: Oshi[];
  fandoms?: Fandom[];
  hashtags?: string[];
};

type PostModalProps = {
  posts: ProfilePost[];
  initialPostId: string;
  username?: string;
  avatar?: string | null;
  ownerId?: string;
  onClose: () => void;
  onPostDeleted?: (postId: string) => void;
  onLikeChange?: (postId: string, likes: number) => void;
};

export default function PostModal({
  posts,
  initialPostId,
  username,
  avatar,
  ownerId,
  onClose,
  onPostDeleted,
  onLikeChange,
}: PostModalProps) {
  const [modalPosts, setModalPosts] = useState<ProfilePost[]>(posts);

  const [activeCommentsPostId, setActiveCommentsPostId] =
    useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep modal posts in sync with the parent posts
  useEffect(() => {
    setModalPosts(posts);
  }, [posts]);

  // Update like count inside the modal
  function handleLikeChange(postId: string, likes: number) {
    setModalPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes }
          : post
      )
    );

    // Also update the parent if a callback was provided
    onLikeChange?.(postId, likes);
  }

  // Jump straight to the selected post
  useEffect(() => {
    const el = document.getElementById(
      `profile-post-${initialPostId}`
    );

    el?.scrollIntoView({
      block: "start",
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[999]
          flex
          flex-col
          bg-background
        "
      >
        {/* Header */}
        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-center
            border-b
            border-foreground/10
            bg-background
            py-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
            "
          >
            <ChevronLeft size={22} />
          </button>

          <p
            className="
              absolute
              left-1/2
              -translate-x-1/2
              text-lg
              font-semibold
            "
          >
            {username ?? "username"}
          </p>
        </div>

        {/* Scrollable posts */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
        >
          {modalPosts.map((post, index) => (
            <div
              key={post.id}
              id={`profile-post-${post.id}`}
              className="border-b border-foreground/10"
            >
              <Post
                id={post.id}
                userId={post.userId}
                username={post.username ?? "username"}
                avatar={post.avatar ?? null}
                images={post.images}
                caption={post.caption}
                time={post.time}
                location={post.location}
                likes={post.likes}
                comments={post.comments}
                oshis={post.oshis}
                fandoms={post.fandoms}
                hashtags={post.hashtags}
                onCommentClick={() =>
                  setActiveCommentsPostId(post.id)
                }
                onDeleted={onPostDeleted}
                onLikeChange={(likes) =>
                  handleLikeChange(post.id, likes)
                }
              />

              {index < modalPosts.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>

      {activeCommentsPostId && (
        <CommentsSheet
          postId={activeCommentsPostId}
          postOwnerId={
            modalPosts.find(
              (post) =>
                post.id === activeCommentsPostId
            )?.userId ?? ownerId
          }
          onClose={() =>
            setActiveCommentsPostId(null)
          }
        />
      )}
    </>
  );
}