"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

// Pages that should render full-screen, without the bottom nav
// bar competing for the same space (e.g. a chat's fixed composer).
const HIDDEN_ON = [/^\/messages\/[^/]+$/];

export default function ConditionalBottomNav() {
  const pathname = usePathname();

  const shouldHide = HIDDEN_ON.some((pattern) =>
    pattern.test(pathname)
  );

  if (shouldHide) return null;

  return <BottomNav />;
}
