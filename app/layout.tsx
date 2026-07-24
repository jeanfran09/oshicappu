import type { Metadata } from "next";
import { Geist, Geist_Mono, Sacramento } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import "./globals.css";

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
      className={`${geistSans.variable} ${geistMono.variable} ${sacramento.variable} h-full antialiased`}
    >
      <body className="min-h-full flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
