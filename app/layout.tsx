import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Simulator",
  description: "Practise live sales conversations with an AI buyer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes into <body> before React hydrates. This tolerates those
          attribute-only diffs without masking real hydration bugs elsewhere. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
