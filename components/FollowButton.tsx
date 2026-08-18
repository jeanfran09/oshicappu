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

  /*
   * Only check Supabase ourselves when the parent
   * did NOT provide the initial follow state.
   */
  useEffect(() => {
    if (initialIsFollowing !== undefined) {
      setIsFollowing(initialIsFollowing);
      setChecking(false);
      return;
    }

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

      if (cancelled) return;

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

    checkFollowing();

    return () => {
      cancelled = true;
    };
  }, [user, targetUserId, initialIsFollowing]);

  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleClick = async () => {
    if (checking || submitting) return;

    const previousState = isFollowing;
    const nextState = !previousState;

    /*
     * Optimistic update.
     *
     * The button changes immediately without waiting
     * for Supabase.
     */
    setIsFollowing(nextState);
    onChange?.(nextState);

    setSubmitting(true);

    try {
      if (nextState) {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) {
          throw error;
        }

        // Create notification without blocking the UI.
        void supabase
          .from("notifications")
          .insert({
            recipient_id: targetUserId,
            sender_id: user.id,
            type: "follow",
          })
          .then(({ error: notificationError }) => {
            if (notificationError) {
              console.error(
                "Error creating follow notification:",
                notificationError
              );
            }
          });
      } else {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error(
        "Error updating follow status:",
        error
      );

      /*
       * Supabase failed, so restore the previous state.
       */
      setIsFollowing(previousState);
      onChange?.(previousState);
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
        text-base

        ${
          isFollowing
            ? "border border-foreground/20 bg-accent/50 text-foreground"
            : "bg-accent text-foreground"
        }

        ${className}
      `}
    >
      {checking
        ? "Follow"
        : isFollowing
          ? "Following"
          : "Follow"}
    </button>
  );
}