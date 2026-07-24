"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  User 
} from "lucide-react";

/**
 * 
 * TODO: add filled icons and redirecing
 */

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
          fill={
            pathname === "/search"
              ? "#616161"
              : "none"
          }
        />
      </Link>

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

      <Link href="/notification">
        <Bell
          size={24}
          fill={
            pathname === "/notification"
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