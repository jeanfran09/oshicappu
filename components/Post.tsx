"use client";

import { formatCount } from "@/utils/formatNumber";
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
  id: string;
  username: string;
  avatar: string;
  images: string[];
  caption: string;
  likes?: number;
  comments?: number;
  time: string;
  location?: string;
  onCommentClick: () => void;
};

export default function Post({
  id,
  username,
  avatar,
  images,
  caption,
  likes,
  comments,
  time,
  location,
  onCommentClick,
}: PostProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes ?? 0);
    const [currentImage, setCurrentImage] = useState(0);

    function handleImageScroll(
        e: React.UIEvent<HTMLDivElement>
        ) {
        const container = e.currentTarget;

        const index = Math.round(
            container.scrollLeft / container.clientWidth
        );

        setCurrentImage(index);
    }

    return (
        <>
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
            <div className="relative">
                {/* Image counter */}
                {images.length > 1 && (
                    <div
                    className="
                        absolute
                        top-3
                        right-3
                        z-10
                        rounded-full
                        bg-black/50
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-white
                    "
                    >
                    {currentImage + 1}/{images.length}
                    </div>
                )}

                {/*Image Carousel*/}
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar" 
                style={{scrollSnapStop: "always",}}
                onScroll={handleImageScroll}>
                    {images.map((image, index) => (
                        <div key={index} className="relative min-w-full shrink-0 aspect-square snap-center snap-always">
                        <Image
                            src={image}
                            alt={`Post image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="100vw"
                        />
                        </div>
                    ))}
                </div>
            </div>
            
            {/*Image Dots*/}
            {images.length > 1 && (
                <div className="flex justify-center gap-1 py-2">
                    {images.map((_, index) => (
                    <div
                        key={index}
                        className={`
                        h-1.5
                        w-1.5
                        rounded-full
                        ${
                            currentImage === index
                            ? "bg-foreground"
                            : "bg-foreground/30"
                        }
                        `}
                    />
                    ))}
            </div>
            )}

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
                    {likeCount !== undefined && likeCount > 0 && (<span className="text-sm font-medium pl-1">{formatCount(likeCount)}</span>)}
                    </button>

                    <button className="flex items-center gap-1" onClick={onCommentClick}>
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
        </>
    );
}