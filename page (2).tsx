/* ─────────────────────────────────────────────
   Design tokens
   ───────────────────────────────────────────── */
:root {
  --ink: #0e1116;
  --text: #2b2f36;
  --muted: #5f6673;
  --line: #e3e6eb;
  --line-strong: #cfd5dd;
  --bg: #ffffff;
  --bg-soft: #f4f6f9;

  --blue-950: #041b3f;
  --blue-900: #07275a;
  --blue: #0b3f8c;
  --blue-500: #2a63c4;
  --blue-100: #e6eefa;
  --accent: #f5c400;

  /* 주제 팔레트 — 금속 황산염 결정의 실제 색 */
  --ni: #116f5a;
  --co: #a32e54;
  --mn: #e9a6b5;
  --li: #9aa0a6;

  /* 타입 스케일 (8단계) */
  --fs-xs: 0.8125rem;  /* 13 */
  --fs-sm: 0.9375rem;  /* 15 */
  --fs-md: 1.0625rem;  /* 17 본문 */
  --fs-lg: 1.25rem;    /* 20 */
  --fs-xl: 1.625rem;   /* 26 */
  --fs-2xl: 2.25rem;   /* 36 */
  --fs-3xl: clamp(2.25rem, 4.4vw, 3.75rem);  /* 60 */
  --fs-4xl: clamp(2.5rem, 5.6vw, 4.5rem);    /* 72 */

  /* 간격 (8px 배수) */
  --sp-1: 8px;
  --sp-2: 16px;
  --sp-3: 24px;
  --sp-4: 32px;
  --sp-6: 48px;
  --sp-8: 64px;
  --sp-12: 96px;
  --sp-16: 128px;

  --container: 1280px;
  --header-h: 84px;
  --radius: 14px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
    "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  font-size: var(--fs-md);
  line-height: 1.8;
  color: var(--text);
  background: var(--bg);
  word-break: keep-all;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, p { margin: 0; }
a { color: inherit; text-decoration: none; }
ul, ol { margin: 0; padding: 0; list-style: none; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: 0; }
img, svg { display: block; max-width: 100%; }

:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 3px;
  border-radius: 4px;
}
/* 어두운 배경 위에서는 노랑(대비 6:1 이상) · 컬러 패널 위에서는 흰색 */
.hero :focus-visible,
.footer :focus-visible,
.header.is-overlay :focus-visible { outline-color: var(--accent); }
.panels :focus-visible,
.sub-visual :focus-visible { outline-color: #fff; }

.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  z-index: 999;
  background: var(--blue);
  color: #fff;
  padding: 8px 16px;
}
.skip-link:focus { left: 8px; }

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--sp-4);
}

.eyebrow {
  display: inline-block;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 0.02em;
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

.btn-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 22px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: var(--fs-sm);
  font-weight: 600;
  transition: background 0.3s var(--ease), color 0.3s var(--ease), border-color 0.3s var(--ease);
}
.btn-line:hover { background: var(--blue); border-color: var(--blue); color: #fff; }
.btn-line.light:hover { background: #fff; border-color: #fff; color: var(--blue); }

/* ─────────────────────────────────────────────
   Header / GNB
   ───────────────────────────────────────────── */
.header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  height: var(--header-h);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--line);
  transition: background 0.35s var(--ease), color 0.35s var(--ease), border-color 0.35s var(--ease);
}
.header.is-overlay {
  background: transparent;
  color: #fff;
  border-bottom-color: transparent;
}
.header.is-overlay.is-open,
.header.is-open {
  background: #fff;
  color: var(--ink);
  border-bottom-color: var(--line);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--sp-6);
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.125rem;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.logo small {
  display: block;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  opacity: 0.7;
}
.gnb { display: flex; height: 100%; }
.gnb > li { position: relative; height: 100%; }
.gnb > li > a {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 26px;
  font-size: var(--fs-md);
  font-weight: 600;
  position: relative;
}
.gnb > li > a::after {
  content: "";
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 0;
  height: 3px;
  background: var(--blue);
  transform: scaleX(0);
  transition: transform 0.35s var(--ease);
}
.gnb > li:hover > a::after,
.gnb > li > a[aria-current="page"]::after { transform: scaleX(1); }

.mega {
  position: fixed;
  left: 0;
  right: 0;
  top: var(--header-h);
  background: #fff;
  border-bottom: 1px solid var(--line);
  box-shadow: 0 24px 40px -24px rgba(7, 39, 90, 0.18);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: opacity 0.3s var(--ease), transform 0.3s var(--ease), visibility 0.3s;
  color: var(--ink);
}
.header.is-open .mega { opacity: 1; visibility: visible; transform: none; }
.mega-inner {
  display: grid;
  grid-template-columns: 260px repeat(4, 1fr);
  gap: var(--sp-4);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-6) var(--sp-8);
}
.mega-intro h2 { font-size: var(--fs-xl); font-weight: 800; color: var(--ink); line-height: 1.35; }
.mega-intro p { margin-top: var(--sp-2); font-size: var(--fs-sm); color: var(--muted); line-height: 1.7; }
.mega-col h3 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 2px solid var(--ink);
  font-size: var(--fs-md);
  font-weight: 800;
}
.mega-col h3 span { font-size: var(--fs-xs); font-weight: 600; color: var(--muted); letter-spacing: 0.06em; }
.mega-col a {
  display: flex;
  gap: 10px;
  padding: 6px 0;
  font-size: var(--fs-sm);
  color: var(--text);
  transition: color 0.2s;
}
.mega-col a em { font-style: normal; font-weight: 700; color: var(--muted); min-width: 22px; transition: color 0.2s; }
.mega-col a:hover { color: var(--blue); }
.mega-col a:hover em { color: var(--blue); }

.header-util { display: flex; align-items: center; gap: 18px; }
.menu-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
}
.menu-btn span, .menu-btn span::before, .menu-btn span::after {
  display: block;
  width: 24px;
  height: 2px;
  background: currentColor;
  position: relative;
  transition: transform 0.3s var(--ease), background 0.3s;
}
.menu-btn span::before, .menu-btn span::after { content: ""; position: absolute; left: 0; }
.menu-btn span::before { top: -7px; }
.menu-btn span::after { top: 7px; }
.menu-btn[aria-expanded="true"] span { background: transparent; }
.menu-btn[aria-expanded="true"] span::before { transform: translateY(7px) rotate(45deg); }
.menu-btn[aria-expanded="true"] span::after { transform: translateY(-7px) rotate(-45deg); }

.mobile-nav {
  position: fixed;
  inset: var(--header-h) 0 0 0;
  background: #fff;
  color: var(--ink);
  overflow-y: auto;
  padding: var(--sp-3) var(--sp-3) var(--sp-8);
  z-index: 99;
}
.mobile-nav h3 { margin-top: var(--sp-3); font-size: var(--fs-sm); color: var(--muted); font-weight: 700; }
.mobile-nav a { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); font-weight: 600; }
.mobile-nav a em { font-style: normal; color: var(--blue); min-width: 24px; }

@media (max-width: 1100px) {
  .gnb { display: none; }
  .header-inner { padding: 0 var(--sp-3); }
}
@media (min-width: 1101px) {
  .mobile-nav { display: none; }
}

/* ─────────────────────────────────────────────
   Fullpage (main)
   ───────────────────────────────────────────── */
.fp {
  height: 100vh;
  height: 100svh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.fp-section {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  scroll-snap-align: start;
  overflow: hidden;
}
.fp-section.auto { min-height: auto; scroll-snap-align: end; }

.fp-dots {
  position: fixed;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.fp-dots a {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.fp-dots a i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
  transition: transform 0.3s var(--ease), opacity 0.3s;
}
.fp-dots a span { opacity: 0; transform: translateX(6px); transition: opacity 0.3s, transform 0.3s var(--ease); }
.fp-dots a.active i { opacity: 1; transform: scale(1.4); }
.fp-dots a.active span, .fp-dots a:hover span { opacity: 1; transform: none; }
.fp-dots.on-dark a { color: #fff; }
.fp-dots:not(.on-dark) a.active { color: var(--blue); }
@media (max-width: 900px) { .fp-dots { display: none; } }

/* Hero */
.hero { color: #fff; background: var(--blue-950); }
.hero-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.2s var(--ease);
}
.hero-slide.active { opacity: 1; }
.hero-slide .hero-art { position: absolute; inset: 0; transform: scale(1.06); transition: transform 7s linear; }
.hero-slide.active .hero-art { transform: scale(1); }
.hero-art svg { width: 100%; height: 100%; }
.hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(4, 27, 63, 0.78) 0%, rgba(4, 27, 63, 0.35) 55%, rgba(4, 27, 63, 0.05) 100%);
}
.hero-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: var(--header-h);
  bottom: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--sp-6);
}
.hero-copy h1, .hero-copy h2 {
  font-size: var(--fs-4xl);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.02em;
  color: #fff;
}
.hero-copy p.en {
  margin-top: var(--sp-4);
  font-size: var(--fs-xl);
  font-weight: 300;
  letter-spacing: -0.01em;
  opacity: 0.92;
}
.hero-copy p.desc { margin-top: var(--sp-2); max-width: 560px; font-size: var(--fs-md); opacity: 0.8; }
.hero-slide .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.9s var(--ease), transform 0.9s var(--ease); }
.hero-slide.active .reveal { opacity: 1; transform: none; }
.hero-slide.active .reveal.d1 { transition-delay: 0.25s; }
.hero-slide.active .reveal.d2 { transition-delay: 0.45s; }
.hero-slide.active .reveal.d3 { transition-delay: 0.6s; }

.hero-pager {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 88px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--sp-6);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 3;
}
.hero-pager button {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  width: 64px;
  min-height: 44px;
  justify-content: center;
  text-align: left;
}
.hero-pager button.active { color: #fff; }
.hero-pager button b {
  display: block;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}
.hero-pager button b::after {
  content: "";
  position: absolute;
  inset: 0;
  background: #fff;
  transform: scaleX(0);
  transform-origin: left;
}
.hero-pager button.active b::after { animation: progress var(--dur, 6s) linear forwards; }
.hero-pager .pause {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
}
@keyframes progress { to { transform: scaleX(1); } }

.scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.75);
  z-index: 3;
}
.scroll-cue i {
  width: 22px;
  height: 34px;
  border: 1.5px solid currentColor;
  border-radius: 12px;
  position: relative;
}
.scroll-cue i::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 7px;
  width: 3px;
  height: 7px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: currentColor;
  animation: wheel 1.8s var(--ease) infinite;
}
@keyframes wheel { 0% { opacity: 1; transform: translateY(0); } 80% { opacity: 0; transform: translateY(10px); } 100% { opacity: 0; } }

/* Layer panels (s2) */
.panels {
  display: flex;
  height: 100vh;
  height: 100svh;
}
.panel {
  position: relative;
  flex: 1;
  overflow: hidden;
  color: #fff;
  transition: flex 0.7s var(--ease);
  isolation: isolate;
}
.panel:hover, .panel:focus-within { flex: 1.9; }
.panel-bg { position: absolute; inset: 0; z-index: -2; transition: transform 1.2s var(--ease); }
.panel:hover .panel-bg { transform: scale(1.05); }
.panel-bg svg { width: 100%; height: 100%; }
.panel::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 0.55) 100%);
}
.panel-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 var(--sp-6) var(--sp-8);
}
.panel-range { font-size: var(--fs-sm); font-weight: 700; letter-spacing: 0.1em; opacity: 0.85; }
.panel .panel-title { margin-top: 4px; white-space: nowrap; font-size: clamp(1.75rem, 3vw, 3rem); font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; }
.panel .en { font-size: var(--fs-sm); font-weight: 600; letter-spacing: 0.14em; opacity: 0.75; }
.panel-more {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.6s var(--ease);
}
.panel:hover .panel-more, .panel:focus-within .panel-more { grid-template-rows: 1fr; }
.panel-more > div { overflow: hidden; }
.panel-more p { margin-top: var(--sp-2); max-width: 420px; font-size: var(--fs-sm); line-height: 1.7; opacity: 0.9; }
.panel-more ul { margin-top: var(--sp-2); display: flex; flex-wrap: wrap; gap: 8px; }
.panel-more li a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 6px 16px;
  line-height: 1.35;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}
.panel-more li a:hover { background: #fff; color: var(--ink); }
@media (max-width: 900px) {
  .panels { flex-direction: column; height: auto; }
  .panel { min-height: 48vh; display: flex; flex-direction: column; justify-content: flex-end; }
  .panel:hover, .panel:focus-within { flex: 1; }
  .panel-body { position: relative; padding: calc(var(--header-h) + 24px) 20px 48px; }
  .panel-more { grid-template-rows: 1fr; }
}
/* A6: 마우스가 없는 기기(태블릿 등)에서는 패널을 펼친 상태로 */
@media (hover: none) {
  .panel-more { grid-template-rows: 1fr; }
  .panel:hover, .panel:focus-within { flex: 1; }
  /* 펼친 글이 배경 선화와 겹치지 않도록 전체를 어둡게 */
  .panel::after { background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.62) 100%); }
}

/* Topics grid (s3) */
.sec-topics {
  background: var(--bg-soft);
  padding: calc(var(--header-h) + var(--sp-6)) 0 var(--sp-8);
}
.sec-head { text-align: center; margin-bottom: var(--sp-6); }
.sec-head h2 { margin-top: 6px; font-size: var(--fs-3xl); font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1.25; }
.sec-head p { margin-top: var(--sp-2); color: var(--muted); }

.topic-filter { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: var(--sp-4); }
.topic-filter button {
  height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: #fff;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text);
  transition: all 0.25s var(--ease);
}
.topic-filter button[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: #fff; }

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.topic-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 250px;
  padding: 28px 28px 24px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  transition: transform 0.4s var(--ease), box-shadow 0.4s var(--ease), border-color 0.4s;
}
.topic-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -20px rgba(7, 39, 90, 0.25); border-color: transparent; }
.topic-card .no { font-size: var(--fs-sm); font-weight: 800; color: var(--layer, var(--blue)); }
.topic-card .tag { font-size: var(--fs-xs); font-weight: 600; color: var(--muted); margin-left: 8px; }
.topic-card h3 { margin-top: 14px; font-size: var(--fs-xl); font-weight: 700; color: var(--ink); line-height: 1.3; letter-spacing: -0.02em; }
.topic-card p { margin-top: 8px; font-size: var(--fs-sm); color: var(--muted); line-height: 1.6; }
.topic-card .icon { margin-top: auto; padding-top: 18px; color: var(--layer, var(--blue)); }
.topic-card .plus {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  line-height: 1;
  color: var(--ink);
  transition: background 0.3s, color 0.3s, transform 0.4s var(--ease);
}
.topic-card:hover .plus { background: var(--layer, var(--blue)); color: #fff; transform: rotate(90deg); }
.topic-card[hidden] { display: none; }

/* Why now (s4) */
.sec-why {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #fff;
}
.why-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(var(--header-h) + var(--sp-4)) var(--sp-8) var(--sp-8) max(var(--sp-6), calc((100vw - 1600px) / 2 + 48px));
}
.why-copy h2 { margin-top: 8px; font-size: var(--fs-3xl); font-weight: 700; color: var(--ink); line-height: 1.25; letter-spacing: -0.02em; }
.why-copy > p { margin-top: var(--sp-3); max-width: 520px; color: var(--muted); }
.why-stats { margin-top: var(--sp-6); display: grid; grid-template-columns: 1fr 1fr; gap: 28px 32px; }
.why-stats div { border-top: 2px solid var(--ink); padding-top: 14px; }
.why-stats b { display: block; font-size: var(--fs-2xl); font-weight: 800; color: var(--blue); line-height: 1.2; letter-spacing: -0.02em; }
.why-stats span { display: block; margin-top: 4px; font-size: var(--fs-sm); color: var(--text); font-weight: 600; }
.why-stats small { display: block; font-size: var(--fs-xs); color: var(--muted); }
.why-art { position: relative; background: var(--blue-100); overflow: hidden; }
.why-art svg { position: absolute; inset: 0; width: 100%; height: 100%; }
@media (max-width: 900px) {
  .sec-why { grid-template-columns: 1fr; }
  .why-copy { padding: calc(var(--header-h) + var(--sp-3)) var(--sp-3) var(--sp-6); }
  .why-art { min-height: 320px; }
}

/* Report (s5) */
.sec-report { position: relative; color: var(--ink); background: #fff; }
.report-bg { position: absolute; inset: 0; }
.report-bg svg { width: 100%; height: 100%; }
.report-inner {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1600px;
  margin: 0 auto;
  padding: calc(var(--header-h) + var(--sp-4)) var(--sp-6) var(--sp-8);
}
.report-inner h2 { margin-top: 8px; font-size: var(--fs-3xl); font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; }
.report-cards { margin-top: var(--sp-6); display: flex; flex-wrap: wrap; gap: var(--sp-6); }
.report-card { width: 240px; text-align: center; }
.report-card .ic { width: 84px; height: 84px; margin: 0 auto; color: var(--blue); }
.report-card h3 { margin-top: 12px; font-size: var(--fs-xl); font-weight: 800; color: var(--blue); }
.report-card p { margin-top: 8px; font-size: var(--fs-sm); color: var(--text); line-height: 1.6; }
.report-card .btn-line { margin-top: 18px; height: 44px; font-size: var(--fs-xs); color: var(--text); border-color: var(--line-strong); }

/* ─────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────── */
.footer { background: #16191f; color: #aab0ba; font-size: var(--fs-sm); scroll-snap-align: end; }
.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-6);
  flex-wrap: wrap;
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-6) var(--sp-4);
}
.footer .logo { color: #fff; }
.footer-slogan { margin-top: 12px; color: #fff; font-size: var(--fs-lg); font-weight: 300; }
.footer-links { display: flex; gap: var(--sp-6); flex-wrap: wrap; }
.footer-links h2 { margin: 0 0 10px; font-weight: 700; color: #fff; font-size: var(--fs-xs); letter-spacing: 0.12em; margin-bottom: 10px; }
.footer-links a { display: block; padding: 3px 0; transition: color 0.2s; }
.footer-links a:hover { color: #fff; }
.footer-bottom {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--sp-3) var(--sp-6) var(--sp-6);
  border-top: 1px solid #2a2f37;
  font-size: var(--fs-xs);
  line-height: 1.8;
}
.footer-bottom strong { color: #d6dae0; font-weight: 600; }

/* ─────────────────────────────────────────────
   Sub page
   ───────────────────────────────────────────── */
.sub-visual {
  position: relative;
  height: 420px;
  margin-top: 0;
  overflow: hidden;
  color: #fff;
  background: var(--layer, var(--blue));
}
.sub-visual-art { position: absolute; inset: 0; }
.sub-visual-art svg { width: 100%; height: 100%; }
.sub-visual-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--header-h) + 64px);
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--sp-4);
}
.sub-visual-copy .en { font-size: var(--fs-sm); font-weight: 600; letter-spacing: 0.14em; opacity: 0.85; }
.sub-visual-copy .big { margin-top: 6px; font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; letter-spacing: -0.02em; }

.breadcrumb {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
.breadcrumb-inner {
  display: flex;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--sp-4);
  height: 56px;
}
.bc-home {
  width: 56px;
  display: grid;
  place-items: center;
  background: var(--blue);
  color: #fff;
}
.bc-drop { position: relative; width: 240px; border-right: 1px solid rgba(255, 255, 255, 0.25); }
.bc-drop > button {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: 600;
  text-align: left;
}
.bc-drop > button svg { transition: transform 0.3s var(--ease); flex-shrink: 0; }
.bc-drop > button[aria-expanded="true"] svg { transform: rotate(180deg); }
.bc-drop ul {
  position: absolute;
  left: 0;
  right: 0;
  top: 56px;
  background: #fff;
  color: var(--text);
  border: 1px solid var(--line);
  box-shadow: 0 16px 30px -16px rgba(0, 0, 0, 0.25);
  max-height: 360px;
  overflow-y: auto;
}
.bc-drop li a { display: block; padding: 11px 20px; font-size: var(--fs-sm); }
.bc-drop li a:hover, .bc-drop li a[aria-current="page"] { background: var(--bg-soft); color: var(--blue); font-weight: 700; }
@media (max-width: 700px) {
  .sub-visual { height: 340px; }
  .bc-drop { width: auto; flex: 1; }
  .bc-drop:last-child { border-right: 0; }
  .bc-drop > button { padding: 0 12px; font-size: var(--fs-xs); }
}

.page-title { text-align: center; padding: var(--sp-12) 0 var(--sp-6); }
.page-title .no { display: inline-block; font-size: var(--fs-lg); font-weight: 800; color: var(--layer, var(--blue)); }
.page-title h1 { margin-top: 4px; font-size: var(--fs-3xl); font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1.25; }
.page-title .tagline { margin-top: 10px; font-size: var(--fs-lg); color: var(--muted); }

.intro-box {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--sp-6);
  padding: var(--sp-6);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}
.intro-box .lead { font-size: var(--fs-lg); line-height: 1.75; color: var(--ink); font-weight: 500; }
.intro-box .coverage { margin-top: var(--sp-3); display: inline-flex; gap: 8px; align-items: center; font-size: var(--fs-xs); color: var(--muted); }
.intro-box .coverage b { padding: 3px 10px; border-radius: 999px; background: var(--layer-soft, var(--blue-100)); color: var(--layer, var(--blue)); font-weight: 700; }
.facts { display: grid; grid-template-columns: 1fr; gap: 0; }
.fact { display: grid; grid-template-columns: 56px 1fr; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--line); }
.fact:first-child { padding-top: 0; }
.fact:last-child { border-bottom: 0; padding-bottom: 0; }
.fact-ic { width: 56px; height: 56px; color: var(--layer, var(--blue)); }
.fact b { display: block; font-size: var(--fs-xl); font-weight: 800; color: var(--ink); line-height: 1.25; letter-spacing: -0.02em; }
.fact span { display: block; font-size: var(--fs-sm); font-weight: 600; color: var(--text); line-height: 1.5; }
.fact small { display: block; font-size: var(--fs-xs); color: var(--muted); line-height: 1.5; }
@media (max-width: 900px) {
  .intro-box { grid-template-columns: 1fr; padding: var(--sp-4) var(--sp-3); }
}

.toc {
  position: sticky;
  top: var(--header-h);
  z-index: 10;
  margin-top: var(--sp-8);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
}
.toc ul { display: flex; gap: 4px; overflow-x: auto; max-width: var(--container); margin: 0 auto; padding: 0 var(--sp-4); scrollbar-width: none; }
.toc a { display: block; padding: 16px 16px; white-space: nowrap; font-size: var(--fs-sm); font-weight: 600; color: var(--muted); border-bottom: 2px solid transparent; }
.toc a:hover { color: var(--ink); }
.toc a.active { color: var(--layer, var(--blue)); border-bottom-color: var(--layer, var(--blue)); }

.content-sec {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--sp-6);
  padding: var(--sp-12) 0 0;
  scroll-margin-top: calc(var(--header-h) + 60px);
}
.content-sec .side .label { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.14em; color: var(--layer, var(--blue)); }
.content-sec .side h2 { margin-top: 8px; font-size: var(--fs-2xl); font-weight: 700; color: var(--ink); line-height: 1.35; letter-spacing: -0.02em; }
.content-sec .side .idx { display: block; margin-top: var(--sp-2); }
.content-sec .side .idx::after { content: attr(data-n); font-size: 4.5rem; font-weight: 800; line-height: 1; color: var(--line); }
.content-body { display: flex; flex-direction: column; gap: var(--sp-4); min-width: 0; }
.content-body > p { max-width: 760px; }
@media (max-width: 900px) {
  .content-sec { grid-template-columns: 1fr; gap: var(--sp-3); padding-top: var(--sp-8); }
  .content-sec .side .idx { display: none; }
}

.bullets li { position: relative; padding-left: 22px; margin: 6px 0; }
.bullets li::before { content: ""; position: absolute; left: 4px; top: 0.72em; width: 7px; height: 7px; border-radius: 50%; background: var(--layer, var(--blue)); }

.note {
  position: relative;
  padding: var(--sp-4) var(--sp-4) var(--sp-4) calc(var(--sp-4) + 6px);
  background: var(--layer-soft, var(--blue-100));
  border-radius: var(--radius);
}
.note::before { content: ""; position: absolute; left: 0; top: 24px; bottom: 24px; width: 4px; border-radius: 0 4px 4px 0; background: var(--layer, var(--blue)); }
.note h3 { font-size: var(--fs-md); font-weight: 800; color: var(--ink); }
.note p { margin-top: 6px; font-size: var(--fs-sm); line-height: 1.8; color: var(--text); }

.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0; counter-reset: step; }
.step { position: relative; padding: 0 20px 0 0; }
.step::before {
  counter-increment: step;
  content: counter(step, decimal-leading-zero);
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--layer, var(--blue));
  background: #fff;
  color: var(--layer, var(--blue));
  font-weight: 800;
  font-size: var(--fs-sm);
  position: relative;
  z-index: 1;
}
.step::after { content: ""; position: absolute; top: 24px; left: 48px; right: 0; height: 2px; background: repeating-linear-gradient(90deg, var(--line-strong) 0 6px, transparent 6px 12px); }
.step:last-child::after { display: none; }
.step h3 { margin-top: 14px; font-size: var(--fs-md); font-weight: 700; color: var(--ink); }
.step p { margin-top: 4px; font-size: var(--fs-sm); color: var(--muted); line-height: 1.65; }
@media (max-width: 700px) {
  .steps { grid-template-columns: 1fr; gap: var(--sp-3); }
  .step { padding: 0 0 0 64px; }
  .step::before { position: absolute; left: 0; top: 0; }
  .step::after { left: 23px; top: 48px; bottom: -24px; right: auto; width: 2px; height: auto; background: repeating-linear-gradient(180deg, var(--line-strong) 0 6px, transparent 6px 12px); }
  .step h3 { margin-top: 10px; }
}

.table-wrap { overflow-x: auto; border-top: 2px solid var(--ink); }
.table-wrap table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); min-width: 520px; }
.table-wrap th { background: var(--bg-soft); color: var(--ink); font-weight: 700; text-align: left; padding: 14px 16px; border-bottom: 1px solid var(--line-strong); }
.table-wrap td { padding: 14px 16px; border-bottom: 1px solid var(--line); vertical-align: top; line-height: 1.6; }
.table-wrap caption { caption-side: bottom; text-align: left; padding-top: 10px; font-size: var(--fs-xs); color: var(--muted); }

.refs-sec { margin-top: var(--sp-12); padding: var(--sp-8) 0; background: var(--bg-soft); }
.refs-sec h2 { font-size: var(--fs-xl); font-weight: 800; color: var(--ink); }
.ref-list { margin-top: var(--sp-3); display: grid; gap: 12px; }
.ref-item { display: grid; grid-template-columns: 48px 1fr; gap: 12px; padding: 18px 20px; background: #fff; border: 1px solid var(--line); border-radius: 10px; font-size: var(--fs-sm); line-height: 1.6; }
.ref-item .rid { font-weight: 800; color: var(--blue); }
.ref-item .rt { color: var(--ink); font-weight: 600; }
.ref-item .rm { color: var(--muted); font-size: var(--fs-xs); margin-top: 2px; }
.ref-item a.doi { display: inline-block; padding: 5px 0; color: var(--blue); font-size: var(--fs-xs); text-decoration: underline; text-underline-offset: 2px; }

.related { padding: var(--sp-8) 0 var(--sp-12); }
.related h2 { font-size: var(--fs-xl); font-weight: 800; color: var(--ink); margin-bottom: var(--sp-3); }
.pager { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.pager a { display: flex; flex-direction: column; gap: 2px; padding: var(--sp-4) var(--sp-3); transition: background 0.2s; }
.pager a:hover { background: var(--bg-soft); }
.pager a + a { border-left: 1px solid var(--line); text-align: right; }
.pager small { font-size: var(--fs-xs); color: var(--muted); font-weight: 600; letter-spacing: 0.06em; }
.pager b { font-size: var(--fs-lg); color: var(--ink); }

/* ─────────────────────────────────────────────
   Visualizations
   ───────────────────────────────────────────── */
.viz { border: 1px solid var(--line); border-radius: var(--radius); padding: var(--sp-4); background: #fff; }
.viz-title { font-size: var(--fs-sm); font-weight: 800; color: var(--ink); }
.viz-cap { margin-top: var(--sp-2); font-size: var(--fs-xs); color: var(--muted); line-height: 1.6; }

/* SOH branch */
.soh-bar { position: relative; margin-top: var(--sp-4); height: 56px; border-radius: 10px; overflow: hidden; display: flex; }
.soh-bar > div { display: flex; align-items: center; justify-content: center; font-size: var(--fs-sm); font-weight: 700; color: #fff; transition: filter 0.3s; }
.soh-bar > div.dim { background: var(--bg-soft) !important; color: #4b5563; box-shadow: inset 0 0 0 1px var(--line); }
.soh-scale { position: relative; height: 26px; margin-top: 8px; font-size: var(--fs-xs); color: var(--muted); }
.soh-scale span { position: absolute; transform: translateX(-50%); }
.soh-legend { margin-top: var(--sp-3); display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.soh-legend a { display: block; padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px; transition: border-color 0.2s; }
.soh-legend a:hover { border-color: var(--ink); }
.soh-legend a.current { border-color: var(--layer, var(--blue)); background: var(--layer-soft, var(--blue-100)); }
.soh-legend b { display: block; font-size: var(--fs-md); color: var(--ink); }
.soh-legend span { display: block; font-size: var(--fs-xs); color: var(--muted); line-height: 1.5; }
@media (max-width: 700px) { .soh-legend { grid-template-columns: 1fr; } }

/* Temperature axis */
.temp-axis { position: relative; margin: 112px 8px var(--sp-2); height: 12px; border-radius: 6px; background: linear-gradient(90deg, #cfe3f7 0%, #f8d27a 45%, #e8743b 75%, #b3261e 100%); }
.temp-mark { position: absolute; top: 50%; transform: translate(-50%, -50%); }
/* 누르는 영역 44px, 보이는 점은 22px */
.temp-mark button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}
.temp-mark button::before {
  content: "";
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--ink);
  box-sizing: border-box;
  transition: transform 0.2s var(--ease), border-color 0.2s;
}
.temp-mark button:hover::before, .temp-mark button[aria-pressed="true"]::before { transform: scale(1.25); border-color: var(--blue); }
.temp-mark .tl { position: absolute; left: 50%; transform: translateX(-50%); white-space: nowrap; font-size: var(--fs-xs); font-weight: 700; color: var(--ink); line-height: 1.3; text-align: center; }
.temp-mark.up .tl { bottom: 36px; }
.temp-mark.down .tl { top: 36px; }
.temp-mark .tl small { display: block; font-weight: 500; color: var(--muted); }
.temp-ticks { display: flex; justify-content: space-between; margin: 52px 8px 0; font-size: var(--fs-xs); color: var(--muted); }
.temp-detail { margin-top: var(--sp-3); padding: var(--sp-3); background: var(--bg-soft); border-radius: 10px; font-size: var(--fs-sm); min-height: 84px; }
.temp-detail b { color: var(--ink); }

/* Process grid */
.proc-grid { margin-top: var(--sp-3); display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.proc { padding: 16px 18px; border-radius: 10px; border: 1.5px solid var(--ink); background: #fff; }
.proc.research { border-style: dashed; border-color: var(--line-strong); background: var(--bg-soft); }
.proc .pk { font-size: var(--fs-xs); font-weight: 700; color: var(--muted); }
.proc b { display: block; margin-top: 2px; font-size: var(--fs-md); color: var(--ink); }
.proc p { margin-top: 6px; font-size: var(--fs-xs); color: var(--muted); line-height: 1.55; }
.proc .var { display: inline-block; margin-top: 8px; font-size: 0.75rem; font-weight: 700; color: var(--blue); }
.proc-legend { display: flex; gap: 20px; margin-top: 10px; font-size: var(--fs-xs); color: var(--muted); }
.proc-legend i { display: inline-block; width: 22px; height: 12px; border: 1.5px solid var(--ink); border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
.proc-legend i.d { border-style: dashed; border-color: var(--line-strong); }

/* Products */
.products { margin-top: var(--sp-3); display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.product { text-align: center; }
.product .crystal { width: 100%; aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center; }
.product b { display: block; margin-top: 10px; font-size: var(--fs-sm); color: var(--ink); }
.product span { display: block; font-size: var(--fs-xs); color: var(--muted); }
@media (max-width: 700px) { .products { grid-template-columns: repeat(2, 1fr); } }

/* Bars (EU / growth) */
.bars { margin-top: var(--sp-3); display: grid; gap: 14px; }
.bar-row { display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: center; font-size: var(--fs-sm); }
.bar-row > span { font-weight: 700; color: var(--ink); }
.bar-track { display: grid; gap: 4px; }
.bar { position: relative; height: 22px; border-radius: 4px; background: var(--bg-soft); overflow: hidden; }
.bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; }
.bar em { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-style: normal; font-size: 0.75rem; font-weight: 700; color: #fff; mix-blend-mode: normal; }
.bar em.out { color: var(--ink); }
.bar-key { display: flex; gap: 18px; margin-top: 12px; font-size: var(--fs-xs); color: var(--muted); }
.bar-key i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }

.growth { margin-top: var(--sp-4); display: flex; align-items: flex-end; gap: 10px; height: 220px; padding-bottom: 28px; position: relative; border-bottom: 1px solid var(--line-strong); }
.growth .col { flex: 1; position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
.growth .col i { width: 100%; max-width: 64px; border-radius: 6px 6px 0 0; background: var(--co); }
.growth .col.est i { background: repeating-linear-gradient(45deg, var(--co) 0 6px, #c85a7c 6px 12px); opacity: 0.85; }
.growth .col b { font-size: var(--fs-xs); color: var(--ink); margin-bottom: 6px; }
.growth .col span { position: absolute; bottom: -26px; font-size: var(--fs-xs); color: var(--muted); }

/* Feasibility */
.feas { margin-top: var(--sp-3); display: grid; gap: 10px; }
.feas-row { display: grid; grid-template-columns: 170px 110px 1fr; gap: 16px; align-items: center; padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px; font-size: var(--fs-sm); }
.feas-row b { color: var(--ink); }
.feas-meter { display: flex; gap: 4px; }
.feas-meter i { width: 20px; height: 8px; border-radius: 2px; background: var(--line); }
.feas-meter i.on { background: var(--blue); }
.feas-row span { color: var(--muted); font-size: var(--fs-xs); line-height: 1.5; }
@media (max-width: 700px) { .feas-row { grid-template-columns: 1fr auto; } .feas-row span { grid-column: 1 / -1; } }

/* Hub & spoke */
.hs { margin-top: var(--sp-3); display: grid; grid-template-columns: 1fr 60px 1fr; gap: 12px; align-items: stretch; }
.hs-box { border-radius: 12px; padding: 20px; background: var(--bg-soft); }
.hs-box.hub { background: var(--blue-100); }
.hs-box h3 { font-size: var(--fs-sm); font-weight: 800; color: var(--ink); }
.hs-box h3 small { font-weight: 600; color: var(--muted); margin-left: 6px; }
.hs-box ol { margin-top: 10px; counter-reset: hs; display: grid; gap: 8px; }
.hs-box li { counter-increment: hs; display: grid; grid-template-columns: 26px 1fr; gap: 8px; font-size: var(--fs-xs); line-height: 1.55; color: var(--text); }
.hs-box li::before { content: counter(hs); width: 22px; height: 22px; border-radius: 50%; background: #fff; color: var(--blue); font-weight: 800; display: grid; place-items: center; font-size: 0.6875rem; }
.hs-box li b { color: var(--ink); display: block; font-size: var(--fs-sm); }
.hs-arrow { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--blue); font-size: 0.6875rem; font-weight: 700; text-align: center; }
@media (max-width: 700px) { .hs { grid-template-columns: 1fr; } .hs-arrow { flex-direction: row; } .hs-arrow svg { transform: rotate(90deg); } }

/* Overview pages */
.layer-block { padding: var(--sp-8) 0; border-top: 1px solid var(--line); scroll-margin-top: calc(var(--header-h) + 20px); }
.layer-block:first-of-type { border-top: 0; }
.layer-head { display: grid; grid-template-columns: 280px 1fr; gap: var(--sp-6); margin-bottom: var(--sp-4); }
.layer-head .code { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.14em; color: var(--layer); }
.layer-head h2 { margin-top: 6px; font-size: var(--fs-2xl); font-weight: 700; color: var(--ink); }
.layer-head .q { font-size: var(--fs-lg); font-weight: 700; color: var(--ink); }
.layer-head p { margin-top: 6px; color: var(--muted); }
@media (max-width: 900px) { .layer-head { grid-template-columns: 1fr; gap: var(--sp-2); } }

.ref-group { margin-top: var(--sp-6); }
.ref-group h2 { font-size: var(--fs-xl); font-weight: 800; color: var(--ink); padding-bottom: 12px; border-bottom: 2px solid var(--ink); }

/* Motion safety */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  .fp { scroll-snap-type: none; }
}

.intro-box.ref-stats { grid-template-columns: repeat(4, 1fr); gap: var(--sp-3); }
@media (max-width: 700px) { .intro-box.ref-stats { grid-template-columns: 1fr 1fr; } }

figure { margin: 0; }
@media (max-width: 700px) {
  .container { padding: 0 20px; }
  .viz { padding: 20px 16px; }
  .scroll-cue { display: none; }
  .hero-copy, .hero-pager { padding: 0 20px; }
  .hero-pager { bottom: 48px; }
  .content-sec .side h2 { font-size: var(--fs-xl); }
  .page-title { padding: var(--sp-8) 0 var(--sp-4); }
  .temp-mark .tl { font-size: 0.6875rem; }
  .sub-visual-copy { top: calc(var(--header-h) + 40px); padding: 0 20px; }
  .breadcrumb-inner { padding: 0; }
}

/* A2: 세로 공간이 작을 때(200% 확대, 가로 모드 폰) 첫 화면 문구와 버튼이 겹치지 않게 */
@media (max-height: 640px) {
  .hero-copy { bottom: 96px; }
  .hero-copy p.desc { display: none; }
  .hero-copy p.en { margin-top: var(--sp-2); font-size: var(--fs-lg); }
  .hero-pager { bottom: 28px; }
  .scroll-cue { display: none; }
}
@media (max-width: 700px) {
  .hero-copy { bottom: 120px; }
}

/* A7: 가로로 넘기는 표 — 키보드 포커스 가능 */
.table-wrap:focus-visible { outline-offset: 2px; }
