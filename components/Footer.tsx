import Link from "next/link";
import { layers } from "@/data/layers";
import { topicsByLayer } from "@/data/topics";
import { Logo } from "./Icons";

export default function Footer({ snap = false }: { snap?: boolean }) {
  return (
    <footer className={`footer${snap ? " fp-section auto" : ""}`}>
      <div className="footer-top">
        <div>
          <Link href="/" className="logo">
            <Logo />
            <span>
              RE:CELL 14
              <small>BATTERY AFTERLIFE</small>
            </span>
          </Link>
          <p className="footer-slogan">Finite Batteries, Infinite Resources</p>
        </div>
        <div className="footer-links">
          {layers.map((l) => (
            <div key={l.id}>
              <h2>{l.en}</h2>
              {topicsByLayer(l.id).map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`}>
                  {t.no} {t.title}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h2>ARCHIVE</h2>
            <Link href="/about">사이트 소개</Link>
            <Link href="/topics">주제 한눈에</Link>
            <Link href="/references">참고문헌</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          <strong>학생 과제물 · 비영리 교육 목적</strong> — 본 사이트는 폐배터리 리사이클링 기술 조사 과제를 웹으로 재구성한 것으로, 언급된 어떤 기업과도
          관련이 없습니다. 기업명은 사실 서술 목적으로만 사용했으며 로고를 사용하지 않았습니다.
        </p>
        <p>
          모든 일러스트와 도식은 직접 제작했습니다. 수치의 출처는 각 페이지 하단과 참고문헌 페이지에 표기했으며, 기업 발표 수치(회수율 95%, CO₂ 70% 절감)는 자체
          발표 기준입니다.
        </p>
        <p style={{ marginTop: 8 }}>© 2026 RE:CELL 14 · Battery Recycling Research Project</p>
      </div>
    </footer>
  );
}
