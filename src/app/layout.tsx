import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Демо: очередь лидов",
  description: "Публичная форма и фоновый воркер (Next.js + Prisma + PostgreSQL)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="font-sans">{children}</body>
    </html>
  );
}
