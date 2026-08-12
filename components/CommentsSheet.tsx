"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { formatTimeAgo } from "@/utils/formatNumber";
import Link from "next/link";

type CommentWithAuthor = {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
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
  const [closing, setClosing] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  function closeSheet() {
    setClosing(true);
    setTimeout(onClose, 150);
  }

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function fetchComments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select("id, comment_text, created_at, user_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

    let profilesById: Record<
      string,
      { username: string; avatar_url: string | null }
    > = {};

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching comment authors:", profilesError);
      } else {
        profilesById = Object.fromEntries(
          (profilesData ?? []).map((p) => [
            p.id,
            { username: p.username, avatar_url: p.avatar_url },
          ])
        );
      }
    }

    setComments(
      rows.map((r) => ({
        ...r,
        username: profilesById[r.user_id]?.username ?? "unknown",
        avatar_url: profilesById[r.user_id]?.avatar_url ?? null,
      }))
    );

    setLoading(false);
  }

  async function handlePostComment() {
    if (!user || !newComment.trim() || posting) return;

    setPosting(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      comment_text: newComment.trim(),
    });

    if (error) {
      console.error("Error posting comment:", error);
    } else {
      setNewComment("");
      await fetchComments();
    }

    setPosting(false);
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end bg-black/60"
      onClick={closeSheet}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: closing ? "100%" : 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120) closeSheet();
        }}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-3xl bg-background ${
          size === "small" ? "h-[67vh]" : "h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
          <div className="h-1.5 w-12 rounded-full bg-foreground/30" />
        </div>

        <div className="flex items-center justify-between border-b border-foreground/10 px-4 pb-3">
          <h2 className="text-base font-semibold">Comments</h2>

          <button
            type="button"
            onClick={closeSheet}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent"
          >
            <X size={16} />
          </button>
        </div>

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
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Link href={`/profile/${c.username}`} className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/30">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatar_url}
                        alt={c.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon size={16} className="text-foreground/30" />
                    )}
                  </Link>

                  <div>
                    <p className="text-sm">
                      <Link href={`/profile/${c.username}`}>
                        <span className="mr-2 font-semibold">
                          {c.username}
                        </span>
                      </Link>
                      {c.comment_text}
                    </p>
                    <p className="mt-1 text-xs uppercase text-foreground/40">
                      {formatTimeAgo(c.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="shrink-0 border-t border-foreground/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-full border border-foreground/20 bg-transparent px-4 py-2 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePostComment();
                }}
              />

              <button
                type="button"
                onClick={handlePostComment}
                disabled={!newComment.trim() || posting}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-secondary text-white disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}