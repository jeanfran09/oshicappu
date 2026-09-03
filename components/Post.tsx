"use client";

import { formatCount } from "@/utils/formatNumber";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import BottomSheet from "./BottomSheet";
import Divider from "./Divider";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { useRouter } from "next/navigation";

type Oshi = {
  id: string;
  name: string;
  image: string;
};

type Fandom = {
  id: string;
  name: string;
};

type PostProps = {
  id: string;
  userId?: string;
  username: string;
  avatar: string | null;
  images: string[];
  caption: string;
  likes?: number;
  comments?: number;
  time: string;
  location?: string;
  onCommentClick: () => void;
  priority?: boolean;
  oshis?: Oshi[];
  fandoms?: Fandom[];
  hashtags?: string[];
  onDeleted?: (postId: string) => void;
  onLikeChange?: (likes: number) => void;
};

export default function Post({
  id,
  userId,
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
  fandoms = [],
  hashtags = [],
  onDeleted,
  onLikeChange,
}: PostProps) {
  const { user } = useSupabaseAuth();

  const isOwner = !!user && !!userId && user.id === userId;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes ?? 0);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const router = useRouter();

  // Keep the local like count in sync when the prop changes.
  useEffect(() => {
    setLikeCount(likes ?? 0);
  }, [likes]);

  // Check whether the current user has already liked this post.
  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }

    let cancelled = false;

    async function checkLiked() {
      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Error checking like status:", error);
        } else {
          setLiked(!!data);
        }
      }
    }

    checkLiked();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  // Check whether the current user has already saved this post.
  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }

    let cancelled = false;

    async function checkSaved() {
      const { data, error } = await supabase
        .from("saved_posts")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Error checking saved status:", error);
        } else {
          setSaved(!!data);
        }
      }
    }

    checkSaved();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  async function handleSaveClick() {
    if (!user || saveSubmitting) return;

    setSaveSubmitting(true);

    // Optimistic update
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        const { error } = await supabase
          .from("saved_posts")
          .insert({
            post_id: id,
            user_id: user.id,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating saved status:", error);

      // Roll back on failure
      setSaved(!nextSaved);
    } finally {
      setSaveSubmitting(false);
    }
  }

  async function handleLikeClick() {
    if (!user || likeSubmitting) return;

    setLikeSubmitting(true);

    // Optimistic update
    const nextLiked = !liked;
    const nextLikeCount =
      likeCount + (nextLiked ? 1 : -1);

    setLiked(nextLiked);
    setLikeCount(nextLikeCount);

    // Notify parent/modal about the updated count
    onLikeChange?.(nextLikeCount);

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: id,
            user_id: user.id,
          });

        if (error) throw error;

        // Notify the post owner, unless they're liking their own post.
        if (userId && userId !== user.id) {
          void supabase
            .from("notifications")
            .insert({
              recipient_id: userId,
              sender_id: user.id,
              type: "like",
              entity_id: id,
            })
            .then(({ error: notificationError }) => {
              if (notificationError) {
                console.error(
                  "Error creating like notification:",
                  notificationError
                );
              }
            });
        }
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating like status:", error);

      // Roll back on failure
      const rollbackCount =
        nextLikeCount + (nextLiked ? -1 : 1);

      setLiked(!nextLiked);
      setLikeCount(rollbackCount);

      // Notify parent/modal about rollback
      onLikeChange?.(rollbackCount);
    } finally {
      setLikeSubmitting(false);
    }
  }

  async function handleDeletePost() {
    if (!user || !isOwner || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setShowMore(false);
      setConfirmDelete(false);

      if (onDeleted) {
        onDeleted(id);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setDeleteError(
        "Couldn't delete this post. Try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  function closeOptionsSheet() {
    setShowMore(false);
    setConfirmDelete(false);
    setDeleteError("");
  }

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
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-accent">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={username}
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  priority={priority}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon
                    size={22}
                    className="text-foreground/30"
                  />
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold text-sm">
                {username}
              </p>

              {location && (
                <p className="text-xs text-gray-500">
                  {location}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
            >
              <MoreHorizontal size={20} />
            </button>
          )}
        </div>

        {/* Post Image */}
        <div className="relative">
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

          {/* Image Carousel */}
          <div
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            style={{
              scrollSnapStop: "always",
            }}
            onScroll={handleImageScroll}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="
                  relative
                  min-w-full
                  shrink-0
                  aspect-square
                  snap-center
                  snap-always
                "
              >
                <Image
                  src={image}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={
                    priority && index === 0
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1 pt-2">
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
              type="button"
              onClick={handleLikeClick}
              disabled={likeSubmitting}
              className="flex items-center gap-1 disabled:opacity-60"
            >
              <Heart
                size={24}
                className={
                  liked
                    ? "fill-red-500 text-red-500"
                    : ""
                }
              />

              {likeCount > 0 && (
                <span className="pl-1 text-sm font-medium">
                  {formatCount(likeCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              className="flex items-center gap-1"
              onClick={onCommentClick}
            >
              <MessageCircle size={24} />

              {comments !== undefined &&
                comments > 0 && (
                  <span className="pl-1 text-sm font-medium">
                    {formatCount(comments)}
                  </span>
                )}
            </button>

            <button type="button">
              <Send size={24} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saveSubmitting}
            className="disabled:opacity-60"
          >
            <Bookmark
              size={24}
              className={
                saved ? "fill-foreground" : ""
              }
            />
          </button>
        </div>

        {/* Caption */}
        {caption && (
          <div className="px-3 pt-1 whitespace-pre-line break-words leading-tight">
            <span className="mr-2 font-semibold">
              {username}
            </span>

            <span>{caption}</span>
          </div>
        )}

        {/* Oshis */}
        {oshis.length > 0 && (
          <div className="px-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {oshis.map((oshi) => (
                <Link
                  key={oshi.id}
                  href={`/oshi/${oshi.id}`}
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
                  <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-background/50">
                    {oshi.image ? (
                      <Image
                        src={oshi.image}
                        alt={oshi.name}
                        width={20}
                        height={20}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon
                        size={13}
                        className="text-foreground/30"
                      />
                    )}
                  </div>

                  <span className="text-base font-medium">
                    {oshi.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fandoms */}
        {/*
        {fandoms.length > 0 && (
          <div className="px-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {fandoms.map((fandom) => (
                <Link
                  key={fandom.id}
                  href={`/fandom/${fandom.id}`}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-foreground/50
                    px-2.5
                    py-1.5
                  "
                >
                  <span className="text-white text-base font-medium">
                    {fandom.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        */}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="px-3 flex flex-wrap gap-x-3 gap-y-1">
            {hashtags.map((tag) => (
              <Link
                key={tag}
                href={`/hashtag/${tag}`}
                className="text-base font-medium"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Time */}
        <div className="px-3 pb-4 pt-1">
          <p className="text-sm text-foreground/65">
            {time}
          </p>
        </div>

        {showMore && isOwner && (
          <BottomSheet
            title={
              confirmDelete
                ? "Delete Post?"
                : "Options"
            }
            onClose={closeOptionsSheet}
            size="small"
          >
            {confirmDelete ? (
              <div className="w-full space-y-4">
                <p className="text-sm text-foreground/70">
                  This can't be undone. Your post,
                  comments, and likes will be permanently
                  removed.
                </p>

                {deleteError && (
                  <p className="text-sm text-red-500">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="
                      flex-1
                      h-11
                      rounded-xl
                      border
                      border-foreground/20
                      font-medium
                    "
                    onClick={() =>
                      setConfirmDelete(false)
                    }
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="
                      flex-1
                      h-11
                      rounded-xl
                      bg-red-500
                      font-semibold
                      text-white
                      disabled:opacity-60
                    "
                    onClick={handleDeletePost}
                    disabled={deleting}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <button
                  type="button"
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
                    router.push(`/edit_post/${id}`);
                  }}
                >
                  <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-accent">
                    <Pencil size={18} />
                  </div>

                  <span>Edit Post</span>
                </button>

                <Divider />

                <button
                  type="button"
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
                  onClick={() =>
                    setConfirmDelete(true)
                  }
                >
                  <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-red-500/15">
                    <Trash2
                      size={18}
                      className="text-red-500"
                    />
                  </div>

                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </BottomSheet>
        )}
      </article>
    </>
  );
}