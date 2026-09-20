import type { Metadata } from "next";
import { Geist, Geist_Mono, Sacramento, Patrick_Hand, M_PLUS_Rounded_1c } from "next/font/google";
import { SupabaseAuthProvider } from "@/components/SupabaseAuthContext";
import { ThemeProvider } from "@/components/ThemeContext";
import "./globals.css";
import ConditionalBottomNav from "@/components/ConditionalBottomNav";

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

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${sacramento.variable} ${patrickHand.variable} ${mPlusRounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <SupabaseAuthProvider>
            {/* Mobile view */}
            <div className="md:hidden flex h-screen flex-col overflow-x-hidden">
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              <ConditionalBottomNav />
            </div>

            {/* Desktop view */}
            <div className="hidden md:flex min-h-screen items-center justify-center">
              <h1>This app only works on mobile devices.</h1>
            </div>
          </SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}