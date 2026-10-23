"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CreatePostButton from "@/components/CreatePostButton";
import Divider from "@/components/Divider";
import Notification from "@/components/Notification";
import PullToRefresh from "@/components/PullToRefresh";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { formatTimeAgo, parsePostImages } from "@/utils/formatNumber";
import NotificationSkeleton from "@/components/Skeleton/NotificationSkeleton";

type NotificationRow = {
  id: string;
  type: "like" | "comment" | "follow";
  sender_id: string | null;
  entity_id: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
};

type FeedNotification = {
  id: string;
  type: "like" | "comment" | "follow";
  username: string;
  avatar: string | null;
  content?: string;
  time: string;
  image: string | null;
  read: boolean;
  senderUsername: string | null;
  postId: string | null;
};

export default function NotifsPage() {
  const { user } = useSupabaseAuth();
  const userId = user?.id;
  const router = useRouter();

  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId) {
      void fetchNotifications();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchNotifications() {
    if (!userId) return;

    // Keep existing notifications visible during refreshes and tab refocuses.
    if (loadedUserIdRef.current !== userId) {
      setLoading(true);
    }

    const { data: rows, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        sender_id,
        entity_id,
        content,
        read,
        created_at,
        sender:profiles!notifications_sender_id_fkey (
          username,
          avatar_url
        )
        `
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      loadedUserIdRef.current = userId;
      setLoading(false);
      return;
    }

    const entityIds = Array.from(
      new Set(
        (rows ?? [])
          .filter(
            (row: any) =>
              (row.type === "like" || row.type === "comment") &&
              row.entity_id
          )
          .map((row: any) => row.entity_id as string)
      )
    );

    let postImageById = new Map<string, string | null>();

    if (entityIds.length > 0) {
      const { data: postRows, error: postError } = await supabase
        .from("posts")
        .select("id, image_url")
        .in("id", entityIds);

      if (postError) {
        console.error("Error fetching notification posts:", postError);
      } else {
        postImageById = new Map(
          (postRows ?? []).map((post) => [
            post.id,
            parsePostImages(post.image_url)[0] ?? null,
          ])
        );
      }
    }

    const mapped: FeedNotification[] = (rows ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      username: row.sender?.username ?? "Someone",
      avatar: row.sender?.avatar_url ?? null,
      content: row.content ?? undefined,
      time: formatTimeAgo(row.created_at),
      image:
        row.type === "like" || row.type === "comment"
          ? postImageById.get(row.entity_id) ?? null
          : null,
      read: row.read,
      senderUsername: row.sender?.username ?? null,
      postId:
        row.type === "like" || row.type === "comment"
          ? row.entity_id
          : null,
    }));

    setNotifications(mapped);
    loadedUserIdRef.current = userId;
    setLoading(false);

    // Mark unread notifications as read in the background.
    const unreadIds = (rows ?? [])
      .filter((row: any) => !row.read)
      .map((row: any) => row.id);

    if (unreadIds.length > 0) {
      void supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds)
        .then(({ error: readError }) => {
          if (readError) {
            console.error("Error marking notifications as read:", readError);
          }
        });
    }
  }

  function handleNotificationClick(notification: FeedNotification) {
    // Like notifications open the post.
    if (notification.type === "like" && notification.postId) {
      router.push(`/post/${notification.postId}`);
      return;
    }

    // Comment notifications open the post with the comments sheet.
    if (notification.type === "comment" && notification.postId) {
      router.push(`/post/${notification.postId}?comments=true`);
      return;
    }

    // Follow notifications open the sender's profile.
    if (notification.type === "follow" && notification.senderUsername) {
      router.push(`/${notification.senderUsername}`);
    }
  }

  return (
    <main>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background">
        <h1 className="px-4 py-3 text-xl font-bold">Notifications</h1>
        <Divider />
      </header>

      <PullToRefresh onRefresh={fetchNotifications}>
        <div className="min-h-[80vh] pb-16">
          {loading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-foreground/40">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                <Notification
                  type={notification.type}
                  username={notification.username}
                  avatar={notification.avatar}
                  content={notification.content}
                  image={notification.image}
                  time={notification.time}
                  read={notification.read}
                  onClick={() => handleNotificationClick(notification)}
                />

                {index < notifications.length - 1 && <Divider />}
              </div>
            ))
          )}
        </div>
      </PullToRefresh>

      <CreatePostButton />
    </main>
  );
}