"use client";

import { Search, ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type SearchTab =
  | "posts"
  | "users"
  | "fandoms"
  | "events";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] =
    useState(query);

  const [activeTab, setActiveTab] =
    useState<SearchTab>("posts");

  const handleSearch = () => {
    const term = searchInput.trim();

    if (!term) return;

    router.push(
      `/search/results?q=${encodeURIComponent(term)}`
    );
  };

  const tabs: {
    id: SearchTab;
    label: string;
  }[] = [
    {
      id: "posts",
      label: "Posts",
    },
    {
      id: "users",
      label: "Users",
    },
    {
      id: "fandoms",
      label: "Fandoms",
    },
    {
      id: "events",
      label: "Events",
    },
  ];

  return (
    <main className="md:hidden min-h-screen bg-background">
      {/* Search Header */}
      <header className="border-b border-foreground/10 bg-background">
        <div className="flex items-center pr-3 py-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Search Bar */}
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-accent/50 px-3">
            <Search
              size={18}
              className="shrink-0 text-foreground/50"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) =>
                setSearchInput(e.target.value)
              }
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
        </div>

        {/* Tabs */}
        <div className="flex">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`
                  relative
                  flex-1
                  pb-2
                  text-sm
                  font-medium
                  ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/50"
                  }
                `}
              >
                {tab.label}

                {/* Active underline */}
                {isActive && (
                  <span
                    className="
                      absolute
                      bottom-0
                      left-1/2
                      h-0.5
                      w-12
                      -translate-x-1/2
                      rounded-full
                      bg-foreground
                    "
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Search Results */}
      <section className="p-4">
        <p className="mb-4 text-sm text-foreground/60">
          Results for "{query}"
        </p>

        {activeTab === "posts" && (
          <div>
            Posts results
          </div>
        )}

        {activeTab === "users" && (
          <div>
            Users results
          </div>
        )}

        {activeTab === "fandoms" && (
          <div>
            Fandom results
          </div>
        )}

        {activeTab === "events" && (
          <div>
            Events results
          </div>
        )}
      </section>
    </main>
  );
}