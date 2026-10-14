import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScisPhy — Ngân Hàng Câu Hỏi & Đề Thi Vật Lý",
  description: "Hệ thống quản lý câu hỏi, ma trận đề và xuất bản đề thi Vật lý chuẩn GDPT 2018.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-slate-900 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
