/**
 * 02 재사용 페이지 데이터. 모든 수치는 출처(src)와 근거 수준(level)을 함께 가진다.
 * 42~44번 문헌은 2026년 9월 이 페이지를 보강하며 추가했다(DOI로 실존 · 서지 확인).
 */
import type { MapStep } from "../rc/SystemMap";
import type { Level, Src } from "../rc/sources";

export const facts: { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[] }[] = [
  {
    value: "60~80",
    unit: "%",
    label: "재사용으로 가는 잔존용량 기준",
    detail: "전기차에 쓰기엔 부족하지만 성능 요구가 낮은 용도에는 충분한 구간입니다. 일반적 기준이며 사업자와 용도에 따라 다릅니다.",
    level: "judgement",
    src: ["R"],
  },
  {
    value: "16",
    unit: "%",
    label: "새 배터리를 이만큼 넘게 대신해야 기후 이득",
    detail: "노르웨이 두 기업의 실제 자료로 본 결과, 재사용 배터리의 온실가스 영향은 새 배터리 제조의 16%였습니다. 새 배터리 생산을 그보다 많이 대신해야 이득입니다.",
    level: "paper",
    src: [42],
  },
  {
    value: "2~17",
    unit: "%",
    label: "재사용 단계를 넣었을 때 탄소발자국 감소",
    detail: "미국의 2020~2050년을 모델로 계산한 결과입니다. 곧바로 재활용할 때와 비교해, 두 번째 삶을 거치면 새로 캐내는 원료가 줄어 탄소발자국이 줄었습니다.",
    level: "paper",
    src: [43],
  },
];

/* 두 번째 삶 지도 — g: 0 준비, 1 활용처 */
export const steps: MapStep[] = [
  {
    id: "s1",
    g: 0,
    title: "등급 판정",
    short: "등급 판정",
    detail:
      "남은 용량과 상태를 재서 어느 용도로 보낼지 정합니다. 은퇴한 배터리는 측정 데이터가 드물고 사용 이력이 불완전하며 화학 조성이 제각각이라, 빠르고 정확한 판정이 가장 어려운 단계입니다.",
    in: "전기차에서 떼어 낸 팩",
    out: "재사용 · 재활용 등급 판정",
  },
  {
    id: "s2",
    g: 0,
    title: "재포장",
    short: "재포장",
    detail:
      "팩을 통째로 쓰거나, 모듈로 나눠 새 함체에 다시 묶습니다. 노르웨이의 두 사례는 각각 팩째로(약 280 kWh 시스템), 모듈 단위로(약 500 kWh 시스템) 태양광 저장장치를 만들었습니다.",
    in: "재사용 등급 팩 · 모듈",
    out: "두 번째 삶 배터리 유닛",
  },
  {
    id: "d1",
    g: 1,
    title: "에너지저장장치 (ESS)",
    short: "ESS",
    detail:
      "가장 대표적인 쓰임입니다. 전력망용, 가정용, 전기차 충전소용이 있고, 어느 쪽이 이득인지는 전기요금 · 배터리 가격 · 사용 방식에 따라 달라집니다. 노르웨이 사례에서는 태양광 발전과 묶어 전력망 의존을 줄이는 데 썼습니다.",
    in: "두 번째 삶 배터리 유닛",
    out: "전력망 · 가정 · 충전소의 전기 저장",
  },
  {
    id: "d2",
    g: 1,
    title: "무정전 전원장치 (UPS)",
    short: "UPS",
    detail: "정전이 나면 전기를 대 주는 장치입니다. 한곳에 고정되어 급가속이나 급충전을 견딜 필요가 없어, 자동차에는 부족해진 배터리도 쓸 수 있습니다.",
    in: "두 번째 삶 배터리 유닛",
    out: "정전 대비 비상 전력",
  },
  {
    id: "d3",
    g: 1,
    title: "태양광 가로등",
    short: "가로등",
    detail: "낮에 패널로 충전해 밤에 불을 켜는 가로등의 배터리로 씁니다. 전력망에 연결하지 않아도 되는 작은 저장 용도입니다.",
    in: "작게 나눈 모듈",
    out: "밤길 조명",
  },
  {
    id: "d4",
    g: 1,
    title: "소형 모빌리티",
    short: "소형 모빌리티",
    detail: "골프카, 전기이륜차, 전동휠체어처럼 자동차보다 작고 느린 이동수단에도 쓰입니다.",
    in: "작게 나눈 모듈",
    out: "골프카 · 전기이륜차 · 전동휠체어의 전원",
  },
];
export const stepSrc: Src[] = [23, 42, 25, "R"];

/* 환경 이득의 문턱 — 새 배터리 제조 대비 재사용 배터리의 영향 (%) */
export const lca: { key: string; name: string; v: number; note: string }[] = [
  { key: "gwp", name: "기후 변화", v: 16, note: "새 배터리 생산을 16% 넘게 대신해야 온실가스 면에서 이득입니다." },
  { key: "water", name: "물 사용", v: 3, note: "3%만 대신해도 물 사용 면에서는 이득입니다." },
  { key: "mineral", name: "광물 자원", v: 0, note: "대신하는 양이 없어도 광물 자원 면에서는 이득이 드러났습니다." },
];

/* 시간 순서: 첫 번째 삶 → 두 번째 삶 → 재활용 */
export const lives: { key: string; name: string; where: string; soh: string; text: string }[] = [
  { key: "ev", name: "첫 번째 삶", where: "전기차", soh: "100% → 약 80%", text: "급가속과 급충전을 견디며 달립니다. 잔존용량이 기준 아래로 내려오면 차에서 내립니다." },
  { key: "ess", name: "두 번째 삶", where: "ESS · UPS · 소형 모빌리티", soh: "약 80% → 60%", text: "성능 요구가 낮은 곳에서 남은 용량을 마저 씁니다. 제조에 이미 들어간 에너지를 더 오래 쓰는 셈입니다." },
  { key: "rc", name: "끝", where: "재활용", soh: "60% 미만", text: "결국 원소로 되돌립니다. 재사용과 재활용은 경쟁이 아니라 시간 순서입니다." },
];

export const toc = [
  { id: "rc-summary", label: "요약" },
  { id: "rs-branch", label: "세 갈래 중 가운데" },
  { id: "rs-why", label: "왜 가능한가" },
  { id: "rs-map", label: "두 번째 삶 지도" },
  { id: "rs-lca", label: "환경 이득의 문턱" },
  { id: "rs-time", label: "시간 순서" },
  { id: "rs-econ", label: "경제성 조건" },
  { id: "rc-refs", label: "근거 문헌" },
];
