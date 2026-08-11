"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User as UserIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import CreatePostButton from "@/components/CreatePostButton";
import FollowButton from "@/components/FollowButton";

type SearchResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  isFollowing: boolean;
};

export default function SearchPage() {
  const { user } = useSupabaseAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeout = setTimeout(async () => {
      let usersQuery = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(
          `username.ilike.%${term}%,display_name.ilike.%${term}%`
        )
        .limit(20);

      if (user) {
        usersQuery = usersQuery.neq("id", user.id);
      }

      const { data: users, error } = await usersQuery;

      if (error) {
        console.error("Error searching users:", error);
        setResults([]);
        setLoading(false);
        setSearched(true);
        return;
      }

      let followingIds = new Set<string>();

      if (user && users && users.length > 0) {
        const { data: followRows, error: followError } =
          await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .in(
              "following_id",
              users.map((u) => u.id)
            );

        if (followError) {
          console.error(
            "Error fetching follow status:",
            followError
          );
        } else {
          followingIds = new Set(
            (followRows ?? []).map((r) => r.following_id)
          );
        }
      }

      setResults(
        (users ?? []).map((u) => ({
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          isFollowing: followingIds.has(u.id),
        }))
      );

      setLoading(false);
      setSearched(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, user]);

  return (
    <main className="p-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, posts, or hashtags..."
          className="w-full rounded-full border border-foreground/20 bg-background px-4 py-3 pl-10 outline-none focus:border-accent-secondary focus:ring-2 focus:ring-accent-secondary"
        />
      </div>

      {/* Results */}
      {query.trim() === "" ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <p className="text-lg font-semibold">
            Start searching
          </p>

          <p className="mt-2 text-sm text-foreground/50">
            Find users, fandoms, events, and posts.
          </p>
        </div>
      ) : loading ? (
        <div className="mt-10 flex justify-center">
          <p className="text-sm text-foreground/40">
            Searching...
          </p>
        </div>
      ) : results.length === 0 && searched ? (
        <div className="mt-10 flex justify-center">
          <p className="text-sm text-foreground/40">
            No users found for &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-foreground/10">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 py-3"
            >
              <Link
                href={`/profile/${result.username}`}
                className="flex flex-1 items-center gap-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/20">
                  {result.avatar_url ? (
                    <Image
                      src={result.avatar_url}
                      alt={result.username}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon
                      size={22}
                      className="text-foreground/30"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {result.display_name}
                  </p>
                  <p className="truncate text-sm text-foreground/50">
                    @{result.username}
                  </p>
                </div>
              </Link>

              <FollowButton
                targetUserId={result.id}
                initialIsFollowing={result.isFollowing}
                onChange={(isFollowing) =>
                  setResults((prev) =>
                    prev.map((r) =>
                      r.id === result.id
                        ? { ...r, isFollowing }
                        : r
                    )
                  )
                }
              />
            </div>
          ))}
        </div>
      )}

      <CreatePostButton />
    </main>
  );
}