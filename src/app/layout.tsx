import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanSweep | Monad Micro-Bounties",
  description: "Civic micro-bounties with instant settlement on Monad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}

        {/* Demo Navigation Dock */}
        <aside className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 text-xs z-9999 transition-all hover:bg-background">
          <span className="font-bold text-muted-foreground">Demo:</span>
          <Link href="/" className="hover:text-primary hover:underline font-medium">Map</Link>
          <span className="text-muted-foreground/50">|</span>
          <Link href="/funder/1" className="hover:text-primary hover:underline font-medium">Funder 1</Link>
          <Link href="/funder/2" className="hover:text-primary hover:underline font-medium">Funder 2</Link>
          <span className="text-muted-foreground/50">|</span>
          <Link href="/booster/1" className="hover:text-primary hover:underline font-medium">Booster 1</Link>
          <span className="text-muted-foreground/50">|</span>
          <Link href="/cleaner/1" className="hover:text-primary hover:underline font-medium">Cleaner 1</Link>
        </aside>
      </body>
    </html>
  );
}
