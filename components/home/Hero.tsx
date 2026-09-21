"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import HeroPlate from "./HeroPlate";
import { Logo } from "../Icons";

/* 1280×960 기준 시안의 좌표를 그대로 쓰는 첫 화면.
   모든 크기는 --u(시안 1px) 단위, 위치는 --x · --y 인라인 값. */
const at = (x: number, y: number): CSSProperties => ({ ["--x" as string]: x, ["--y" as string]: y });

function Chevron() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="m6.6 3.6 6 5.4-6 5.4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  /* ── 등장 타임라인: 한 번 실행 후 스스로 지워진다 ── */
  useEffect(() => {
    const d = document.documentElement;
    const root = rootRef.current;
    if (!root || !d.classList.contains("pre")) return;
    const EXPO = "cubic-bezier(.16,1,.3,1)";
    const SOFT = "cubic-bezier(.22,.7,.25,1)";
    const GLASS = "cubic-bezier(.2,.75,.28,1)";
    const s = window.matchMedia("(max-width: 640px)").matches ? 0.86 : 1;
    const running: Animation[] = [];
    const q = (sel: string) => root.querySelector<HTMLElement>(sel);
    const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    const animate = (el: Element | null, kf: Keyframe[], dur: number, delay: number, easing: string) => {
      if (!el) return;
      running.push(el.animate(kf, { duration: dur * s, delay: delay * s, easing, fill: "both" }));
    };
    const rise = (el: Element | null, delay: number, dur: number) =>
      animate(el, [{ clipPath: "inset(100% 0 -14% 0)", translate: "0 .16em" }, { clipPath: "inset(-18% 0 -14% 0)", translate: "0 0" }], dur, delay, EXPO);
    const lift = (el: Element | null, delay: number, dist = ".7em", dur = 560) =>
      animate(el, [{ opacity: 0, translate: "0 " + dist }, { opacity: 1, translate: "0 0" }], dur, delay, SOFT);
    const settle = (el: Element | null, delay: number, dur = 760, from = 0.985, dist = "1.1em") =>
      animate(el, [{ opacity: 0, scale: String(from), translate: "0 " + dist }, { opacity: 1, scale: "1", translate: "0 0" }], dur, delay, GLASS);

    const h = qa("h1 .hx-sx");
    const nums = qa(".hx-num");
    const lbls = qa(".hx-lbl");
    lift(q(".hx-brand"), 60, ".55em", 600);
    settle(q(".hx-nav"), 150, 700, 0.99, ".5em");
    settle(q(".hx-cta"), 200, 700, 0.985, ".5em");
    settle(q(".hx-burger"), 150, 700, 0.9, ".4em");
    lift(q(".hx-eyebrow"), 300, ".8em", 520);
    rise(h[0], 380, 980);
    rise(h[1], 470, 980);
    settle(q(".hx-play"), 720, 640, 0.88, ".3em");
    lift(q(".hx-tag"), 770, ".7em", 560);
    settle(q(".hx-panel"), 800, 880, 0.982, "1.4em");
    animate(q(".hx-shield"), [{ scale: ".86" }, { scale: "1" }], 700, 1020, EXPO);
    animate(q(".hx-dot"), [{ scale: "0" }, { scale: "1" }], 520, 1080, EXPO);
    animate(q(".hx-track"), [{ scale: "0 1" }, { scale: "1 1" }], 820, 1120, EXPO);
    rise(nums[0], 920, 860);
    rise(nums[1], 990, 860);
    lift(lbls[0], 1030, ".6em", 520);
    lift(lbls[1], 1075, ".6em", 520);
    animate(q(".hx-slash"), [{ scale: "1 0" }, { scale: "1 1" }], 700, 1010, EXPO);
    settle(q(".hx-meet"), 1140, 820, 0.985, "1.2em");

    Promise.all(running.map((a) => a.finished.catch(() => undefined))).then(() => {
      d.classList.remove("pre");
      running.forEach((a) => a.cancel());
      running.length = 0;
    });
    return () => running.forEach((a) => a.cancel());
  }, []);

  /* ── 세로 화면용 햄버거 메뉴 ── */
  useEffect(() => {
    const btn = burgerRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btn.contains(t) && !menu.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        btn.focus();
      }
    };
    const mq = window.matchMedia("(min-aspect-ratio: 1/1)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <section className="fp-section hx" id="s-intro" data-dark="false" aria-label="메인" ref={rootRef}>
      <div className="hx-card">
        <HeroPlate />
        <div className="hx-tint" />

        <div className="hx-stack">
          {/* 헤더 줄 */}
          <div className="hx-row">
            <Link className="hx-brand hx-l hx-t" style={at(68, 47)} href="/" aria-label="RE:CELL 14 홈">
              <span className="hx-mark">
                <Logo size={39} />
              </span>
              <b>RE:CELL 14</b>
            </Link>
            <button
              ref={burgerRef}
              className="hx-burger"
              type="button"
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={open}
              aria-controls="hx-menu"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
            >
              <i />
              <i />
            </button>
            <div className="hx-menu" id="hx-menu" ref={menuRef} data-open={open ? "" : undefined} onClick={closeOnLink}>
              <nav className="hx-nav" aria-label="빠른 이동">
                <i className="hx-n-home" aria-hidden="true">
                  <svg viewBox="0 0 20 21" fill="none">
                    <path d="M2 8.4 10 2l8 6.4V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" stroke="#202940" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                </i>
                <Link className="hx-n-about" href="/about">
                  사이트 소개
                </Link>
                <hr className="hx-n-div" />
                <i className="hx-n-grid" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" stroke="#202940" strokeWidth="1.7">
                    <rect x="1" y="1" width="7.4" height="7.4" rx="1.7" />
                    <rect x="11.6" y="1" width="7.4" height="7.4" rx="1.7" />
                    <rect x="1" y="11.6" width="7.4" height="7.4" rx="1.7" />
                    <rect x="11.6" y="11.6" width="7.4" height="7.4" rx="1.7" />
                  </svg>
                </i>
                <Link className="hx-n-refs" href="/references">
                  참고문헌
                </Link>
              </nav>
              <Link className="hx-cta hx-l hx-t hx-r" style={at(58, 30)} href="/topics">
                <span className="hx-cta-label">14개 주제 보기</span>
                <span className="hx-knob">
                  <Chevron />
                </span>
              </Link>
            </div>
          </div>

          {/* 본문 블록 */}
          <div className="hx-hero-blk">
            <p className="hx-eyebrow hx-l hx-c" style={at(65.7, -236)}>
              폐배터리 활용방안 · 국내외 문헌 35편
            </p>
            <h1 className="hx-l hx-c" style={at(62.6, -198)}>
              <span className="hx-sx">버려진 배터리를</span>
              <br />
              <span className="hx-sx">다시 자원으로</span>
            </h1>
            <div className="hx-tagrow">
              <a className="hx-play hx-l hx-c" style={at(66, 42)} href="#s-anatomy" aria-label="아래로 이동: 배터리팩 해부도">
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1.5v10.4M2.6 7.6 7 12l4.4-4.4" stroke="#0b1526" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <span className="hx-tag hx-l hx-c" style={at(131, 56.7)}>
                재제조부터 분해를 고려한 설계까지, 열네 갈래의 길.
              </span>
            </div>
            <Link className="hx-panel hx-l hx-c hx-r" style={at(58, -165)} href="/topics/soh-diagnosis" aria-label="잔존용량에 따른 경로 분기 — 05 잔존수명 진단으로 이동">
              <span className="hx-p-title">잔존용량</span>
              <span className="hx-dot" />
              <span className="hx-shield">
                <svg viewBox="0 0 30 39" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="20" height="32" rx="4" stroke="#101c33" strokeWidth="2" />
                  <rect x="11" y="1.5" width="8" height="3.5" rx="1.2" fill="#101c33" />
                  <rect x="9" y="17" width="12" height="16" rx="1.5" fill="#101c33" opacity=".85" />
                </svg>
              </span>
              <span className="hx-p-sub">
                남은 성능이
                <br />
                배터리가 갈 길을
                <br />
                정합니다
              </span>
              <span className="hx-scale" aria-hidden="true">
                <span>0</span>
                <span>60</span>
                <span>80</span>
                <span>100%</span>
              </span>
              <span className="hx-track" aria-hidden="true">
                <i className="seg-a" />
                <i className="seg-b" />
                <i className="seg-c" />
              </span>
            </Link>
          </div>

          {/* 수치 줄 */}
          <div className="hx-row">
            <div className="hx-stats">
              <div className="hx-stat">
                <span className="hx-num hx-l hx-b" style={at(64, 60.4)}>
                  10.7만
                </span>
                <span className="hx-lbl hx-l hx-b" style={at(388, 73.2)}>
                  2030년 국내
                  <br />
                  사용후 배터리
                  <br />
                  배출 전망(개)
                </span>
              </div>
              <span className="hx-slash hx-l hx-b" style={at(528, 76)} aria-hidden="true" />
              <div className="hx-stat">
                <span className="hx-num hx-l hx-b" style={at(590, 60.4)}>
                  14
                </span>
                <span className="hx-lbl hx-l hx-b" style={at(720, 96.7)}>
                  활용방안
                  <br />
                  연구 주제
                </span>
              </div>
            </div>
            <Link className="hx-meet hx-l hx-b hx-r" style={at(59, 66)} href="/references">
              <span className="hx-thumb" aria-hidden="true">
                <svg viewBox="0 0 64 64">
                  <defs>
                    <radialGradient id="hxThumbBg" cx=".5" cy=".4" r=".7">
                      <stop offset="0" stopColor="#fff" />
                      <stop offset="1" stopColor="#d5e1ee" />
                    </radialGradient>
                  </defs>
                  <rect width="64" height="64" fill="url(#hxThumbBg)" />
                  <g transform="rotate(-14 32 32)">
                    <rect x="22" y="14" width="20" height="38" rx="4" fill="#fff" fillOpacity=".55" stroke="#8aa4c6" strokeWidth="1.2" />
                    <rect x="28" y="11" width="8" height="4" rx="1.2" fill="#fff" stroke="#8aa4c6" strokeWidth="1" />
                    <circle cx="28" cy="40" r="2.6" fill="#2BB594" />
                    <circle cx="36" cy="32" r="2" fill="#E0527E" />
                    <circle cx="31" cy="24" r="1.7" fill="#F2B8C6" />
                  </g>
                  <ellipse cx="32" cy="34" rx="30" ry="6" transform="rotate(-9 32 34)" fill="none" stroke="#fff" strokeWidth="1.6" />
                </svg>
              </span>
              <b>참고문헌 35편</b>
              <span className="hx-knob">
                <Chevron />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
