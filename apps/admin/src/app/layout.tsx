import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flatmate Admin Portal — Management & Security",
  description: "Flatmate Platform Admin Dashboard",
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
