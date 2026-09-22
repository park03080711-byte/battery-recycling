/* 잔존용량 세 갈래 (01 · 02 · 03 공통) — 바탕 보고서 기준 */
export const tiers: { key: string; soh: string; title: string; slug: string; no: string; out: string; law: string; who: string }[] = [
  { key: "reman", soh: "80% 이상", title: "재제조", slug: "remanufacturing", no: "01", out: "다시 전기차용 배터리", law: "자동차관리법 제30조의2", who: "국토교통부" },
  { key: "reuse", soh: "60~80%", title: "재사용", slug: "reuse", no: "02", out: "ESS · UPS · 태양광 가로등 · 골프카 · 전기이륜차 · 전동휠체어 등", law: "친환경산업법 (신설 예정)", who: "환경부" },
  { key: "recycle", soh: "60% 미만", title: "재활용", slug: "recycling", no: "03", out: "리튬 · 니켈 · 코발트 등 금속 화합물", law: "폐기물관리법 제25조", who: "환경부" },
];

