"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  Home,
  Search,
  Calendar,
  Bell,
  User
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user } = useSupabaseAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function fetchUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", user!.id)
        .eq("read", false);

      if (!cancelled) {
        if (error) {
          console.error(
            "Error fetching unread notifications count:",
            error
          );
        } else {
          setUnreadCount(count ?? 0);
        }
      }
    }

    fetchUnreadCount();

    return () => {
      cancelled = true;
    };
    // Re-check whenever the person navigates (e.g. after
    // visiting /notifs, which marks everything read).
  }, [user, pathname]);

  const handleNav = (href: string) => {
    if (!isLoggedIn) {
      router.push("/login");
    }
    // Otherwise let the Link handle navigation naturally
  };

  const activeColor = "var(--accent-secondary)";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t-1 border-foreground/25 flex justify-around items-center">
      <Link href="/" onClick={() => handleNav("/")}>
        <Home
          size={24}
          fill={
            pathname === "/"
              ? activeColor
              : "none"
          }
          className={
            pathname === "/"
              ? "text-[var(--accent-secondary)]"
              : ""
          }
        />
      </Link>

      <Link href="/search" onClick={() => handleNav("/search")}>
        <Search
          size={24}
          strokeWidth={
            pathname === "/search" || pathname.startsWith("/search/")
              ? "4"
              : "2"
          }
          className={
            pathname === "/search" || pathname.startsWith("/search/")
              ? "text-[var(--accent-secondary)]"
              : ""
          }
        />
      </Link>

      <Link
        href="/event"
        onClick={() => handleNav("/event")}
      >
        <Calendar
          size={24}
          strokeWidth={
            pathname === "/event" || pathname.startsWith("/event/")
              ? "3"
              : "2"
          }
          className={
            pathname === "/event" || pathname.startsWith("/event/")
              ? "text-[var(--accent-secondary)]"
              : ""
          }
        />
      </Link>

      <Link href="/notifs" onClick={() => handleNav("/notifs")} className="relative">
        <Bell
          size={24}
          fill={
            pathname === "/notifs"
              ? activeColor
              : "none"
          }
          className={
            pathname === "/notifs"
              ? "text-[var(--accent-secondary)]"
              : ""
          }
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      <Link href="/profile" onClick={() => handleNav("/profile")}>
        <User
          size={24}
          fill={
            pathname === "/profile"
              ? activeColor
              : "none"
          }
          className={
            pathname === "/profile"
              ? "text-[var(--accent-secondary)]"
              : ""
          }
        />
      </Link>
    </nav>
  );
}