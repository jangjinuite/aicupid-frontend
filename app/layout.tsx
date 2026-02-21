import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI CUPID",
  description: "AI-powered Cupid MC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased bg-white dark:bg-dark-bg text-[#1A1A1A] dark:text-[#F0F0F0]`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
