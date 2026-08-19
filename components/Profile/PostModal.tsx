"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import Post from "@/components/Post";
import CommentsSheet from "@/components/CommentsSheet";

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
  username: string;
  avatar: string;
  ownerId?: string;
  onClose: () => void;
  onPostDeleted?: (postId: string) => void;
};

export default function PostModal({
  posts,
  initialPostId,
  username,
  avatar,
  ownerId,
  onClose,
  onPostDeleted,
}: PostModalProps) {
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<
    string | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Jump straight to the post that was tapped, instantly.
  useEffect(() => {
    const el = document.getElementById(`profile-post-${initialPostId}`);
    el?.scrollIntoView({ block: "start" });
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

          <p className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">{username}</p>
        </div>

        {/* Scrollable feed of this user's posts, Instagram-style */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
        >
          {posts.map((post) => (
            <div
              key={post.id}
              id={`profile-post-${post.id}`}
              className="border-b border-foreground/10"
            >
              <Post
                id={post.id}
                userId={ownerId}
                username={username}
                avatar={avatar}
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
              />
            </div>
          ))}
        </div>
      </div>

      {activeCommentsPostId && (
        <CommentsSheet
          postId={activeCommentsPostId}
          onClose={() => setActiveCommentsPostId(null)}
        />
      )}
    </>
  );
}