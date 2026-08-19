"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  User as UserIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import CreatePostButton from "@/components/CreatePostButton";
import PostGrid from "@/components/Profile/PostGrid";
import { parsePostImages } from "@/utils/formatNumber";
import PullToRefresh from "@/components/PullToRefresh";

type SearchResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type PostResult = {
  id: string;
  image_url: string | null;
};

async function refreshFeed() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // fetch posts here
}

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<SearchResult[]>(
    []
  );

  const [defaultPosts, setDefaultPosts] = useState<
    PostResult[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [loadingPosts, setLoadingPosts] =
    useState(true);

  const [searched, setSearched] = useState(false);


  useEffect(() => {
    async function fetchDefaultPosts() {
      setLoadingPosts(true);

      const { data, error } = await supabase
        .from("posts")
        .select("id, image_url")
        .order("created_at", {
          ascending: false,
        })
        .limit(30);

      if (error) {
        console.error(
          "Error fetching posts:",
          error
        );

        setDefaultPosts([]);
      } else {
        setDefaultPosts(data ?? []);
      }

      setLoadingPosts(false);
    }

    fetchDefaultPosts();
  }, []);

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
      try {
        const { data: users, error } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url"
          )
          .or(
            `username.ilike.%${term}%,display_name.ilike.%${term}%`
          )
          .limit(20);

        if (error) {
          console.error(
            "Error searching users:",
            error
          );

          setResults([]);
        } else {
          setResults(users ?? []);
        }

        setSearched(true);
      } catch (error) {
        console.error(
          "User search error:",
          error
        );

        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const defaultGridPosts = defaultPosts.map(
    (post) => ({
      id: post.id,
      image:
        parsePostImages(
          post.image_url
        )[0] ?? null,
    })
  );

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleSearch = () => {
    const term = query.trim();

    if (!term) return;

    router.push(
      `/search/results?q=${encodeURIComponent(term)}`
    );
  };

  return (
    <main>
      {/* Search Bar */}
      <div className="m-4 flex h-10 items-center gap-2 rounded-lg bg-accent/50 px-3">
        <Search
          size={18}
          className="shrink-0 text-foreground/50"
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search"
          className="
            min-w-0
            flex-1
            bg-transparent
            text-sm
            outline-none
            placeholder:text-foreground/50
          "
        />
      </div>

      {/* --------------------------------
          Default Page
          -------------------------------- */}
      {query.trim() === "" ? (
        <PullToRefresh onRefresh={refreshFeed}>
          <section className="min-h-[80vh] no-scrollbar">
            {loadingPosts ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-foreground/40">
                  Loading posts...
                </p>
              </div>
            ) : (
              <PostGrid
                posts={defaultGridPosts}
                onPostClick={handlePostClick}
              />
            )}
          </section>
        </PullToRefresh>
      ) : loading ? (
        /* --------------------------------
           Searching
           -------------------------------- */
        <div className="mt-10 flex justify-center">
          <p className="text-sm text-foreground/40">
            Searching...
          </p>
        </div>
      ) : (
        <>
          {/* --------------------------------
              Users
              -------------------------------- */}
          {results.length > 0 && (
            <section>
              <div className="ml-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/profile/${result.username}`}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2"
                  >
                    {/* Avatar */}
                    <div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-full bg-accent/20">
                      {result.avatar_url ? (
                        <Image
                          src={result.avatar_url}
                          alt={`${result.display_name}'s avatar`}
                          fill
                          sizes="68px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserIcon
                            size={48}
                            className="text-foreground/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Username + display name */}
                    <div className="min-w-0">
                      <p className="text-base font-bold">
                        {result.username}
                      </p>

                      <p className="-mt-0.5 truncate text-base text-foreground/75">
                        {result.display_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* --------------------------------
              No Users Found
              -------------------------------- */}
          {searched &&
            results.length === 0 && (
              <div className="mt-10 flex justify-center">
                <p className="text-sm text-foreground/40">
                  No users found for{" "}
                  &ldquo;{query}&rdquo;.
                </p>
              </div>
            )}
        </>
      )}

      <CreatePostButton />
    </main>
  );
}

