"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <main>
      {/* Mobile view */}
      <div className="md:hidden min-h-screen flex flex-col">
        <div className="flex-1 pb-16">
          <h1 className="font-sacramento text-4xl p-4 flex justify-center">
            OshiCappu
          </h1>

          {/* Your app content goes here */}
        </div>

        <BottomNav />
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex min-h-screen items-center justify-center">
        <h1>
          This app only works on mobile devices.
        </h1>
      </div>
    </main>
  );
}
