"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";

type PostProps = {
  username: string;
  avatar: string;
  image: string;
  caption: string;
  likes?: number;
  comments?: number;
  time: string;
  location?: string;
};

export default function Post({
  username,
  avatar,
  image,
  caption,
  likes,
  comments,
  time,
  location,
}: PostProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes ?? 0);
    return (
        <article className="bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
            <Image
                src={avatar}
                alt={username}
                width={40}
                height={40}
                className="rounded-full object-cover"
            />

            <div>
                <p className="font-semibold text-sm">{username}</p>

                {location && (
                <p className="text-xs text-gray-500">{location}</p>
                )}
            </div>
            </div>

            <button>
            <MoreHorizontal size={20} />
            </button>
        </div>

        {/* Post Image */}
        <Image
            src={image}
            alt="Post"
            width={800}
            height={800}
            className="w-full aspect-square object-cover"
        />

            {/* Actions */}
            <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-5">
                <button 
                    onClick={() => {
                        if (liked) {
                        setLiked(false);
                        setLikeCount((count) => count - 1);
                        } else {
                        setLiked(true);
                        setLikeCount((count) => count + 1);
                        }
                    }}
                    className="flex items-center gap-1"
                >
                <Heart size={24} className={liked ? "fill-red-500 text-red-500" : "" }/>
                {likeCount !== undefined && likeCount > 0 && (<span className="text-sm font-medium pl-1">{likeCount}</span>)}
                </button>

                <button className="flex items-center gap-1">
                <MessageCircle size={24} />
                {comments !== undefined && comments > 0 &&(<span className="text-sm font-medium pl-1">{comments}</span>)}
                </button>

                <button>
                <Send size={24} />
                </button>
            </div>

            <button>
                <Bookmark size={24} />
            </button>
            </div>

        {/* Caption */}
        <div className="px-3 pt-1">
            <span className="font-semibold mr-2">
            {username}
            </span>

            <span>{caption}</span>
        </div>

        {/* Time */}
        <div className="px-3 pt-2 pb-4">
            <p className="text-xs text-gray-500 uppercase">
            {time}
            </p>
        </div>
        </article>
    );
}