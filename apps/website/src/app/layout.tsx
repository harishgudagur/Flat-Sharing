import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flatmate — Find your people. Share your space.",
  description: "The Flatmate Matching and Rent Splitting Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-[#080808] text-white">
        {children}
      </body>
    </html>
  );
}
