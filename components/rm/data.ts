/**
 * 01 재제조 페이지 데이터. 모든 수치는 출처(src)와 근거 수준(level)을 함께 가진다.
 * 36~41번 문헌은 2026년 9월 이 페이지를 보강하며 추가했다(DOI로 실존 · 서지 확인).
 */
import type { MapStep } from "../rc/SystemMap";
import type { Level, Src } from "../rc/sources";

export const facts: { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[] }[] = [
  {
    value: "80",
    unit: "% 이상",
    label: "재제조로 가는 잔존용량 기준",
    detail: "잔존용량(SOH)이 이 이상 남은 배터리가 재제조 대상입니다. 일반적 기준이며 사업자와 용도에 따라 다릅니다.",
    level: "judgement",
    src: ["R"],
  },
  {
    value: "89",
    unit: "%",
    label: "뜯어 낸 셀 가운데 다시 쓸 수 있던 비율",
    detail: "회수한 원통형 셀 196개를 시험한 결과입니다. 9%는 용량 부족, 2%는 그 밖의 고장이었습니다. 팩이 멈춰도 대부분의 셀은 아직 쓸 만하다는 뜻입니다.",
    level: "paper",
    src: [36],
  },
  {
    value: "22",
    unit: "단계",
    label: "한 PHEV 팩을 해체하는 데 든 단계",
    detail: "같은 연구에서 다른 차종의 팩은 모듈에 닿기까지 10단계였습니다. 팩 설계에 따라 재제조의 품이 크게 달라집니다.",
    level: "paper",
    src: [37],
  },
];

/* 공정 지도 — 4단계 (g: 0 분해 · 판정, 1 복원 · 검증) */
export const steps: MapStep[] = [
  {
    id: "r1",
    g: 0,
    title: "팩 개봉 · 진단",
    short: "개봉 · 진단",
    detail:
      "뚜껑을 열고 모듈 · 셀마다 전압과 임피던스를 잽니다. 핵심은 직렬로 묶인 셀 가운데 혼자 다르게 늙은 것을 찾는 일입니다. 셀 12개로 만든 가상 팩 실험에서는 임피던스의 저주파 최솟값이 여러 셀 사이의 이상 셀 하나를 가장 민감하게 잡아냈습니다.",
    in: "전기차에서 떼어 낸 팩",
    out: "셀 · 모듈별 상태표 (교체 대상 표시)",
  },
  {
    id: "r2",
    g: 0,
    title: "선별 교체",
    short: "선별 교체",
    detail:
      "지친 모듈만 꺼내고, 상태가 비슷하게 맞춰 둔 교체품을 넣습니다. 지금 산업 현장의 해체는 모듈 단위까지이고, 셀 하나만 바꾸는 교체는 아직 이뤄지지 않습니다.",
    in: "교체 대상이 표시된 팩 + 등급을 맞춘 교체 모듈",
    out: "교체한 팩, 빼낸 모듈(재사용 · 재활용으로)",
  },
  {
    id: "r3",
    g: 1,
    title: "셀밸런싱",
    short: "셀밸런싱",
    detail:
      "새로 넣은 모듈과 남아 있던 모듈의 충전 상태를 서로 맞춥니다. 직렬로 묶인 팩은 충전할 때 가장 먼저 차는 셀에서, 방전할 때 가장 먼저 비는 셀에서 멈추기 때문에, 맞추지 않으면 쓸 수 있는 용량이 줄어듭니다.",
    in: "교체한 팩",
    out: "충전 상태가 고르게 맞춰진 팩",
  },
  {
    id: "r4",
    g: 1,
    title: "재조립 · 검사",
    short: "재조립 · 검사",
    detail:
      "다시 닫아 조립하고 차량 탑재 기준에 맞는지 검사합니다. 2025년 2월부터는 배터리마다 식별번호가 자동차등록원부에 올라가고, 배터리를 바꾸면 그 번호를 변경 등록합니다.",
    in: "밸런싱을 마친 팩",
    out: "차량 탑재 판정을 받은 팩 → 다시 전기차로",
  },
];
export const stepSrc: Src[] = [38, 37, 36, "P2", "R"];

export { tiers } from "../rc/tiers";

/* 해체 깊이 — 팩 · 모듈 · 셀 */
export const depths: { key: string; name: string; what: string; now: string; hard: string; src: Src[] }[] = [
  {
    key: "pack",
    name: "팩 단위",
    what: "팩을 통째로 바꿉니다. 멀쩡한 모듈과 셀까지 함께 빠집니다.",
    now: "가장 쉽지만 남은 가치를 가장 많이 버립니다.",
    hard: "—",
    src: [36],
  },
  {
    key: "module",
    name: "모듈 단위",
    what: "지친 모듈만 꺼내고 교체품을 넣습니다.",
    now: "지금 산업 현장의 해체 한계가 여기까지입니다.",
    hard: "모듈 안의 멀쩡한 셀도 함께 버려지고, 교체하지 않은 모듈에 남은 약한 셀이 팩 수명을 계속 깎습니다.",
    src: [37, 36],
  },
  {
    key: "cell",
    name: "셀 단위",
    what: "가장 작은 불량 단위인 셀 하나만 바꿉니다.",
    now: "연구 목표 단계입니다. 남은 가치를 가장 많이 살립니다.",
    hard: "용접된 알루미늄 버스바, 하우징에 붙인 절연 필름, 셀 사이의 강력 접착제가 비파괴 해체를 막습니다. 레이저 절단 · 용접으로 떼고 다시 붙이는 모듈 설계, 모듈을 온전히 둔 채 셀 하나를 바꾸는 자동 재제조 스테이션이 제안됐습니다.",
    src: [36, 40],
  },
];

/* 셀 교체 경제성 — 모델 시뮬레이션 결과 (팩 통째 교체 대비) */
export const econ: { case: string; cost: number; cycles: number }[] = [
  { case: "잔존용량 80%에서 교체", cost: -6, cycles: 1 },
  { case: "잔존용량 70%에서 교체", cost: 2, cycles: 3 },
];

/* 셀밸런싱 설명용 예시 (실측값 아님) — 직렬 셀 8개의 충전 상태(%) */
export const socBefore = [71, 74, 72, 58, 57, 73, 70, 75];

export const toc = [
  { id: "rc-summary", label: "요약" },
  { id: "rm-branch", label: "세 갈래 중 맨 위" },
  { id: "rm-map", label: "되살리는 과정" },
  { id: "rm-balance", label: "셀밸런싱" },
  { id: "rm-depth", label: "어디까지 뜯나" },
  { id: "rm-econ", label: "경제성" },
  { id: "rm-check", label: "점검과 이력" },
  { id: "rc-refs", label: "근거 문헌" },
];
