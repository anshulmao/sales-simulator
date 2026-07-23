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
      <body>{children}</body>
    </html>
  );
}
