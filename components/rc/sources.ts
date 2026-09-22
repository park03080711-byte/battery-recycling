/**
 * 주제 페이지 공통 — 출처 · 근거 수준.
 *  - 숫자 출처: data/references.ts 의 문헌 번호
 *  - 문자 출처: 문헌 목록 밖의 정책 · 기업 · 바탕 보고서 자료 (아래 extraSources)
 */
export type Level = "paper" | "policy" | "company" | "judgement";
export type Extra = "P1" | "P2" | "C1" | "R";
export type Src = number | Extra;

export const levelLabel: Record<Level, string> = {
  paper: "학술 문헌",
  policy: "정책 · 규정",
  company: "기업 발표",
  judgement: "조사자 판단",
};

export const depthLegend: { level: Level; what: string }[] = [
  { level: "paper", what: "동료심사를 거친 논문" },
  { level: "policy", what: "법령 · 공공기관 발표" },
  { level: "company", what: "기업 자체 발표 (외부 검증 전)" },
  { level: "judgement", what: "이 사이트의 정리 · 판단" },
];

export const extraSources: Record<Extra, { title: string; note: string; label: string }> = {
  P1: { title: "EU 배터리 규정 (Regulation (EU) 2023/1542) — KOTRA 해설자료 및 언론 보도", note: "정책 자료 · 학술 문헌과 검증 수준이 다름", label: "정책" },
  P2: { title: "국토교통부 보도자료 「전기차 배터리 안전성, 정부가 직접 인증한다」(2025.2.17) — 개정 자동차관리법 시행", note: "정책 자료 · 제도는 개정될 수 있음", label: "국토부" },
  C1: { title: "국내 리사이클링 기업 공개 자료 — 공정 설명, 회수율 · CO₂ 절감 수치", note: "기업 자체 발표 기준", label: "기업" },
  R: { title: "폐배터리 리사이클링 기술 분석 보고서 (2026.9) — 본 사이트의 바탕 보고서", note: "조사자 정리 · 판단", label: "보고서" },
};

/** 여러 목록에서 인용된 출처를 모아 학술 문헌(번호순)과 그 밖의 자료로 나눈다 */
export function collectCited(...lists: Src[][]) {
  const all = Array.from(new Set<Src>(lists.flat()));
  const papers = (all.filter((s) => typeof s === "number") as number[]).sort((a, b) => a - b);
  const other = all.filter((s) => typeof s !== "number") as Extra[];
  return { papers, other };
}
