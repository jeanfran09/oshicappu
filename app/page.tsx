"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircleMore } from "lucide-react";

import FollowingFeed from "@/components/FollowingFeed";
import ForYouFeed from "@/components/ForYouFeed";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import Divider from "@/components/Divider";
import PullToRefresh from "@/components/PullToRefresh";
import CreatePostButton from "@/components/CreatePostButton";
import CommentsSheet from "@/components/CommentsSheet";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"following" | "foryou">(
    "foryou"
  );
  const [followingRefreshKey, setFollowingRefreshKey] = useState(0);
  const [forYouRefreshKey, setForYouRefreshKey] = useState(0);

  const { isLoggedIn, isLoading, user } = useSupabaseAuth();
  const router = useRouter();

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostOwnerId, setSelectedPostOwnerId] = useState<
    string | null
  >(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const userId = user?.id;

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (!userId) {
      setUnreadMessageCount(0);
      return;
    }

    let cancelled = false;

    async function fetchUnreadMessageCount() {
      const { data, error } = await supabase.rpc(
        "get_unread_message_count"
      );

      if (cancelled) return;

      if (error) {
        console.error("Error fetching unread message count:", error);
      } else {
        setUnreadMessageCount(data ?? 0);
      }
    }

    void fetchUnreadMessageCount();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function refreshFeed() {
    if (activeTab === "following") {
      setFollowingRefreshKey((previous) => previous + 1);
    } else {
      setForYouRefreshKey((previous) => previous + 1);
    }
  }

  function openComments(postId: string, ownerId: string) {
    setSelectedPostId(postId);
    setSelectedPostOwnerId(ownerId);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-4">
        <p className="text-foreground">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <main className="pb-4">
      {/* Logo */}
      <div className="relative p-4">
        <h1 className="text-center font-sacramento text-4xl text-foreground">
          OshiCappu
        </h1>

        <Link
          href="/messages"
          aria-label="Messages"
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <MessageCircleMore size={24} />

          {unreadMessageCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
            </span>
          )}
        </Link>
      </div>

      {/* Following / For You Tabs */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("following")}
            aria-pressed={activeTab === "following"}
            className={`relative flex-1 py-3 text-lg font-bold ${
              activeTab === "following"
                ? "text-foreground"
                : "text-foreground/50"
            }`}
          >
            Following

            {activeTab === "following" && (
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-accent-secondary" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("foryou")}
            aria-pressed={activeTab === "foryou"}
            className={`relative flex-1 py-3 text-lg font-bold ${
              activeTab === "foryou"
                ? "text-foreground"
                : "text-foreground/50"
            }`}
          >
            For You

            {activeTab === "foryou" && (
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-accent-secondary" />
            )}
          </button>
        </div>

        <Divider />
      </div>

      {/* Feed */}
      <div className="pb-14">
        <PullToRefresh onRefresh={refreshFeed}>
          <div className="min-h-[70vh]">
            <div
              className={activeTab === "following" ? "block" : "hidden"}
              aria-hidden={activeTab !== "following"}
            >
              <FollowingFeed
                onCommentClick={openComments}
                refreshKey={followingRefreshKey}
              />
            </div>

            <div
              className={activeTab === "foryou" ? "block" : "hidden"}
              aria-hidden={activeTab !== "foryou"}
            >
              <ForYouFeed
                onCommentClick={openComments}
                refreshKey={forYouRefreshKey}
              />
            </div>
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