import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  applicationName: "글빛",
  title: {
    default: "글빛 - AI 글쓰기 분석 & 성장 추적",
    template: "%s | 글빛",
  },
  description: "초등학생의 글쓰기를 AI로 분석하고 성장을 추적하는 교육 도구 · GeulBit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "글빛",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#6C5CE7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#F4F3FF]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
