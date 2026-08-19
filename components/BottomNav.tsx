 "use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import {
  Home,
  Search,
  Users,
  SquarePlus,
  Bell,
  User
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useSupabaseAuth();

  const handleNav = (href: string) => {
    if (!isLoggedIn) {
      router.push("/login");
    }
    // Otherwise let the Link handle navigation naturally
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t-1 border-foreground/25 flex justify-around items-center">
      <Link href="/" onClick={() => handleNav("/")}>
        <Home
          size={24}
          fill={
            pathname === "/"
              ? "#616161"
              : "none"
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
        />
      </Link>

      {/* <Link href="/create_post">
        <SquarePlus
          size={24}
          strokeWidth={
            pathname === "/create_post"
              ? "3"
              : "2"
          }
        />
      </Link> */}

      <Link href="/community" onClick={() => handleNav("/community")}>
        <Users
          size={24}
          fill={
            pathname === "/community"
              ? "#616161"
              : "none"
          }
        />
      </Link>

      <Link href="/notifs" onClick={() => handleNav("/notifs")}>
        <Bell
          size={24}
          fill={
            pathname === "/notifs"
              ? "#616161"
              : "none"
          }
        />
      </Link>

      <Link href="/profile" onClick={() => handleNav("/profile")}>
        <User
          size={24}
          fill={
            pathname === "/profile"
              ? "#616161"
              : "none"
          }
        />
      </Link>
    </nav>
  );
}
