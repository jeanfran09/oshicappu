"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User as UserIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import FollowButton from "@/components/FollowButton";

type UserResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type UserResultsProps = {
  query?: string;
};

export default function UserResults({
  query = "",
}: UserResultsProps) {
  const router = useRouter();
  const { user: currentUser } = useSupabaseAuth();

  const [users, setUsers] = useState<UserResult[]>([]);
  const [followingIds, setFollowingIds] = useState<
    Set<string>
  >(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const term = query?.trim() ?? "";

    if (!term) {
      setUsers([]);
      setFollowingIds(new Set());
      setLoading(false);
      return;
    }

    async function searchUsers() {
      setLoading(true);

      try {
        /*
         * Search users
         *
         * Exclude the currently logged-in user's
         * profile from the results.
         */
        let usersQuery = supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url"
          )
          .or(
            `username.ilike.%${term}%,display_name.ilike.%${term}%`
          );

        if (currentUser) {
          usersQuery = usersQuery.neq(
            "id",
            currentUser.id
          );
        }

        const { data, error } =
          await usersQuery.limit(20);

        if (error) {
          throw error;
        }

        const foundUsers = data ?? [];

        setUsers(foundUsers);

        /*
         * Get current user's following status
         */
        if (
          currentUser &&
          foundUsers.length > 0
        ) {
          const { data: followRows, error: followError } =
            await supabase
              .from("follows")
              .select("following_id")
              .eq(
                "follower_id",
                currentUser.id
              )
              .in(
                "following_id",
                foundUsers.map(
                  (user) => user.id
                )
              );

          if (followError) {
            console.error(
              "Error fetching follow status:",
              followError
            );

            setFollowingIds(new Set());
          } else {
            setFollowingIds(
              new Set(
                (followRows ?? []).map(
                  (row) => row.following_id
                )
              )
            );
          }
        } else {
          setFollowingIds(new Set());
        }
      } catch (error) {
        console.error(
          "Error searching users:",
          error
        );

        setUsers([]);
        setFollowingIds(new Set());
      } finally {
        setLoading(false);
      }
    }

    searchUsers();
  }, [query, currentUser]);

  const handleUserClick = (
    username: string
  ) => {
    router.push(`/profile/${username}`);
  };

  const handleFollowChange = (
    userId: string,
    isFollowing: boolean
  ) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);

      if (isFollowing) {
        next.add(userId);
      } else {
        next.delete(userId);
      }

      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          Searching users...
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          No users found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="ml-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2"
        >
          {/* User information */}
          <button
            type="button"
            onClick={() =>
              handleUserClick(user.username)
            }
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            {/* Avatar */}
            <div className="relative h-17 w-17 shrink-0 overflow-hidden rounded-full bg-accent">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={`${user.username}'s avatar`}
                  fill
                  sizes="68px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon
                    size={40}
                    className="text-foreground/30"
                  />
                </div>
              )}
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
                className="h-9 w-30 shrink-0 px-4"
              />
            )}
        </div>
      ))}
    </div>
  );
}