"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, X } from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import FollowButton from "@/components/FollowButton";

type User = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type UserListProps = {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
};

export default function UserList({
  userId,
  type,
  onClose,
}: UserListProps) {
  const router = useRouter();
  const { user: currentUser } = useSupabaseAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(
    new Set()
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        let formattedUsers: User[] = [];

        // --------------------------------
        // Fetch followers / following
        // --------------------------------
        if (type === "followers") {
          const { data, error } = await supabase
            .from("follows")
            .select(`
              follower_id,
              profiles:follower_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq("following_id", userId);

          if (error) {
            throw error;
          }

          formattedUsers = (data ?? [])
            .map((row: any) => row.profiles)
            .filter(Boolean);
        } else {
          const { data, error } = await supabase
            .from("follows")
            .select(`
              following_id,
              profiles:following_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq("follower_id", userId);

          if (error) {
            throw error;
          }

          formattedUsers = (data ?? [])
            .map((row: any) => row.profiles)
            .filter(Boolean);
        }

        setUsers(formattedUsers);

        // --------------------------------
        // Fetch current user's follows
        // --------------------------------
        if (currentUser) {
          const targetIds = formattedUsers.map(
            (profile) => profile.id
          );

          if (targetIds.length > 0) {
            const {
              data: followData,
              error: followError,
            } = await supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", currentUser.id)
              .in("following_id", targetIds);

            if (followError) {
              console.error(
                "Error fetching follow statuses:",
                followError
              );
            } else {
              setFollowingIds(
                new Set(
                  (followData ?? []).map(
                    (row) => row.following_id
                  )
                )
              );
            }
          } else {
            setFollowingIds(new Set());
          }
        } else {
          setFollowingIds(new Set());
        }
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);

        setError(
          `Failed to load ${
            type === "followers"
              ? "followers"
              : "following"
          }.`
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [userId, type, currentUser]);

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleFollowChange = (
    targetUserId: string,
    isFollowing: boolean
  ) => {
    setFollowingIds((previous) => {
      const next = new Set(previous);

      if (isFollowing) {
        next.add(targetUserId);
      } else {
        next.delete(targetUserId);
      }

      return next;
    });
  };

  // --------------------------------
  // Filter users based on search
  // --------------------------------
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      user.username.toLowerCase().includes(query) ||
      user.display_name.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        duration: 0.10,
        ease: "easeOut",
      }}
      className="fixed inset-0 z-[999] flex flex-col bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <p className="font-semibold">
          {type === "followers"
            ? "Followers"
            : "Following"}
        </p>
      </header>

      {/* Search Bar */}
      <div className="bg-background px-4 py-3">
        <div className="flex h-10 items-center gap-2 rounded-lg bg-accent/50 px-3">
          <Search
            size={18}
            className="shrink-0 text-foreground/50"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder={"Search"}
            className="
              min-w-0
              flex-1
              bg-transparent
              text-sm
              outline-none
              placeholder:text-foreground/50
            "
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            >
              <X
                size={16}
                className="text-foreground/50"
              />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="px-4 py-3">
          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <p className="text-sm text-foreground/60">
                Loading...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex justify-center py-8">
              <p className="text-sm text-red-500">
                {error}
              </p>
            </div>
          )}

          {/* No users */}
          {!loading &&
            !error &&
            users.length === 0 && (
              <div className="flex justify-center py-8">
                <p className="text-sm text-foreground/60">
                  {type === "followers"
                    ? "No followers yet."
                    : "Not following anyone yet."}
                </p>
              </div>
            )}

          {/* No search results */}
          {!loading &&
            !error &&
            users.length > 0 &&
            filteredUsers.length === 0 && (
              <div className="flex justify-center py-8">
                <p className="text-sm text-foreground/60">
                  No users found.
                </p>
              </div>
            )}

          {/* Users */}
          {!loading &&
            !error &&
            filteredUsers.length > 0 && (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2"
                  >
                    {/* User information */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUserClick(
                          user.username
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {/* Avatar */}
                      <div className="relative h-17 w-17 shrink-0 overflow-hidden rounded-full bg-accent/20">
                        <Image
                          src={
                            user.avatar_url ??
                            "/icons/temp.jpg"
                          }
                          alt={`${user.username}'s avatar`}
                          fill
                          sizes="68px"
                          className="object-cover"
                        />
                      </div>

                      {/* Username + display name */}
                      <div className="min-w-0">
                        <p className="text-base font-bold">
                          {user.username}
                        </p>

                        <p className="-mt-0.5 truncate text-base text-foreground/75">
                          {user.display_name}
                        </p>
                      </div>
                    </button>

                    {/* Follow button */}
                    {currentUser &&
                      currentUser.id !== user.id && (
                        <FollowButton
                          targetUserId={user.id}
                          initialIsFollowing={followingIds.has(
                            user.id
                          )}
                          onChange={(isFollowing) =>
                            handleFollowChange(
                              user.id,
                              isFollowing
                            )
                          }
                          className="h-9 shrink-0 px-4"
                        />
                      )}
                  </div>
                ))}
              </div>
            )}
        </main>
      </div>
    </motion.div>
  );
}