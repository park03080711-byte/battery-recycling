import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";
import "./hero.css";
import "./anatomy.css";
import "./rc.css";

export const metadata: Metadata = {
  title: {
    default: "RE:CELL 14 — 폐배터리 활용방안 14개 주제",
    template: "%s | RE:CELL 14",
  },
  description:
    "재제조·재사용·재활용부터 이력관리, 전과정평가, 분해를 고려한 설계까지. 국내외 문헌 49편을 바탕으로 정리한 폐배터리 활용방안 14개 주제 소개 사이트 (학생 과제).",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3f8c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 메인 첫 화면 등장 애니메이션의 준비 상태를 첫 페인트 전에 건다.
            JS·WAAPI가 없거나 움직임 줄이기 설정이면 붙지 않아 완성 상태로 바로 보인다. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;if(location.pathname!=='/')return;if(!('animate' in Element.prototype))return;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('pre');setTimeout(function(){d.classList.remove('pre')},4000);})();",
          }}
        />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
