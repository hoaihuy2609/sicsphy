import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ScisPhy — Ngân Hàng Số Vật Lý Thông Minh (GDPT 2018)',
  description: 'Hệ thống quản lý câu hỏi, ma trận đề và xuất bản đề thi Vật lý chuẩn GDPT 2018 K10-K11-K12.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Sidebar />
        <div className="tiad-main">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
