"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import FollowingFeed from "@/components/FollowingFeed";
import ForYouFeed from "@/components/ForYouFeed";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import Divider from "@/components/Divider"
import PullToRefresh from "@/components/PullToRefresh";
import CreatePostButton from "@/components/CreatePostButton";
import CommentsSheet from "@/components/CommentsSheet";

async function refreshFeed() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // fetch posts here
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">("foryou");
  const { isLoggedIn, isLoading, user } = useSupabaseAuth();
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostOwnerId, setSelectedPostOwnerId] = useState<
    string | null
  >(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    let cancelled = false;

    async function fetchUnreadMessageCount() {
      const { data, error } = await supabase.rpc(
        "get_unread_message_count"
      );

      if (!cancelled) {
        if (error) {
          console.error(
            "Error fetching unread message count:",
            error
          );
        } else {
          setUnreadMessageCount(data ?? 0);
        }
      }
    }

    fetchUnreadMessageCount();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) {
    return (
      <main className="pb-4 flex items-center justify-center min-h-screen">
        <p className="text-foreground">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  function openComments(postId: string, ownerId: string) {
    setSelectedPostId(postId);
    setSelectedPostOwnerId(ownerId);
  }

  return (
    <main className="pb-4">
      {/* Logo */}
      <div className="relative p-4">
        <h1 className="font-sacramento text-4xl text-center text-foreground">
          OshiCappu
        </h1>

        <Link
          href="/messages"
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <MessageCircle size={24} />

          {unreadMessageCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadMessageCount > 9
                ? "9+"
                : unreadMessageCount}
            </span>
          )}
        </Link>
      </div>

      {/* Following / For You Tabs */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex">
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 relative ${
              activeTab === "following"
                ? "font-bold text-foreground text-lg"
                : "font-bold text-foreground/50 text-lg"
            }`}
          >
            Following

            {activeTab === "following" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-secondary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("foryou")}
            className={`flex-1 py-3 relative ${
              activeTab === "foryou"
                ? "font-bold text-foreground text-lg"
                : "font-bold text-foreground/50 text-lg"
            }`}
          >
            For You

            {activeTab === "foryou" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-secondary rounded-full" />
            )}
          </button>
        </div>

        <Divider/>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto pb-14">
        <PullToRefresh onRefresh={refreshFeed}>
          <div className="min-h-[70vh]">
            {activeTab === "following" ? (
              <FollowingFeed onCommentClick={openComments}/>
            ) : (
              <ForYouFeed onCommentClick={openComments}/>
            )}
          </div>
        </PullToRefresh>
      </div>
      {selectedPostId && (
        <CommentsSheet
          postId={selectedPostId}
          postOwnerId={selectedPostOwnerId ?? undefined}
          onClose={() => {
            setSelectedPostId(null);
            setSelectedPostOwnerId(null);
          }}
        />
      )}
      <CreatePostButton />
    </main>
  );
}