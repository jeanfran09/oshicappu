"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";

import { supabase } from "@/lib/supabase";
import PostGrid from "@/components/Profile/PostGrid";
import { parsePostImages } from "@/utils/formatNumber";

type Post = {
  id: string;
  image: string | null;
};

export default function LocationPage() {
  const params = useParams();
  const router = useRouter();

  const locationName = decodeURIComponent(params.name as string);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationName) return;

    async function fetchPosts() {
      setLoading(true);

      const { data, error } = await supabase
        .from("posts")
        .select("id, image_url, created_at")
        .ilike("location", locationName)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts for location:", error);
        setPosts([]);
        setLoading(false);
        return;
      }

      setPosts(
        (data ?? []).map((post) => ({
          id: post.id,
          image: parsePostImages(post.image_url)[0] ?? null,
        }))
      );

      setLoading(false);
    }

    fetchPosts();
  }, [locationName]);

  return (
    <div className="md:hidden min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Location
        </h1>
      </header>

      <main className="px-4 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <MapPin size={19} />
          </div>

          <div>
            <h2 className="text-lg font-bold">{locationName}</h2>
            <p className="text-xs text-foreground/50">
              {posts.length} post{posts.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="text-sm text-foreground/40">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-foreground/40">
              No posts tagged at this location yet.
            </p>
          ) : (
            <PostGrid
              posts={posts}
              onPostClick={(id) => router.push(`/post/${id}`)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
