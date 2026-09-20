import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daymark — A calmer todo list",
  description: "A focused todo list built with Next.js and Cloudflare.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f4ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
