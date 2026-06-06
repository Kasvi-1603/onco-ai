import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oncopilot AI",
  description: "Oncologist-first clinical decision support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
