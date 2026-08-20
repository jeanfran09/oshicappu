"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import Link from "next/link";

type HashtagResult = {
  id: string;
  tag: string;
};

type HashtagResultsProps = {
  query?: string;
};

export default function TagResults({
  query = "",
}: HashtagResultsProps) {
  const [hashtags, setHashtags] = useState<
    HashtagResult[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const term = query.trim().replace(/^#/, "");

    if (!term) {
      setHashtags([]);
      setLoading(false);
      return;
    }

    async function searchHashtags() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("hashtags")
          .select("id, tag")
          .ilike("tag", `%${term}%`)
          .order("tag", {
            ascending: true,
          })
          .limit(20);

        if (error) {
          throw error;
        }

        setHashtags(data ?? []);
      } catch (error) {
        console.error(
          "Error searching hashtags:",
          error
        );

        setHashtags([]);
      } finally {
        setLoading(false);
      }
    }

    searchHashtags();
  }, [query]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          Searching hashtags...
        </p>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          No hashtags found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="px-2">
      {hashtags.map((hashtag) => (
        <Link
          key={hashtag.id}
          href={`/hashtag/${encodeURIComponent(
            hashtag.tag
          )}`}
          className="flex w-full items-center rounded-lg px-3 py-3"
        >
          <p className="truncate text-base font-semibold">
            #{hashtag.tag}
          </p>
        </Link>
      ))}
    </div>
  );
}