"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { layers } from "@/data/layers";
import { topicBySlug, topicsByLayer } from "@/data/topics";
import { Logo } from "./Icons";

const menu = [
  { href: "/about", label: "소개" },
  { href: "/anatomy", label: "해부도" },
  { href: "/topics#paths", label: "처리 경로", layer: "paths" },
  { href: "/topics#support", label: "지원 기술", layer: "support" },
  { href: "/topics#evaluation", label: "평가 · 설계", layer: "evaluation" },
  { href: "/references", label: "참고문헌" },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [atTop, setAtTop] = useState(true);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // 메인 첫 화면은 자체 헤더가 있으므로 공통 헤더를 숨긴다
  const [onHero, setOnHero] = useState(isHome);

  // 메인에서는 풀페이지 컨테이너의 스크롤 위치(첫 섹션 여부)로 헤더 스타일을 바꾼다
  useEffect(() => {
    const onSection = (e: Event) => {
      const { dark, id } = (e as CustomEvent<{ dark: boolean; id: string }>).detail;
      setOnHero(id === "s-intro");
      // 좁은 화면에서는 패널 글이 헤더 아래로 지나가므로 첫 화면에서만 투명 처리
      setAtTop(dark && (id === "s-intro" || window.innerWidth > 900));
    };
    window.addEventListener("fp:section", onSection);
    return () => window.removeEventListener("fp:section", onSection);
  }, []);

  // Esc로 메가메뉴 · 모바일 메뉴 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setAtTop(true);
    setOnHero(pathname === "/");
  }, [pathname]);

  // 서브페이지: 상단 비주얼 위에 있을 때만 투명
  useEffect(() => {
    if (isHome) return;
    const onScroll = () => setAtTop(window.scrollY < 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // 밝은 머리를 쓰는 개편 페이지에서는 투명(흰 글씨) 헤더를 쓰지 않는다
  const lightTop = ["/topics/recycling", "/topics/remanufacturing", "/topics/reuse"].includes(pathname);
  const overlay = atTop && !megaOpen && !mobileOpen && !lightTop;
  const hidden = isHome && onHero && !mobileOpen;
  const cls = ["header", overlay ? "is-overlay" : "", megaOpen || mobileOpen ? "is-open" : "", hidden ? "is-hidden" : ""].join(" ");

  const currentTopic = pathname.startsWith("/topics/") ? topicBySlug(pathname.split("/")[2]) : undefined;
  const isActive = (m: (typeof menu)[number]) => {
    if (m.layer) {
      if (!currentTopic) return false;
      return m.layer === "evaluation" ? ["evaluation", "design"].includes(currentTopic.layer) : currentTopic.layer === m.layer;
    }
    return pathname === m.href;
  };

  return (
    <>
      <a href="#main" className="skip-link">
        본문 바로가기
      </a>
      <header
        className={cls}
        onMouseLeave={() => setMegaOpen(false)}
        onBlur={(e) => {
          // 키보드 포커스가 헤더 밖으로 나가면 메가메뉴를 닫는다
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMegaOpen(false);
        }}
      >
        <div className="header-inner">
          <Link href="/" className="logo" aria-label="RE:CELL 14 홈">
            <Logo />
            <span>
              RE:CELL 14
              <small>BATTERY AFTERLIFE</small>
            </span>
          </Link>

          <nav aria-label="주 메뉴">
            <ul className="gnb" onMouseEnter={() => setMegaOpen(true)}>
              {menu.map((m) => (
                <li key={m.label}>
                  <Link href={m.href} aria-current={isActive(m) ? "page" : undefined} onFocus={() => setMegaOpen(true)}>
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-util">
            <button
              className="menu-btn"
              aria-label={mobileOpen ? "메뉴 닫기" : "전체 메뉴 열기"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
            </button>
          </div>
        </div>

        {/* 메가 메뉴 — 14개 주제 전체 */}
        <div className="mega" aria-hidden={!megaOpen}>
          <div className="mega-inner">
            <div className="mega-intro">
              <h2>
                폐배터리 활용방안
                <br />
                14개 주제
              </h2>
              <p>무엇을 할 것인가, 무엇이 있어야 가능한가, 좋은지 어떻게 판단하는가, 애초에 어떻게 만들 것인가.</p>
            </div>
            {layers.map((l) => (
              <div className="mega-col" key={l.id}>
                <h3 style={{ borderColor: l.color }}>
                  {l.title}
                  <span>{l.range}</span>
                </h3>
                {topicsByLayer(l.id).map((t) => (
                  <Link key={t.slug} href={`/topics/${t.slug}`} tabIndex={megaOpen ? 0 : -1} onClick={() => setMegaOpen(false)}>
                    <em>{t.no}</em>
                    {t.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mobile-nav" aria-label="전체 메뉴">
          <Link href="/about"><em>—</em>소개</Link>
          <Link href="/anatomy"><em>—</em>배터리팩 해부도</Link>
          <Link href="/topics"><em>—</em>14개 주제 한눈에</Link>
          {layers.map((l) => (
            <div key={l.id}>
              <h3>{l.no}. {l.title}</h3>
              {topicsByLayer(l.id).map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`}>
                  <em>{t.no}</em>
                  {t.title}
                </Link>
              ))}
            </div>
          ))}
          <h3>자료</h3>
          <Link href="/references"><em>—</em>참고문헌 44편</Link>
        </nav>
      )}
    </>
  );
}
