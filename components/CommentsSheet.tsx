"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X,
  Send,
  User as UserIcon,
  Trash2,
  Flag,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { formatCommentTime } from "@/utils/formatNumber";
import Link from "next/link";

type CommentWithAuthor = {
  id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_comment_id: string | null;
  username: string;
  avatar_url: string | null;
  replyToUsername: string | null;
};

type UserProfile = {
  username: string;
  avatar_url: string | null;
};

type Props = {
  postId: string;
  onClose: () => void;
  size?: "small" | "large";
};

export default function CommentsSheet({
  postId,
  onClose,
  size = "large",
}: Props) {
  const { user } = useSupabaseAuth();

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const [replyingTo, setReplyingTo] =
    useState<CommentWithAuthor | null>(null);

  const [editingComment, setEditingComment] =
    useState<CommentWithAuthor | null>(null);

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchComments();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  /*
   * Fetch current user's profile for the PFP
   * beside the comment input.
   */
  useEffect(() => {
    async function fetchCurrentUserProfile() {
      if (!user) {
        setCurrentUserProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(
          "Error fetching current user profile:",
          error
        );
        return;
      }

      setCurrentUserProfile(data);
    }

    fetchCurrentUserProfile();
  }, [user]);

  /*
   * Close options menu when clicking/tapping outside.
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent | TouchEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "touchstart",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "touchstart",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * Automatically resize textarea.
   */
  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const maxHeight = 120;

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      maxHeight
    )}px`;
  }

  async function fetchComments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, comment_text, created_at, updated_at, user_id, parent_comment_id"
      )
      .eq("post_id", postId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error fetching comments:",
        error
      );

      setLoading(false);
      return;
    }

    const rows = data ?? [];

    const userIds = Array.from(
      new Set(rows.map((r) => r.user_id))
    );

    let profilesById: Record<
      string,
      {
        username: string;
        avatar_url: string | null;
      }
    > = {};

    if (userIds.length > 0) {
      const {
        data: profilesData,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "Error fetching comment authors:",
          profilesError
        );
      } else {
        profilesById = Object.fromEntries(
          (profilesData ?? []).map((p) => [
            p.id,
            {
              username: p.username,
              avatar_url: p.avatar_url,
            },
          ])
        );
      }
    }

    /*
     * Map comment ID -> author ID.
     * Used to determine who a reply is directed to.
     */
    const commentAuthorById: Record<string, string> =
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          row.user_id,
        ])
      );

    setComments(
      rows.map((r) => {
        let replyToUsername: string | null = null;

        if (r.parent_comment_id) {
          const parentUserId =
            commentAuthorById[r.parent_comment_id];

          replyToUsername = parentUserId
            ? profilesById[parentUserId]?.username ??
              null
            : null;
        }

        return {
          ...r,

          username:
            profilesById[r.user_id]?.username ??
            "unknown",

          avatar_url:
            profilesById[r.user_id]?.avatar_url ??
            null,

          replyToUsername,
        };
      })
    );

    setLoading(false);
  }

  /*
   * Create a new comment or reply.
   */
  async function handlePostComment() {
    if (
      !user ||
      !newComment.trim() ||
      posting
    ) {
      return;
    }

    setPosting(true);

    /*
     * Keep replies to one level.
     */
    const parentCommentId =
      replyingTo?.parent_comment_id ??
      replyingTo?.id ??
      null;

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        comment_text: newComment.trim(),
        parent_comment_id: parentCommentId,
      });

    if (error) {
      console.error(
        "Error posting comment:",
        error
      );
    } else {
      setNewComment("");
      setReplyingTo(null);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await fetchComments();
    }

    setPosting(false);
  }

  /*
   * Start editing a comment.
   */
  function handleStartEdit(
    comment: CommentWithAuthor
  ) {
    setEditingComment(comment);
    setNewComment(comment.comment_text);

    setReplyingTo(null);
    setOpenMenuId(null);

    /*
     * Resize after React puts the text into
     * the textarea.
     */
    setTimeout(() => {
      resizeTextarea();
      textareaRef.current?.focus();
    }, 0);
  }

  /*
   * Cancel editing.
   */
  function handleCancelEdit() {
    setEditingComment(null);
    setNewComment("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  /*
   * Update an existing comment.
   */
  async function handleEditComment() {
    if (
      !user ||
      !editingComment ||
      !newComment.trim() ||
      posting
    ) {
      return;
    }

    setPosting(true);

    const { error } = await supabase
      .from("comments")
      .update({
        comment_text: newComment.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingComment.id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Error editing comment:",
        error
      );
    } else {
      setEditingComment(null);
      setNewComment("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await fetchComments();
    }

    setPosting(false);
  }

  /*
   * Delete a comment.
   */
  async function handleDeleteComment(
    commentId: string
  ) {
    if (!user) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Error deleting comment:",
        error
      );
      return;
    }

    setOpenMenuId(null);

    await fetchComments();
  }

  /*
   * Report a comment.
   */
  function handleReportComment(
    commentId: string
  ) {
    console.log(
      "Report comment:",
      commentId
    );

    setOpenMenuId(null);
  }

  /*
   * Close the entire sheet.
   */
  function closeSheet() {
    if (closing) return;

    setClosing(true);

    setTimeout(() => {
      onClose();
    }, 150);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end bg-black/60"
      onClick={closeSheet}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{
          y: closing ? "100%" : 0,
        }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        drag="y"
        dragConstraints={{
          top: 0,
          bottom: 300,
        }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) {
            closeSheet();
          }
        }}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-3xl bg-background ${
          size === "small"
            ? "h-[67vh]"
            : "h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
          <div className="h-1.5 w-12 rounded-full bg-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 pb-3">
          <h2 className="text-base font-semibold">
            Comments
          </h2>

          <button
            type="button"
            onClick={closeSheet}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comments */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-foreground/50">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground/50">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => {
                const isReply =
                  c.parent_comment_id !== null;

                const isOwnComment =
                  user?.id === c.user_id;

                /*
                 * A comment is edited if updated_at
                 * is different from created_at.
                 */
                const isEdited =
                  new Date(c.updated_at).getTime() !==
                  new Date(c.created_at).getTime();

                return (
                  <div
                    key={c.id}
                    className={`flex gap-3 whitespace-pre-line ${
                      isReply ? "ml-10" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <Link
                      href={`/profile/${c.username}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/30"
                    >
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar_url}
                          alt={c.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon
                          size={16}
                          className="text-foreground/30"
                        />
                      )}
                    </Link>

                    {/* Comment content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words text-base">
                          {/* Author */}
                          <Link
                            href={`/profile/${c.username}`}
                          >
                            <span className="mr-2 font-semibold">
                              {c.username}
                            </span>
                          </Link>

                          {/* Replied-to username */}
                          {c.replyToUsername && (
                            <>
                              <Link
                                href={`/profile/${c.replyToUsername}`}
                                className="mr-1 text-accent-secondary"
                              >
                                @{c.replyToUsername}
                              </Link>{" "}
                            </>
                          )}

                          {/* Comment */}
                          {c.comment_text}
                        </p>

                        {/* More options */}
                        <div
                          ref={
                            openMenuId === c.id
                              ? menuRef
                              : null
                          }
                          className="relative shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === c.id
                                  ? null
                                  : c.id
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/50 hover:bg-accent"
                            aria-label="More options"
                          >
                            <MoreHorizontal
                              size={18}
                            />
                          </button>

                          {openMenuId === c.id && (
                            <div className="absolute right-0 top-8 z-20 w-max min-w-[150px] overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-lg">
                              {isOwnComment ? (
                                <>
                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartEdit(c)
                                    }
                                    className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                                  >
                                    <Pencil
                                      size={15}
                                    />

                                    <span className="px-2">
                                      Edit Comment
                                    </span>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(
                                        c.id
                                      )
                                    }
                                    className="flex w-full items-center px-3 py-2 text-left text-sm text-red-500 hover:bg-accent"
                                  >
                                    <Trash2
                                      size={15}
                                    />

                                    <span className="px-2">
                                      Delete Comment
                                    </span>
                                  </button>
                                </>
                              ) : (
                                /* Report */
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReportComment(
                                      c.id
                                    )
                                  }
                                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                                >
                                  <Flag
                                    size={15}
                                  />

                                  <span className="px-2">
                                    Report Comment
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time + Edited + Reply */}
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-sm text-foreground/40">
                          {formatCommentTime(
                            c.created_at
                          )}
                        </p>

                        {isEdited && (
                          <span className="text-sm text-foreground/40">
                            Edited
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingComment(null);
                            setNewComment("");
                            setReplyingTo(c);

                            if (textareaRef.current) {
                              textareaRef.current.style.height =
                                "auto";
                            }
                          }}
                          className="text-sm font-semibold text-foreground/50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comment Input */}
        {user && (
          <div className="shrink-0 border-t border-foreground/10 px-4 py-3">
            {/* Editing indicator */}
            {editingComment && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2 text-xs">
                <span className="text-foreground/60">
                  Editing your comment
                </span>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="font-semibold text-foreground/50"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Replying indicator */}
            {!editingComment && replyingTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2 text-xs">
                <span className="text-foreground/60">
                  Replying to{" "}
                  <Link
                    href={`/profile/${replyingTo.username}`}
                    className="font-semibold text-foreground"
                  >
                    @{replyingTo.username}
                  </Link>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(null)
                  }
                  className="font-semibold text-foreground/50"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Current user's PFP */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/30">
                {currentUserProfile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUserProfile.avatar_url}
                    alt={
                      currentUserProfile.username
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon
                    size={18}
                    className="text-foreground/30"
                  />
                )}
              </div>

              {/* Input */}
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  resizeTextarea();
                }}
                placeholder={
                  editingComment
                    ? "Edit your comment..."
                    : replyingTo
                    ? "Add a reply..."
                    : "Add a comment..."
                }
                rows={1}
                className="min-h-[38px] max-h-[120px] flex-1 resize-none overflow-y-auto rounded-2xl border border-foreground/20 bg-transparent px-4 py-2 text-base leading-5 outline-none no-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (editingComment) {
                      handleEditComment();
                    } else {
                      handlePostComment();
                    }
                  }
                }}
              />

              {/* Send */}
              <button
                type="button"
                onClick={
                  editingComment
                    ? handleEditComment
                    : handlePostComment
                }
                disabled={
                  !newComment.trim() ||
                  posting
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-foreground disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}