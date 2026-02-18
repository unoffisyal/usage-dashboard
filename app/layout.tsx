import type { Metadata, Viewport } from "next";
import { NavBar } from "@/components/layout/nav-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Usage Dashboard",
  description: "Monitor your AI API usage across OpenAI, Anthropic, and Google Gemini",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "API Usage",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <PWARegister />
        <NavBar />
        <main className="pb-20 md:pb-8">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
