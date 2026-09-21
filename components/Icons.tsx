import type { ReactNode } from "react";

const ACCENT = "#F5C400";

function Frame({ children, size = 56, title }: { children: ReactNode; size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

/** 주제별 라인 아이콘 — 노란 점은 강조 포인트 */
const paths: Record<string, ReactNode> = {
  // 01 재제조: 배터리 팩 + 교체되는 셀
  remanufacturing: (
    <>
      <circle cx="33" cy="15" r="7" fill={ACCENT} stroke="none" />
      <rect x="6" y="16" width="30" height="20" rx="2" />
      <path d="M36 22h3v8h-3" />
      <path d="M13 16v20M20 16v20M27 16v20" />
      <rect x="20" y="20" width="7" height="12" fill="currentColor" opacity=".18" stroke="none" />
      <path d="M31 8l3 3-3 3M34 11h-7" />
    </>
  ),
  // 02 재사용: 배터리 → 집(ESS)
  reuse: (
    <>
      <circle cx="14" cy="14" r="7" fill={ACCENT} stroke="none" />
      <path d="M8 26l16-12 16 12" />
      <path d="M12 23v17h24V23" />
      <rect x="18" y="28" width="12" height="8" rx="1" />
      <path d="M23 30l-2 3h4l-2 3" />
    </>
  ),
  // 03 재활용: 순환 화살표 + 원소
  recycling: (
    <>
      <circle cx="24" cy="24" r="6" fill={ACCENT} stroke="none" />
      <path d="M38 20a15 15 0 0 0-26-6" />
      <path d="M12 8v6h6" />
      <path d="M10 28a15 15 0 0 0 26 6" />
      <path d="M36 40v-6h-6" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor" stroke="none">Li</text>
    </>
  ),
  // 04 업사이클링: 위로 향하는 화살표 + 육각 구조
  upcycling: (
    <>
      <circle cx="34" cy="14" r="7" fill={ACCENT} stroke="none" />
      <path d="M17 18l7-4 7 4v8l-7 4-7-4z" />
      <path d="M24 30v10M17 26l-7 4v8M31 26l7 4v8" />
      <path d="M34 6v10M30 10l4-4 4 4" />
    </>
  ),
  // 05 잔존수명 진단: 게이지
  "soh-diagnosis": (
    <>
      <circle cx="31" cy="22" r="6" fill={ACCENT} stroke="none" />
      <path d="M8 32a16 16 0 0 1 32 0" />
      <path d="M24 32l7-10" />
      <circle cx="24" cy="32" r="2.5" />
      <path d="M12 26l2 1M24 16v2M36 26l-2 1" />
      <path d="M8 38h32" />
    </>
  ),
  // 06 안전 관리: 방패 + 번개
  safety: (
    <>
      <circle cx="16" cy="16" r="7" fill={ACCENT} stroke="none" />
      <path d="M24 6l14 5v10c0 9-6 15-14 19-8-4-14-10-14-19V11z" />
      <path d="M26 15l-5 9h6l-5 9" />
    </>
  ),
  // 07 자동화 해체: 로봇 팔
  "automated-disassembly": (
    <>
      <circle cx="32" cy="12" r="6" fill={ACCENT} stroke="none" />
      <path d="M8 40h16" />
      <path d="M16 40v-6" />
      <rect x="11" y="30" width="10" height="4" rx="1" />
      <path d="M16 30l6-12 10-4" />
      <circle cx="22" cy="18" r="2" />
      <path d="M32 14l4 4M32 14l2-5" />
      <rect x="30" y="30" width="12" height="10" rx="1" />
      <path d="M36 30v10" />
    </>
  ),
  // 08 부산물 회수: 플라스크 + 방울
  "byproduct-recovery": (
    <>
      <circle cx="30" cy="30" r="7" fill={ACCENT} stroke="none" />
      <path d="M19 6h10M21 6v12L11 36a3 3 0 0 0 3 4h20a3 3 0 0 0 3-4L27 18V6" />
      <path d="M15 30h18" />
      <path d="M38 8c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z" />
    </>
  ),
  // 09 이력관리: 여권 + QR
  traceability: (
    <>
      <circle cx="33" cy="33" r="7" fill={ACCENT} stroke="none" />
      <rect x="10" y="6" width="24" height="34" rx="2" />
      <circle cx="22" cy="17" r="5" />
      <path d="M15 28h14M15 33h8" />
      <rect x="30" y="28" width="10" height="10" rx="1" fill="#fff" />
      <path d="M33 31h1M37 31h0.5M33 35h4" />
    </>
  ),
  // 10 재생원료 인증: 인증 배지
  certification: (
    <>
      <circle cx="16" cy="16" r="7" fill={ACCENT} stroke="none" />
      <circle cx="24" cy="20" r="11" />
      <path d="M19 20l4 4 7-8" />
      <path d="M17 29l-4 12 6-3 4 5 2-10M31 29l4 12-6-3-4 5" />
    </>
  ),
  // 11 LCA: 잎 + 순환
  lca: (
    <>
      <circle cx="31" cy="15" r="7" fill={ACCENT} stroke="none" />
      <path d="M12 36C12 22 22 12 38 10c0 16-10 26-24 26z" />
      <path d="M12 36l14-14" />
      <path d="M8 40h8" />
    </>
  ),
  // 12 기술경제성: 차트 + 동전
  "techno-economic": (
    <>
      <circle cx="34" cy="14" r="7" fill={ACCENT} stroke="none" />
      <path d="M8 8v32h32" />
      <path d="M14 32l7-8 6 5 11-13" />
      <path d="M32 16h6v6" />
      <text x="34" y="17.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">₩</text>
    </>
  ),
  // 13 공급망: 지구 + 경로
  "supply-chain": (
    <>
      <circle cx="16" cy="15" r="7" fill={ACCENT} stroke="none" />
      <circle cx="24" cy="24" r="15" />
      <path d="M9 24h30M24 9c5 5 5 25 0 30M24 9c-5 5-5 25 0 30" />
      <circle cx="35" cy="34" r="3" fill="#fff" />
    </>
  ),
  // 14 분해를 고려한 설계: 도면 + 컴퍼스
  "design-for-disassembly": (
    <>
      <circle cx="32" cy="32" r="7" fill={ACCENT} stroke="none" />
      <rect x="7" y="9" width="28" height="22" rx="1" strokeDasharray="3 3" />
      <path d="M14 16h8v8h-8zM26 16h3M26 20h3" />
      <path d="M36 22l-6 18M36 22l6 18M36 22v-4" />
      <path d="M31 36h10" />
    </>
  ),
};

export function TopicIcon({ slug, size = 56 }: { slug: string; size?: number }) {
  return <Frame size={size}>{paths[slug]}</Frame>;
}

export function FactIcon({ kind, size = 56 }: { kind: number; size?: number }) {
  const icons = [
    <>
      <circle cx="30" cy="16" r="7" fill={ACCENT} stroke="none" />
      <path d="M8 40h32M12 40V26h6v14M21 40V18h6v22M30 40V10h6v30" />
    </>,
    <>
      <circle cx="16" cy="16" r="7" fill={ACCENT} stroke="none" />
      <rect x="10" y="8" width="26" height="32" rx="2" />
      <path d="M16 20l4 4 8-8M16 31h14M16 35h9" />
    </>,
    <>
      <circle cx="32" cy="14" r="7" fill={ACCENT} stroke="none" />
      <path d="M8 40h32M11 40V20l13-10 13 10v20" />
      <path d="M19 40V28h10v12" />
    </>,
  ];
  return <Frame size={size}>{icons[kind % icons.length]}</Frame>;
}

export function ReportIcon({ kind }: { kind: "report" | "refs" | "topics" }) {
  const map = {
    report: (
      <>
        <circle cx="16" cy="14" r="8" fill={ACCENT} stroke="none" />
        <rect x="12" y="8" width="24" height="32" rx="2" />
        <path d="M17 17h14M17 22h14M17 27h9" />
        <path d="M28 32l3 3 5-6" />
      </>
    ),
    refs: (
      <>
        <circle cx="32" cy="14" r="8" fill={ACCENT} stroke="none" />
        <path d="M8 12c6-2 11-1 16 2v26c-5-3-10-4-16-2z" />
        <path d="M40 12c-6-2-11-1-16 2v26c5-3 10-4 16-2z" />
      </>
    ),
    topics: (
      <>
        <circle cx="16" cy="16" r="8" fill={ACCENT} stroke="none" />
        <rect x="8" y="8" width="13" height="13" rx="2" />
        <rect x="27" y="8" width="13" height="13" rx="2" />
        <rect x="8" y="27" width="13" height="13" rx="2" />
        <rect x="27" y="27" width="13" height="13" rx="2" />
      </>
    ),
  };
  return <Frame size={84}>{map[kind]}</Frame>;
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="84 30" strokeLinecap="round" transform="rotate(-30 20 20)" />
      <path d="M33.5 6.5l1.6 6.2-6.2-1.2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="12" width="12" height="17" rx="2" fill="currentColor" />
      <rect x="17.5" y="9.5" width="5" height="3" rx="1" fill="currentColor" />
      <path d="M21 15l-3 5h4l-3 5" fill="none" stroke="#F5C400" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M9 1.5L1 8h2.2v8.5h4.3v-5h3v5h4.3V8H17z" />
    </svg>
  );
}
