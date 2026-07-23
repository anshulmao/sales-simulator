import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twimbit Sales Simulator",
  description: "Practise live sales calls against an AI buyer persona.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
