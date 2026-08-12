import type { Metadata } from "next";
import { Geist, Geist_Mono, Sacramento, Patrick_Hand } from "next/font/google";
import { SupabaseAuthProvider } from "@/components/SupabaseAuthContext";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  weight: "400",
  variable: "--font-sacramento",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick-hand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oshicappu",
  description: "Social Media App for Oshikatsu",
  icons: {
    icon: "/icons/temp.jpg",
    apple: "/icons/temp.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sacramento.variable} ${patrickHand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex-col" suppressHydrationWarning>
        <SupabaseAuthProvider>
          {/* Mobile view */}
          <div className="md:hidden min-h-screen flex flex-col">
            <div className="flex-1">
              {children}
            </div>

            <BottomNav />
          </div>

          {/* Desktop view */}
          <div className="hidden md:flex min-h-screen items-center justify-center">
            <h1>This app only works on mobile devices.</h1>
          </div>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}