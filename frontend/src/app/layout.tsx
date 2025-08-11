// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AUC Research Assistant",
  description:
    "AI-powered research assistant for academic paper discovery and analysis",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Header />
        {/* removed the spacer that caused the black strip */}
        {children}
      </body>
    </html>
  );
}
