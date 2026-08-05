"use client";

import { Grid3X3, Bookmark, Heart } from "lucide-react";

type Tab =
  | "posts"
  | "saved"
  | "liked";

type Props = {
  activeTab: Tab;
  setActiveTab: (
    tab: Tab
  ) => void;
};

export default function ProfileTabs({
  activeTab,
  setActiveTab,
}: Props) {

  const tabs = [
    {
      id: "posts",
      icon: Grid3X3,
    },
    {
      id: "saved",
      icon: Bookmark,
    },
    {
      id: "liked",
      icon: Heart,
    },

  ] as const;
  return (
    <div className="flex border-t border-foreground/10 mt-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id)
            }
            className="relative flex flex-1 justify-center py-3"
          >
            <Icon
              size={22}
              className={
                selected
                  ? "text-foreground"
                  : "text-foreground/40"
              }
            />

            {selected && (
              <div
                className="
                  absolute
                  bottom-0
                  h-0.5
                  w-full
                  bg-foreground
                "
              />
            )}
          </button>
        );
      })}
    </div>
  );
}