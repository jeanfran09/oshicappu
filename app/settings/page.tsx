"use client";

import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  LogOut,
} from "lucide-react";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useSupabaseAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Settings
        </h1>
      </header>

      <div className="px-4 pt-2">
        {/* Appearance */}
        <button
          type="button"
          onClick={() => router.push("/settings/appearance")}
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            py-3
            text-left
          "
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Palette size={18} />
          </div>

          <span className="flex-1 text-base font-medium">
            Appearance
          </span>

          <ChevronRight
            size={18}
            className="text-foreground/40"
          />
        </button>

        {/* Sign Out */}
        <div className="flex justify-center pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-red-500/10
              px-6
              py-3
              text-red-500
              font-medium
            "
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}