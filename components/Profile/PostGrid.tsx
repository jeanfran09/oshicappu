"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";

type Post = {
  id: string;
  image: string | null;
};

type Props = {
  posts: Post[];
  onPostClick?: (postId: string) => void;
};

export default function PostGrid({
  posts,
  onPostClick,
}: Props) {

  if (posts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-foreground/50">
        No posts yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((post) => (

        <button
          key={post.id}
          type="button"
          onClick={() => onPostClick?.(post.id)}
          className="relative aspect-square overflow-hidden bg-accent/20"
        >
          {post.image ? (
            <Image
              src={post.image}
              alt="Post image"
              fill
              sizes="33vw"
              className="
                object-cover
              "
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon size={20} className="text-foreground/30" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}