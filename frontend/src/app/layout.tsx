import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUC Research Assistant",
  description: "AI-powered research assistant for academic paper discovery and analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
