"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthContext";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();

  if (!isLoggedIn || !user) {
    router.push("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-4 pb-2 px-4">
        <h1 className="font-sacramento text-4xl text-center">
          OshiCappu
        </h1>
      </div>

      {/* Profile Content — add your layout here */}
      <div className="flex-1 pb-20 px-4">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-accent shadow-sm">
            <Image
              src={user.avatar}
              alt={`${user.displayName}'s avatar`}
              width={96}
              height={96}
              className="object-cover"
            />
          </div>

          <h2 className="mt-3 text-xl font-semibold text-foreground">
            @{user.username}
          </h2>
          <p className="text-sm text-foreground/60">{user.displayName}</p>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-foreground text-background font-medium rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
