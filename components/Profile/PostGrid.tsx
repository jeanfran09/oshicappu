"use client";

import Image from "next/image";

type Post = {
  id: string;
  image: string;
};

type Props = {
  posts: Post[];
};

export default function PostGrid({
  posts,
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

        <div
          key={post.id}
          className="relative aspect-square overflow-hidden bg-accent/20"
        >
          <Image
            src={post.image}
            alt="Post image"
            fill
            sizes="33vw"
            className="
              object-cover
            "
          />
        </div>
      ))}
    </div>
  );
}