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
  Pencil,
  Trash2
} from "lucide-react";
import BottomSheet from "./BottomSheet";
import Divider from "./Divider";

type Oshi = {
  id: string;
  name: string;
  image: string;
};

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
  priority?: boolean;
  oshis?: Oshi[];
  hashtags?: string[];
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
  priority = false,
  oshis = [],
  hashtags = [],
}: PostProps) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes ?? 0);
    const [currentImage, setCurrentImage] = useState(0);
    const [showMore, setShowMore] = useState(false);

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
                    priority={priority}
                />

                <div>
                    <p className="font-semibold text-sm">{username}</p>

                    {location && (
                    <p className="text-xs text-gray-500">{location}</p>
                    )}
                </div>
                </div>

                <button  onClick={() => setShowMore(true)}>
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
                            priority={priority && index === 0}
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
            <div className="px-3 pt-1 whitespace-pre-line break-words leading-tight">
                <span className="font-semibold mr-2">
                {username}
                </span>

                <span>{caption}</span>
            </div>

            {/* Oshis */}
            {oshis.length > 0 && (
            <div className="px-3 pt-2">
                <div className="flex flex-wrap gap-2">
                {oshis.map((oshi) => (
                    <div
                    key={oshi.id}
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-accent
                        pl-1.5
                        pr-2.5
                        py-1.5
                    "
                    >
                    <div className="relative h-5 w-5 overflow-hidden rounded-full">
                        <Image
                            src={oshi.image}
                            alt={oshi.name}
                            fill
                            className="rounded-full object-cover"
                        />
                    </div>

                    <span className="text-base font-medium">
                        {oshi.name}
                    </span>
                    </div>
                ))}
                </div>
            </div>
            )}

            {/* Hashtags */}
            {hashtags.length > 0 && (
            <div className="px-3 pt-2 flex flex-wrap gap-x-3 gap-y-1">
                {hashtags.map((tag) => (
                <span key={tag} className="text-base  font-medium">
                    #{tag}
                </span>
                ))}
            </div>
            )}

            
            {/* Time */}
            <div className="px-3 pt-2 pb-4">
                <p className="text-xs text-gray-500 uppercase">
                {time}
                </p>
            </div>


            {showMore && (
            <BottomSheet
                title="Options"
                onClose={() => setShowMore(false)}
                size="small"
            >
                <div className="w-full space-y-3">

                <button
                    className="
                    flex
                    w-full
                    rounded-xl
                    text-left
                    text-base
                    text-foreground
                    items-center
                    "
                    onClick={() => {
                    setShowMore(false);
                    // open edit modal here
                    }}
                >
                    <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-accent">
                        <Pencil size={18} />
                    </div>
                    <span>Edit Post</span>
                </button>

                <Divider/>

                <button
                    className="
                    flex
                    w-full
                    rounded-xl
                    text-left
                    text-base
                    font-medium
                    text-red-500
                    items-center
                    "
                    onClick={() => {
                    setShowMore(false);
                    // delete post here
                    }}
                >
                    <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-red-500/15">
                        <Trash2 size={18} className="text-red-500"/>
                    </div>

                    <span>Delete Post</span>
                </button>

                </div>
            </BottomSheet>
            )}
        </article>
        </>
    );
}