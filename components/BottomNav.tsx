"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  User 
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleNav = (href: string) => {
    if (!isLoggedIn) {
      router.push("/login");
    }
    // Otherwise let the Link handle navigation naturally
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-accent flex justify-around items-center">
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
          fill={
            pathname === "/search"
              ? "#616161"
              : "none"
          }
        />
      </Link>

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

      <Link href="/notification" onClick={() => handleNav("/notification")}>
        <Bell
          size={24}
          fill={
            pathname === "/notification"
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
