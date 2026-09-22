/**
 * 03 재활용 페이지(개편 시범) 전용 데이터.
 * 모든 수치는 출처(src)와 근거 수준(level)을 함께 가진다.
 *  - 숫자 출처: data/references.ts 의 문헌 번호
 *  - "P1" 등 문자 출처: 문헌 목록 밖의 정책 · 기업 자료 (아래 extraSources)
 * 출처를 확인할 수 없던 기존 수치("세계 상위 5개 업체 중 4곳")는 이 페이지에서 뺐다.
 */

import type { Level, Src } from "./sources";
export { levelLabel, extraSources, type Level, type Src } from "./sources";

export const facts: { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[] }[] = [
  {
    value: "95",
    unit: "% 이상",
    label: "습식제련 금속 회수율",
    detail: "기업 발표 수치입니다. 같은 황산 + 과산화수소 침출을 다룬 실험에서 망간이 94%였고 나머지 금속은 그보다 높아, 발표와 대체로 부합합니다.",
    level: "company",
    src: ["C1", 5],
  },
  {
    value: "50",
    unit: "%",
    label: "EU 폐배터리 리튬 추출률 목표 (2027년)",
    detail: "리튬을 회수하지 못하는 공정은 이 목표를 맞출 수 없습니다. 2031년부터는 신품에 리튬 재생원료 6%가 의무입니다.",
    level: "policy",
    src: ["P1"],
  },
  {
    value: "9",
    unit: "종 중 4종",
    label: "재활용 공정 분류 · 상용 또는 준상용",
    detail: "문헌에 나온 공정을 원리 기준으로 묶은 이 사이트의 분류입니다. 세부 변형까지 세면 14가지입니다.",
    level: "judgement",
    src: ["R", 1, 7],
  },
];

export const hubSteps: { id: string; side: "spoke" | "hub"; g?: number; title: string; short: string; detail: string; in: string; out: string }[] = [
  { id: "s1", side: "spoke", title: "안전 방전 · 모듈 해체", short: "방전 · 해체", detail: "남은 전력에 의한 화재와 열폭주를 막으려고 완전히 방전한 뒤 팩을 모듈 · 셀로 나눕니다. 알루미늄 · 구리 스크랩이 여기서 먼저 빠집니다.", in: "사용후 배터리 팩", out: "모듈 · 셀, Al · Cu 스크랩" },
  { id: "s2", side: "spoke", title: "열처리 (탈바인더)", short: "열처리", detail: "전해액을 안전하게 휘발시키고 전극을 붙들던 바인더를 분해해, 다음 파쇄가 잘 되게 합니다.", in: "모듈 · 셀", out: "전해액 · 바인더가 빠진 전극" },
  { id: "s3", side: "spoke", title: "다단 파쇄 · 물리적 선별", short: "파쇄 · 선별", detail: "잘게 부순 뒤 자력 · 비중 선별로 철 · 구리 · 알루미늄 포일을 걸러 냅니다. 남는 검은 분말이 블랙매스입니다.", in: "열처리한 전극", out: "블랙매스" },
  { id: "h1", side: "hub", title: "침출", short: "침출", detail: "황산에 블랙매스를 녹입니다. 과산화수소는 환원제입니다. 양극재의 코발트는 Co³⁺로 단단히 붙어 있어 산만으로는 잘 녹지 않는데, 과산화수소가 Co²⁺로 바꾸면서 용해가 빨라집니다.", in: "블랙매스 + 황산 · 과산화수소", out: "금속이 녹은 침출액" },
  { id: "h2", side: "hub", title: "불순물 정제", short: "정제", detail: "pH를 조절해 철 · 알루미늄 · 칼슘을 침전시켜 걸러 냅니다.", in: "침출액", out: "정제액 (Fe · Al · Ca 침전물 분리)" },
  { id: "h3", side: "hub", title: "용매추출", short: "용매추출", detail: "섞이지 않는 물층과 기름층 사이의 친화력 차이로 망간 → 코발트 → 니켈을 차례로 떼어 냅니다. 공정 전체의 순도가 여기서 정해집니다.", in: "정제액", out: "Mn · Co · Ni 금속별 용액" },
  { id: "h4", side: "hub", title: "결정화", short: "결정화", detail: "금속별 용액을 농축 · 증발시켜 황산염 결정으로 석출합니다.", in: "금속별 용액", out: "금속 황산염 · 리튬염" },
];

export const products = [
  { n: "황산니켈", f: "NiSO₄", fill: "#2BB594", stroke: "#0B5C49", use: "고용량 NCM · NCA 전구체" },
  { n: "황산코발트", f: "CoSO₄", fill: "#C23D69", stroke: "#7A1F3F", use: "수명 · 구조 안정성" },
  { n: "황산망간", f: "MnSO₄", fill: "#F2BFCB", stroke: "#B77384", use: "열적 안정성" },
  { n: "탄산 · 수산화리튬", f: "Li₂CO₃ / LiOH", fill: "#FAFAFA", stroke: "#8A9199", use: "양극재 합성용 리튬 소스" },
];

export const temps: { key: string; label: string; t: string; v: number; why: string; src: Src[] }[] = [
  { key: "bio", label: "바이오리칭", t: "30~45℃", v: 45, why: "미생물이 살아야 하는 온도입니다. 그 대가로 수일에서 수십 일이 걸립니다.", src: ["R", 11] },
  { key: "hydro", label: "습식제련 (침출)", t: "80℃ 안팎", v: 80, why: "황산 + 과산화수소, 80℃에서 30분이라는 비교적 온건한 조건으로 최적화한 실험이 있습니다.", src: [5] },
  { key: "molten", label: "용융염 전기환원 (저온형)", t: "150℃", v: 150, why: "염화알루미늄산염 용융염으로 녹는점을 낮춰 전해합니다. 원형인 알루미늄 제련은 약 950℃입니다.", src: ["R", 27] },
  { key: "direct", label: "직접재생 (소성)", t: "700~900℃", v: 800, why: "리튬을 다시 채운 뒤 결정 구조를 정돈하는 열처리입니다.", src: ["R", 8] },
  { key: "pyro", label: "건식제련", t: "1,400℃ 이상", v: 1400, why: "배터리를 통째로 녹여 밀도 차이로 가릅니다. 유기물은 타고, 가벼운 리튬은 슬래그로 빠집니다.", src: ["R", 2] },
];

export type Stage = "상용" | "준상용" | "연구";
export const processes: { stage: Stage; name: string; en: string; how: string; v: number; src: Src[] }[] = [
  { stage: "상용", name: "건식제련", en: "Pyrometallurgy", how: "고온 용융 후 밀도로 분리. 리튬은 슬래그로 손실", v: 1, src: [2, 4] },
  { stage: "상용", name: "습식제련", en: "Hydrometallurgy", how: "산 침출 · 용매추출 · 결정화. 현재 표준 공정", v: 2, src: [1, 5, 14] },
  { stage: "준상용", name: "직접재생", en: "Direct Recycling", how: "결정 구조를 허물지 않고 빠진 리튬만 다시 채움", v: 3, src: [8, 9, 19] },
  { stage: "준상용", name: "바이오리칭", en: "Bioleaching", how: "미생물이 만든 황산으로 금속을 녹임", v: 2, src: [11] },
  { stage: "연구", name: "용융염 전기환원", en: "Molten Salt", how: "알루미늄 제련 원리. 전자를 환원제로 씀", v: 1, src: [27] },
  { stage: "연구", name: "기계화학", en: "Mechanochemistry", how: "볼밀 충격으로 용매 없이 고체 상태 반응", v: 1, src: [28] },
  { stage: "연구", name: "초임계 CO₂", en: "Supercritical CO₂", how: "전해액 회수, 금속 추출 보조", v: 1, src: [30, 31] },
  { stage: "연구", name: "분자 인식 포획", en: "Molecular Recognition", how: "MOF 기공으로 특정 금속 이온만 골라 잡음", v: 1, src: [32, 33] },
  { stage: "연구", name: "폐기물 업사이클링", en: "Waste Upcycling", how: "원소 회수 없이 곧바로 새 소재로 전환", v: 2, src: [34] },
];

export const feas: { n: string; g: 1 | 2 | 3 | 4; gl: string; role: string; why: string; src: Src[] }[] = [
  { n: "기계화학", g: 4, gl: "상", role: "습식제련의 침출 단계 대체", why: "리튬 선택 회수에서 우위가 분명합니다.", src: [28] },
  { n: "초임계 CO₂ (전해액)", g: 4, gl: "상", role: "전처리 단계 신설", why: "200 L 규모 파일럿 실증까지 나왔습니다.", src: [31] },
  { n: "용융염 전기환원", g: 3, gl: "중상", role: "폐수 규제가 강한 지역의 대안", why: "에너지 약 20% 절감으로 우위가 제한적입니다.", src: [27] },
  { n: "초임계 CO₂ (금속)", g: 2, gl: "중", role: "보류", why: "회수율 60%대이고 산이 여전히 필요합니다.", src: [29, 30] },
  { n: "분자 인식 포획", g: 1, gl: "하", role: "최종 정제 보조", why: "선택성만 앞서고, 강산성 용액에서 버티는 소재가 아직 없습니다.", src: [32, 33] },
  { n: "폐기물 업사이클링", g: 1, gl: "하", role: "LFP 등 저가치 영역", why: "반응은 작동하지만 결과물을 쓸 시장이 없습니다.", src: [34] },
];

export const toc = [
  { id: "rc-summary", label: "요약" },
  { id: "rc-hub", label: "기준 공정" },
  { id: "rc-lithium", label: "건식 vs 습식" },
  { id: "rc-nine", label: "공정 9종" },
  { id: "rc-feas", label: "이론적 대안" },
  { id: "rc-refs", label: "근거 문헌" },
];
