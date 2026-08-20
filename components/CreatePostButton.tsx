"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function FloatingCreateButton() {
  return (
    <Link
      href="/create_post"
      className="
        fixed
        bottom-19
        right-3
        z-50
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        bg-accent
        text-background
        transition-transform
        active:scale-95
      "
    >
      <Plus size={24} strokeWidth={2} className="text-foreground/75"/>
    </Link>
  );
}