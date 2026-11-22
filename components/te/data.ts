/**
 * 12 기술경제성 분석 페이지 데이터. 모든 수치는 출처(src)와 근거 수준(level)을 함께 가진다.
 * 92~95번 문헌은 2026년 11월 이 페이지를 개편하며 추가했다(DOI로 실존 · 서지 확인). 95번은 국내 연구.
 * 나라별 비용은 Lander 외(2021) 본문 값: 영국에서 모은 전기차 배터리 8,000 t(셀 기준)을 각 나라 공장으로 보내 재활용하는 계산.
 */
import type { MapStep } from "../rc/SystemMap";
import type { Level, Src } from "../rc/sources";

export const facts: { value: string; unit?: string; label: string; detail: string; level: Level; src: Src[] }[] = [
  {
    value: "−21 ~ +22",
    unit: "$/kWh",
    label: "같은 전기차 배터리 재활용의 손익 범위",
    detail:
      "영국 임페리얼 칼리지 · 패러데이 연구소 연구진이 여러 전기차 팩을 다섯 나라에서 세 가지 방법으로 재활용하는 경우를 계산하니, 배터리 1 kWh당 21.43달러 손해에서 21.91달러 이익까지 벌어졌습니다. 운송 거리, 인건비, 팩 설계, 재활용 방법이 손익을 갈랐습니다.",
    level: "paper",
    src: [92],
  },
  {
    value: "16",
    unit: "배",
    label: "해체 작업 시급의 나라별 차이",
    detail:
      "같은 연구가 쓴 시급은 중국 3달러, 벨기에 48.1달러였습니다. 팩을 여는 해체 비용도 1 kWh당 중국 0.25달러, 벨기에 4.04달러로 그대로 벌어졌습니다.",
    level: "paper",
    src: [92],
  },
  {
    value: "1.06",
    unit: "B/C",
    label: "국내 중대형 전지 재활용 사업의 편익 ÷ 비용",
    detail:
      "산업연구원 연구는 국내 전기차 · 에너지저장장치 배터리 재활용 사업의 편익이 비용보다 6% 크다고 계산했습니다(2018). 그런데도 산업이 크지 않은 이유로 의무 재활용 제도가 없어 국내 수요가 낮다는 점을 꼽았습니다.",
    level: "paper",
    src: [95],
  },
];

/* 기술경제성 분석이 보는 것 */
export const terms: { k: string; t: string; d: string }[] = [
  { k: "비용 1", t: "자본비 (CAPEX)", d: "공장을 짓고 설비를 들이는 데 한 번에 드는 돈입니다." },
  { k: "비용 2", t: "운영비 (OPEX)", d: "원료(다 쓴 배터리) 구입 · 운송 · 인건비 · 약품 · 전기처럼 해마다 드는 돈입니다." },
  { k: "수익", t: "판매 수입", d: "되찾은 금속 화합물이나 블랙매스를 팔아 버는 돈입니다. 금속 가격에 따라 크게 흔들립니다." },
  { k: "판단", t: "지표", d: "순이익, 편익 ÷ 비용(B/C), 내부수익률(IRR), 투자금 회수 기간, 손익분기 처리량으로 해볼 만한지 가늠합니다." },
];
export const termSrc: Src[] = [92, 94, 95];

/* 돈이 오가는 공장 — g: 0 비용이 붙는 단계, 1 수익과 판단 */
export const steps: MapStep[] = [
  {
    id: "t1",
    g: 0,
    title: "운송 — 멀수록 비싸다",
    short: "운송",
    detail:
      "다 쓴 팩은 무겁고 위험물로 다뤄야 해 옮기는 데 돈이 듭니다. 영국에서 모은 배터리를 한국 · 중국 공장으로 보내는 견적은 1 kWh당 1.24달러, 영국 안이면 0.39달러였습니다. 견적 대신 오래된 미국 평균 운임을 쓰면 한국행 운송비가 전체 비용의 65~70%까지 치솟았습니다.",
    in: "다 쓴 배터리 팩",
    out: "공장 도착",
  },
  {
    id: "t2",
    g: 0,
    title: "해체 — 시간이 곧 돈",
    short: "해체",
    detail:
      "팩을 열고 모듈을 떼는 일은 아직 대부분 사람 손으로 합니다. 해체비는 1 kWh당 중국 0.25, 한국 0.84, 미국 1.68, 영국 2.84, 벨기에 4.04달러로 시급 차이가 그대로 드러났습니다. 쉽게 뜯기는 팩 설계가 비용을 줄이는 방법으로 꼽혔습니다(07 자동 해체).",
    in: "팩",
    out: "모듈 · 셀",
  },
  {
    id: "t3",
    g: 0,
    title: "파쇄 · 블랙매스 — 기계 공정은 싸다",
    short: "블랙매스",
    detail:
      "태국 · 영국 연구진이 파쇄 · 공기 분급 · 체질만 쓰는 파일럿 공정을 실제로 돌려 보니, 블랙매스를 만드는 가공비는 1 kg당 0.31~0.73달러였습니다. 전기차 모듈에서는 93.28%, 휴대폰 셀에서는 75.77%를 블랙매스로 걸러 냈습니다.",
    in: "모듈 · 셀",
    out: "블랙매스",
  },
  {
    id: "t4",
    g: 0,
    title: "정제 — 비용의 대부분",
    short: "정제",
    detail:
      "블랙매스를 녹이고 걸러 배터리용 화합물로 되돌리는 단계입니다(03 재활용). Lander 외 계산에서 재활용 공정 자체가 전체 비용의 75~90%를 차지했습니다(견적 운임 기준). 약품과 전기, 설비비가 여기서 듭니다.",
    in: "블랙매스",
    out: "금속 화합물",
  },
  {
    id: "t5",
    g: 1,
    title: "판매 — 코발트가 값을 정한다",
    short: "판매",
    detail:
      "되찾은 금속을 팔아 수익을 냅니다. 연구가 쓴 가격은 1 kg당 코발트 51.3, 니켈 11.3, 망간 3.1달러로, 코발트가 많은 배터리일수록 수익이 컸습니다. 값비싼 금속이 적은 LFP 배터리는 기존 건식 · 습식 공정으로는 적자가 나기 쉽습니다.",
    in: "금속 화합물",
    out: "판매 수입",
  },
  {
    id: "bal",
    g: 1,
    title: "저울 — 남는 장사인가",
    short: "손익",
    detail:
      "모든 비용과 수익을 견줍니다. 국내 중대형 전지 재활용 사업을 분석한 연구는 편익 ÷ 비용을 1.06으로 계산했습니다. 1보다 크면 남는 장사지만, 1에 가까울수록 운송 거리 · 인건비 · 금속 가격 같은 조건이 조금만 바뀌어도 저울이 반대로 기울 수 있습니다.",
    in: "비용 · 수익",
    out: "손익 판단",
  },
];
export const stepSrc: Src[] = [92, 93, 95, 13];

/* 어디서 재활용하나 — 영국에서 모은 배터리를 각 나라 공장으로 보낼 때 (Lander 외 2021, 본문 값) */
export const dests: {
  id: string;
  t: string;
  ship: number;        // 운송비 견적 $/kWh
  shipEB: number;      // 미국 평균 운임(EverBatt, 2015)을 쓸 때 $/kWh
  shipShare: string;   // 견적 기준 운송비 비중
  shipShareEB: string; // EverBatt 운임 기준 비중
  dis: number;         // 해체비 $/kWh
  disShare: string;
  wage: number;        // 시급 $/h
}[] = [
  { id: "cn", t: "중국", ship: 1.24, shipEB: 28.02, shipShare: "7~13%", shipShareEB: "70%를 넘습니다", dis: 0.25, disShare: "2%", wage: 3 },
  { id: "kr", t: "한국", ship: 1.24, shipEB: 26.62, shipShare: "7~13%", shipShareEB: "65~70%입니다", dis: 0.84, disShare: "5~7%", wage: 10 },
  { id: "us", t: "미국", ship: 1.55, shipEB: 18.08, shipShare: "7~13%", shipShareEB: "50%입니다", dis: 1.68, disShare: "8~11%", wage: 20 },
  { id: "be", t: "벨기에", ship: 0.39, shipEB: 6.22, shipShare: "약 2%", shipShareEB: "20~25%입니다", dis: 4.04, disShare: "15~21%", wage: 48.1 },
  { id: "uk", t: "영국", ship: 0.39, shipEB: 0.83, shipShare: "약 2%", shipShareEB: "5%입니다", dis: 2.84, disShare: "12~17%", wage: 33.85 },
];

/* 손익분기 처리량 — 이만큼은 처리해야 남는다 (Lander 외 2021, 영국 · NCA 팩 기준) */
export const breakeven: { k: string; v: number; tone: "pyro" | "hydro" | "direct" }[] = [
  { k: "건식", v: 17000, tone: "pyro" },
  { k: "습식", v: 7000, tone: "hydro" },
  { k: "직접재생", v: 3000, tone: "direct" },
];
export const PLANT_T = 8000;

/* 같은 질문, 다른 답 — 기술경제성 분석 네 편 */
export const studies: { id: number; who: string; scope: string; basis: string; result: string; note: string }[] = [
  {
    id: 92,
    who: "Lander 외 2021 · 영국",
    scope: "운송 → 해체 → 재활용, 5개국 · 팩 여러 종 · 3가지 방법",
    basis: "공개 비용 모델(EverBatt) + 실제 운임 견적",
    result: "1 kWh당 −21.43 ~ +21.91달러",
    note: "어디서 · 어떤 팩을 · 어떤 방법으로 하느냐에 따라 손해에서 이익까지",
  },
  {
    id: 93,
    who: "Yingnakorn 외 2026 · 태국 · 영국",
    scope: "블랙매스를 만들기까지 (기계 공정만)",
    basis: "파일럿 공정 실측 자료",
    result: "가공비 1 kg당 0.31~0.73달러, 순이익 4.39~5.53달러 (현실적인 원료 구입가 포함)",
    note: "여러 시장 조건을 뽑아 본 모의실험에서 적자 확률 0.2% 미만. 금속을 뽑는 뒷단은 빠져 있음",
  },
  {
    id: 94,
    who: "Imre-Lucaci 외 2025 · 루마니아",
    scope: "대형 재활용 공장 전체 (시간당 1,314 kg)",
    basis: "공정 시뮬레이션",
    result: "내부수익률 42.7~50.2%, 회수 기간 1.35~1.63년",
    note: "공장 안 열을 되쓰는 설계가 가장 유리. 시뮬레이션 값이라 실제 공장 자료가 아님",
  },
  {
    id: 95,
    who: "모정윤 2018 · 산업연구원",
    scope: "국내 중대형 전지 재활용 사업",
    basis: "국내 배출량 추정 + 편익 · 비용 분석",
    result: "편익 ÷ 비용 = 1.06",
    note: "경제성은 있으나 의무 재활용 제도가 없어 수요가 낮다고 진단",
  },
];

export const toc = [
  { id: "te-what", label: "무엇을 따지나" },
  { id: "te-map", label: "돈이 오가는 공장" },
  { id: "te-where", label: "어디서 하느냐" },
  { id: "te-scale", label: "규모와 배터리 종류" },
  { id: "te-studies", label: "같은 질문, 다른 답" },
  { id: "te-next", label: "남은 과제" },
];
