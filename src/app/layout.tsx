import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/firebase/auth-context";

export const metadata: Metadata = {
  title: "Aayojon (আয়োজন) — Event Discovery & Ticketing Platform",
  description:
    "Find your people. Find your events. Bangladesh's event discovery, ticketing, and event management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
