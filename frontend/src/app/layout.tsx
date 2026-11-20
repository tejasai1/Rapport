import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const heading = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-heading" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Rapport",
  description: "Practice real conversations, get feedback, and track your growth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <div className="shell">
          <Sidebar />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}