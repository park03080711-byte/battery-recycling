import type { Metadata } from "next";
import Link from "next/link";
import SubVisual from "@/components/sub/SubVisual";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

const links = [
  { href: "/", label: "홈", sub: "첫 화면에서 다시 시작" },
  { href: "/topics", label: "주제 한눈에", sub: "14개 주제를 네 갈래로" },
  { href: "/lab", label: "실험실", sub: "LAB 01 실측 · LAB 02 모의실험" },
  { href: "/references", label: "참고문헌", sub: "검증한 문헌 목록" },
];

export default function NotFound() {
  return (
    <>
      <main id="main">
        <SubVisual
          layer="neutral"
          seed={404}
          en="NOT FOUND"
          big="404"
          crumbs={[{ label: "없는 주소", options: links.map((l) => ({ href: l.href, label: l.label })) }]}
        />
        <div className="container">
          <header className="page-title">
            <h1>페이지를 찾을 수 없습니다</h1>
            <p className="tagline">주소가 바뀌었거나 잘못 입력된 것 같아요. 아래에서 가려던 곳을 골라 주세요.</p>
          </header>
          <ul className="nf-links">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  <b>{l.label}</b>
                  <span>{l.sub}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
