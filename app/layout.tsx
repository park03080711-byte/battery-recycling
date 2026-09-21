import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RE:CELL 14 — 폐배터리 활용방안 14개 주제",
    template: "%s | RE:CELL 14",
  },
  description:
    "재제조·재사용·재활용부터 이력관리, 전과정평가, 분해를 고려한 설계까지. 국내외 문헌 35편을 바탕으로 정리한 폐배터리 활용방안 14개 주제 소개 사이트 (학생 과제).",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3f8c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
