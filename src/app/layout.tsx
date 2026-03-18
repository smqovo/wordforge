import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "WordForge — 雅思单词智能复习系统",
  description: "基于艾宾浩斯遗忘曲线的雅思单词学习、复习和AI测验系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
