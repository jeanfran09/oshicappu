"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type FandomResult = {
  id: string;
  name: string;
};

type FandomResultsProps = {
  query?: string;
};

export default function FandomResults({
  query = "",
}: FandomResultsProps) {
  const [fandoms, setFandoms] = useState<FandomResult[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      setFandoms([]);
      setLoading(false);
      return;
    }

    async function searchFandoms() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("fandoms")
          .select("id, name")
          .ilike("name", `%${term}%`)
          .order("name", {
            ascending: true,
          })
          .limit(20);

        if (error) {
          throw error;
        }

        setFandoms(data ?? []);
      } catch (error) {
        console.error(
          "Error searching fandoms:",
          error
        );

        setFandoms([]);
      } finally {
        setLoading(false);
      }
    }

    searchFandoms();
  }, [query]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          Searching fandoms...
        </p>
      </div>
    );
  }

  if (fandoms.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-foreground/40">
          No fandoms found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="px-2">
      {fandoms.map((fandom) => (
        <button
          key={fandom.id}
          type="button"
          className="flex w-full items-center rounded-lg px-3 py-3 text-left"
        >

          <div className="ml-3 min-w-0">
            <p className="truncate text-base font-semibold">
              {fandom.name}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}