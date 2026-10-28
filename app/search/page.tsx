
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, User as UserIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import CreatePostButton from "@/components/CreatePostButton";
import PostGrid from "@/components/Profile/PostGrid";
import { parsePostImages } from "@/utils/formatNumber";
import PullToRefresh from "@/components/PullToRefresh";
import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";
import UserListSkeleton from "@/components/Skeleton/UserListSkeleton";

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

export default function SearchPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [defaultPosts, setDefaultPosts] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchBarOffset, setSearchBarOffset] = useState(0);

  const lastScrollY = useRef(0);
  const lastScrollTarget = useRef<EventTarget | null>(null);
  const searchBarHeight = 72;

  const fetchDefaultPosts = async () => {
    setLoadingPosts(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, image_url")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error fetching posts:", error);
        setDefaultPosts([]);
      } else {
        setDefaultPosts(data ?? []);
      }
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void fetchDefaultPosts();
  }, []);

  const refreshFeed = async () => {
    await fetchDefaultPosts();
  };

  // Make the search bar follow the user's scroll distance.
  useEffect(() => {
    const getScrollPosition = (event: Event) => {
      const target = event.target;

      if (
        target === document ||
        target === document.documentElement ||
        target === document.body
      ) {
        return window.scrollY || document.documentElement.scrollTop;
      }

      if (target instanceof HTMLElement) {
        return target.scrollTop;
      }

      return window.scrollY;
    };

    const handleScroll = (event: Event) => {
      const currentScrollY = getScrollPosition(event);

      // Establish a baseline when scrolling starts or switches containers.
      if (lastScrollTarget.current !== event.target) {
        lastScrollTarget.current = event.target;
        lastScrollY.current = currentScrollY;

        if (currentScrollY <= 50) {
          setSearchBarOffset(0);
        }

        return;
      }

      const difference = currentScrollY - lastScrollY.current;

      setSearchBarOffset((previous) => {
        if (currentScrollY <= 50) return 0;

        return Math.max(
          -searchBarHeight,
          Math.min(0, previous - difference)
        );
      });

      lastScrollY.current = currentScrollY;
    };

    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .or(
            `username.ilike.%${term}%,display_name.ilike.%${term}%`
          )
          .limit(20);

        if (cancelled) return;

        if (error) {
          console.error("Error searching users:", error);
          setResults([]);
        } else {
          setResults(users ?? []);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("User search error:", error);
        setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const defaultGridPosts = defaultPosts.map((post) => ({
    id: post.id,
    image: parsePostImages(post.image_url)[0] ?? null,
  }));

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleSearch = () => {
    const term = query.trim();

    if (!term) return;

    router.push(`/search/results?q=${encodeURIComponent(term)}`);
  };

  return (
    <main>
      {/* Search bar follows the scroll position directly */}
      <div
        className="fixed inset-x-0 top-0 z-40 bg-background"
        style={{
          transform: `translateY(${searchBarOffset}px)`,
        }}
      >
        <div className="m-4 flex h-10 items-center gap-2 rounded-lg bg-accent/50 px-3">
          <Search size={18} className="shrink-0 text-foreground/50" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/50"
          />
        </div>
      </div>

      {/* Reserve the search bar's original space */}
      <div aria-hidden="true" className="h-[72px]" />

      {query.trim() === "" ? (
        <PullToRefresh onRefresh={refreshFeed}>
          <section className="min-h-[80vh] no-scrollbar pb-16">
            {loadingPosts ? (
              <PostGridSkeleton />
            ) : (
              <PostGrid
                posts={defaultGridPosts}
                onPostClick={handlePostClick}
              />
            )}
          </section>
        </PullToRefresh>
      ) : loading ? (
        <UserListSkeleton showFollowButton={false} />
      ) : (
        <section>
          {results.length > 0 && (
            <div className="ml-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/${result.username}`}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div className="relative h-15 w-15 shrink-0 overflow-hidden rounded-full bg-accent">
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
                          size={36}
                          className="text-foreground/30"
                        />
                      </div>
                    )}
                  </div>

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
          )}
        </section>
      )}

      <CreatePostButton />
    </main>
  );
}