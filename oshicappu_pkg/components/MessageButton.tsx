"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

type Props = {
  targetUserId: string;
  className?: string;
};

export default function MessageButton({
  targetUserId,
  className = "",
}: Props) {
  const { user } = useSupabaseAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  if (!user || user.id === targetUserId) {
    return null;
  }

  async function handleClick() {
    if (loading) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "get_or_create_conversation",
        { other_user_id: targetUserId }
      );

      if (error) throw error;

      if (data) {
        router.push(`/messages/${data}`);
      }
    } catch (error) {
      console.error(
        "Error starting conversation:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`
        h-9
        rounded-lg
        border
        border-foreground/20
        px-4
        text-base
        font-medium
        disabled:opacity-60
        ${className}
      `}
    >
      Message
    </button>
  );
}
