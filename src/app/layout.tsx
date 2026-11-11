import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aayojon (আয়োজন) — Bangladesh Event Discovery, Promotion & Ticketing Platform",
  description:
    "All-in-one event discovery, creation, promotion, registration, QR ticketing, attendee management, and analytics platform built for Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}

