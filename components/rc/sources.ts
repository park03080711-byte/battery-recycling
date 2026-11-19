/**
 * 주제 페이지 공통 — 출처 · 근거 수준.
 *  - 숫자 출처: data/references.ts 의 문헌 번호
 *  - 문자 출처: 문헌 목록 밖의 정책 · 기업 · 바탕 보고서 자료 (아래 extraSources)
 */
export type Level = "paper" | "policy" | "company" | "judgement";
export type Extra = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8" | "P9" | "P10" | "C1" | "C2" | "R";
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
  P2: { title: "국토교통부 보도자료 「전기차 배터리 안전성, 정부가 직접 인증한다」(2025.2.17) — 개정 자동차관리법 시행(배터리 안전성 인증제 · 이력관리제)", note: "정책 자료 · 제도는 개정될 수 있음", label: "국토부" },
  P3: { title: "「사용후 배터리의 관리 및 산업육성에 관한 법률」(법률 제21683호, 2026.5.26 공포 · 2027.5.27 시행) 제14~16조(성능평가 · 이력관리) · 제21~23조(재생원료 생산 인증 · 사용 여부와 함유율 인증 · 함유율 목표) — 국가법령정보센터, 법률신문 해설", note: "법령 · 시행 전이며 하위 법령에서 세부 기준이 정해짐", label: "법률" },
  P4: { title: "관계부처 합동 「사용후 배터리 산업 육성을 위한 법·제도·인프라 구축방안」(2023.12.13 비상경제장관회의) — 기획재정부 발표 및 언론 보도", note: "정부 방안 · 시행 여부와 세부 기준은 하위 법령에서 확인 필요", label: "정부 방안" },
  P5: { title: "UN 위험물 도로 운송 협정(ADR) 특수 조항 376 — 손상 · 결함 리튬 배터리 (UNECE)", note: "국제 규정 · 판본마다 조문이 개정됨", label: "ADR" },
  P6: { title: "환경부 「폐기물관리법 시행규칙」 일부 개정 (2024.12.28 시행) — 언론 보도(뉴시스 2024.12.26)", note: "정책 자료 · 제도는 개정될 수 있음", label: "환경부" },
  P7: { title: "EU 배터리 규정 원문 (Regulation (EU) 2023/1542) 제8조(재생원료) · 제77조(배터리 여권) · 부속서 XIII(여권에 담을 정보) — EUR-Lex 및 조문 정리본", note: "규정 원문 · 위임 법령으로 세부 기준이 정해짐", label: "EU 규정" },
  P8: { title: "산업부 · 기후부 보도자료 「산업부와 기후부, 칸막이 허물고 사용후배터리 산업 육성에 박차」(2026.8.7)", note: "정부 발표 · 계획 단계", label: "정부" },
  P9: { title: "EU 공동연구센터(JRC) 「배터리 재생원료 산정 · 검증 통일 규칙 연구」(Pierri 외, 2026.7, EUR 40745, doi:10.2760/8978707) · 집행위원회 위임규정 초안 「코발트 · 니켈 · 리튬 · 납 재생원료 산정 · 검증 방법」(Ares(2026)7823470, 2026.8 의견수렴) · 유럽 배터리 업계 단체(RECHARGE) 의견서(2026.9)", note: "EU 연구 보고서 · 초안(확정 전) · 업계 의견", label: "EU 초안" },
  P10: { title: "환경부 · 기후에너지환경부 보도자료 — 「전기차 폐배터리 재생원료 인증 시범사업 추진」(2024.3.26), 「사용후 배터리, 국가 핵심 자원으로 키운다」(2025.5.14), 「폐배터리 속 유가금속 가치 공인한다… 배터리 재생원료 인증제 시범사업 착수」(2026.6.25)", note: "정부 발표 · 시범사업 기준(세부 운영지침은 2027년 초 고시 예정)", label: "기후부" },
  C1: { title: "국내 리사이클링 기업 공개 자료 — 공정 설명, 회수율 · CO₂ 절감 수치", note: "기업 자체 발표 기준", label: "기업" },
  C2: { title: "THOTH(토트) DisMantleBot — CES 2025 혁신상(Innovation Awards) 수상작 소개 페이지 (CES 주관사 CTA)", note: "기업 자체 발표 · 외부 검증 전", label: "기업" },
  R: { title: "폐배터리 리사이클링 기술 분석 보고서 (2026.9) — 본 사이트의 바탕 보고서", note: "조사자 정리 · 판단", label: "보고서" },
};

/** 여러 목록에서 인용된 출처를 모아 학술 문헌(번호순)과 그 밖의 자료로 나눈다 */
export function collectCited(...lists: Src[][]) {
  const all = Array.from(new Set<Src>(lists.flat()));
  const papers = (all.filter((s) => typeof s === "number") as number[]).sort((a, b) => a - b);
  const other = all.filter((s) => typeof s !== "number") as Extra[];
  return { papers, other };
}
