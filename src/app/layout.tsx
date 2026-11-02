// SPEC-003 R-13: mọi trang có <html lang="vi">.
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Một Ngày Làm Nghề",
  description: "Trải nghiệm một ngày làm việc của các nghề, có nguồn trích dẫn.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="mx-auto max-w-3xl p-6 text-slate-900">{children}</body>
    </html>
  );
}
