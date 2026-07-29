"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-accent flex justify-around items-center">
      <Link href="/">
        <Home
          size={24}
          fill={
            pathname === "/"
              ? "#616161"
              : "none"
          }
        />
      </Link>

      <Link href="/search">
        <Search
          size={24}
          strokeWidth={
            pathname === "/search"
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

      <Link href="/community">
        <Users
          size={24}
          fill={
            pathname === "/community"
              ? "#616161"
              : "none"
          }
        />
      </Link>

      <Link href="/notifs">
        <Bell
          size={24}
          fill={
            pathname === "/notifs"
              ? "#616161"
              : "none"
          }
        />
      </Link>

      <Link href="/profile">
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