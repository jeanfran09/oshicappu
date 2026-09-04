"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, User as UserIcon } from "lucide-react";

import Divider from "@/components/Divider";
import PullToRefresh from "@/components/PullToRefresh";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { formatTimeAgo } from "@/utils/formatNumber";

type ConversationRow = {
  conversation_id: string;
  other_user_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export default function MessagesInboxPage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<
    ConversationRow[]
  >([]);
  const [loading, setLoading] = useState(true);

  async function fetchConversations() {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase.rpc(
      "get_conversations"
    );

    if (error) {
      console.error(
        "Error fetching conversations:",
        error
      );
      setConversations([]);
    } else {
      setConversations(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Messages
        </h1>
      </header>

      <PullToRefresh onRefresh={fetchConversations}>
        <div className="min-h-[80vh] pb-16">
          {loading ? (
            <p className="p-4 text-center text-sm text-foreground/40">
              Loading...
            </p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-foreground/40">
              No messages yet. Visit a profile and tap
              Message to start a conversation.
            </p>
          ) : (
            conversations.map((conversation, index) => (
              <div key={conversation.conversation_id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/messages/${conversation.conversation_id}`
                    )
                  }
                  className={`flex w-full items-center gap-3 p-4 text-left ${
                    conversation.unread_count > 0
                      ? "bg-accent/15"
                      : ""
                  }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-accent">
                    {conversation.other_avatar_url ? (
                      <Image
                        src={
                          conversation.other_avatar_url
                        }
                        alt={conversation.other_username}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserIcon
                          size={24}
                          className="text-foreground/30"
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">
                      {conversation.other_display_name ||
                        conversation.other_username}
                    </p>

                    <p
                      className={`truncate text-sm ${
                        conversation.unread_count > 0
                          ? "font-medium text-foreground"
                          : "text-foreground/50"
                      }`}
                    >
                      {conversation.last_message ??
                        "Say hi 👋"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {conversation.last_message_at && (
                      <span className="text-xs text-foreground/40">
                        {formatTimeAgo(
                          conversation.last_message_at
                        )}
                      </span>
                    )}

                    {conversation.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-secondary px-1.5 text-[11px] font-semibold">
                        {conversation.unread_count > 9
                          ? "9+"
                          : conversation.unread_count}
                      </span>
                    )}
                  </div>
                </button>

                {index < conversations.length - 1 && (
                  <Divider />
                )}
              </div>
            ))
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
