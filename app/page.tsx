import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Mobile view */}
      <div className="md:hidden">
        <h1>Oshicappu App</h1>
        {/* Your mobile app components here */}
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
