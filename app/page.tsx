import Image from "next/image";
import BottomNav from "@/components/BottomNav";

export default function Home() {
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
