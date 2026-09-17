"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import PostGridSkeleton from "../Skeleton/PostGridSkeleton";

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
      <PostGridSkeleton count={6}/>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-[1px]">
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