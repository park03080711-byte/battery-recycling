/**
 * 04 업사이클링 페이지 데이터. 모든 수치는 출처(src)와 근거 수준(level)을 함께 가진다.
 * 45~49번 문헌은 2026년 9월 이 페이지를 보강하며 추가했다(DOI로 실존 · 서지 확인). 45 · 46번은 국내 연구.
 */
import type { MapStep } from "../rc/SystemMap";
import type { Level, Src } from "../rc/sources";

export const facts: { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[] }[] = [
  {
    value: "≈1,170",
    unit: "mAh/g",
    label: "폐배터리 + 폐PET로 만든 전극의 용량",
    detail: "LiCoO₂와 폐PET를 함께 반응시켜 만든 금속-유기 골격체 전극(CoTPA)의 가역 용량입니다. 500사이클 뒤에도 처음 용량의 92.1%를 유지했습니다.",
    level: "paper",
    src: [34],
  },
  {
    value: "1,000",
    unit: "사이클",
    label: "폐양극재 촉매를 쓴 흐름전지의 수명 (촉매 없으면 281)",
    detail: "부경대 연구진은 폐 LiFePO₄ 양극재를 바나듐 흐름전지 전극의 촉매로 썼습니다. 고속 충방전 조건에서 촉매가 없는 전지는 281사이클 뒤 용량이 급감했고, 촉매를 쓴 전지는 1,000사이클을 버텼습니다.",
    level: "paper",
    src: [45],
  },
  {
    value: "129.6",
    unit: "$/kg",
    label: "폐 LiCoO₂를 촉매로 쓸 때 추정 수익 (재활용은 13~17)",
    detail: "폐 LiCoO₂를 햇빛으로 폐PET를 분해하는 촉매로 쓰는 경우를 논문이 전과정평가로 추정한 값입니다. 같은 논문이 든 기존 배터리 재활용 수익은 kg당 13~17달러였습니다. 실험실 규모의 추정입니다.",
    level: "paper",
    src: [47],
  },
];

/* 업사이클링 지도 — g: 0 준비, 1 전환 */
export const steps: MapStep[] = [
  {
    id: "s1",
    g: 0,
    title: "해체 · 선별",
    short: "해체 · 선별",
    detail:
      "셀을 열어 양극 분말, 음극 흑연, 철 케이스로 나눕니다. 업사이클링은 여기서 금속을 원소로 녹여 내지 않고, 나눈 재료를 그대로 다음 반응에 넣는다는 점이 재활용과 다릅니다.",
    in: "폐배터리 · 폐PET · 철 캔",
    out: "양극 분말 · 흑연 · 철 케이스",
  },
  {
    id: "d1",
    g: 1,
    title: "에너지 장치용 촉매",
    short: "촉매",
    detail:
      "양극에 든 니켈 · 코발트 · 망간은 그 자체로 촉매 활성점이 됩니다. 순간 고온 가열로 폐 NCM을 아연-공기 전지 촉매로 바꾸거나, 폐 LiCoO₂ · LiMn₂O₄를 리튬-황 전지 촉매로 바꾼 연구가 있고, 국내에서는 폐 LiFePO₄를 바나듐 흐름전지 촉매로 썼습니다.",
    in: "폐양극재 분말",
    out: "아연-공기 · 리튬-황 · 흐름전지용 촉매",
  },
  {
    id: "d2",
    g: 1,
    title: "흐름전지에 직접",
    short: "흐름전지",
    detail:
      "부산대 · 부경대 · 한국지질자원연구원(KIGAM) 연구진은 폐 LiMn₂O₄를 정제하지 않고 수계 아연-망간 흐름전지의 전해액으로 넣었습니다. 250사이클 동안 쿨롱 효율 90%, 에너지 효율 70% 이상을 보였고, 쓰고 난 전해액은 pH만 조절해 망간을 가라앉혀 리튬을 100% 분리했습니다.",
    in: "폐 LiMn₂O₄ 파우치 셀",
    out: "흐름전지 전해액 · 분리된 리튬",
  },
  {
    id: "d3",
    g: 1,
    title: "PET와 함께 전극으로",
    short: "PET + 전극",
    detail:
      "폐PET가 분해되며 나오는 테레프탈산과 에틸렌글리콜이 리간드 · 양성자 공급원 · 환원제 역할을 동시에 해, 외부 침출제 없이 LiCoO₂를 녹이고 금속-유기 골격체 전극(CoTPA)으로 다시 짓습니다. 두 폐기물이 서로의 시약이 되는 구조입니다.",
    in: "폐 LiCoO₂ · 폐PET",
    out: "CoTPA 전극 (듀얼이온 배터리용)",
  },
  {
    id: "d4",
    g: 1,
    title: "흑연 + 철 케이스 → 음극",
    short: "음극",
    detail:
      "인하대 · 전남대 연구진은 폐흑연과 원통형 셀의 철 케이스를 함께 되살려, 산화철 나노입자를 박은 환원 그래핀 산화물 음극을 만들었습니다. 900사이클 동안 534 mAh/g을 유지했고, 비슷한 합성 소재보다 싸게 만들 수 있었습니다.",
    in: "폐흑연 · 철 케이스",
    out: "산화철-그래핀 음극",
  },
  {
    id: "d5",
    g: 1,
    title: "광열 촉매로 PET 분해",
    short: "광열 촉매",
    detail:
      "폐 LiCoO₂를 햇빛을 열로 바꾸는 촉매로 써서 여러 폐폴리에스터를 원래 단량체로 되돌렸습니다. 리튬이 빠진 폐 LiCoO₂가 새 LiCoO₂보다 단량체 수율이 10배 넘게 높았습니다. 이번에는 배터리가 플라스틱 재활용을 돕는 쪽입니다.",
    in: "폐 LiCoO₂ · 폐폴리에스터",
    out: "플라스틱 단량체",
  },
];
export const stepSrc: Src[] = [20, 34, 45, 46, 47, 48, 49];

/* 누가 값을 더 쳐주나 — 폐 LiCoO₂ 1 kg당 수익 ($), 논문의 전과정평가 추정 [47] */
export const value = [
  { key: "rc", name: "기존 재활용", lo: 13, hi: 17, note: "금속을 녹여 회수해 원료로 팝니다." },
  { key: "up", name: "광열 촉매로 업사이클링", lo: 129.6, hi: 129.6, note: "폐 LiCoO₂를 그대로 촉매로 써서 폐PET를 단량체로 되돌립니다." },
];

/* 국내 연구 세 갈래 */
export const korea: { id: number; who: string; what: string; result: string; tag: string }[] = [
  {
    id: 20,
    who: "부산대 · 부경대 · KIGAM",
    what: "폐 LiMn₂O₄ → 아연-망간 흐름전지 전해액",
    result: "250사이클 · 에너지 효율 70% 이상 · 리튬 100% 분리",
    tag: "흐름전지",
  },
  {
    id: 45,
    who: "부경대 · 포항가속기연구소",
    what: "폐 LiFePO₄ → 바나듐 흐름전지 전극 촉매",
    result: "281 → 1,000사이클 (고속 충방전)",
    tag: "촉매",
  },
  {
    id: 46,
    who: "인하대 · 전남대",
    what: "폐흑연 + 철 케이스 → 산화철-그래핀 음극",
    result: "900사이클 동안 534 mAh/g",
    tag: "음극",
  },
];

export const toc = [
  { id: "rc-summary", label: "요약" },
  { id: "up-branch", label: "고리를 끊는 경로" },
  { id: "up-map", label: "업사이클링 지도" },
  { id: "up-kr", label: "국내 연구" },
  { id: "up-value", label: "누가 값을 더 쳐주나" },
  { id: "up-gap", label: "병목은 시장" },
  { id: "rc-refs", label: "근거 문헌" },
];
