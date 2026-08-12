"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

type Props = {
  targetUserId: string;
  initialIsFollowing?: boolean;
  className?: string;
  onChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  className = "",
  onChange,
}: Props) {
  const { user } = useSupabaseAuth();

  const [isFollowing, setIsFollowing] = useState(
    initialIsFollowing ?? false
  );
  const [checking, setChecking] = useState(
    initialIsFollowing === undefined
  );
  const [submitting, setSubmitting] = useState(false);

  // If the caller didn't already know the follow state, check it.
  useEffect(() => {
    if (initialIsFollowing !== undefined) return;
    if (!user || user.id === targetUserId) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function checkFollowing() {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error(
            "Error checking follow status:",
            error
          );
        } else {
          setIsFollowing(!!data);
        }
        setChecking(false);
      }
    }

    checkFollowing();

    return () => {
      cancelled = true;
    };
  }, [user, targetUserId, initialIsFollowing]);

  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleClick = async () => {
    if (submitting || checking) return;

    setSubmitting(true);

    // Optimistic update
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    onChange?.(nextState);

    try {
      if (nextState) {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        // Best-effort follow notification; ignore failures.
        supabase
          .from("notifications")
          .insert({
            recipient_id: targetUserId,
            sender_id: user.id,
            type: "follow",
          })
          .then(({ error: notifError }) => {
            if (notifError) {
              console.error(
                "Error creating follow notification:",
                notifError
              );
            }
          });
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;
      }
    } catch (error) {
      console.error(
        "Error updating follow status:",
        error
      );

      // Roll back on failure
      setIsFollowing(!nextState);
      onChange?.(!nextState);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking || submitting}
      className={`
        h-9
        rounded-lg
        px-4
        font-medium
        transition-colors
        disabled:opacity-60
        ${
          isFollowing
            ? "border border-foreground/20 text-foreground bg-accent/50"
            : "bg-accent-secondary text-foreground"
        }
        ${className}
      `}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}