/**
 * 사이트 소개 페이지 데이터 — 개편 현황 · 읽는 법 · 근거 원칙 · 정정 기록.
 * 문헌 수는 data/references.ts에서 바로 세므로 여기 적지 않는다.
 */

/** 2026년 9월 개편한 주제 페이지 (지도 · 공정 재생 · 보강 문헌) */
export const revamped: { slug: string; thumb: string; scene: string; added?: [number, number] }[] = [
  { slug: "remanufacturing", thumb: "rm", scene: "재제조 작업장", added: [36, 41] },
  { slug: "reuse", thumb: "rs", scene: "재사용 야드", added: [42, 44] },
  { slug: "recycling", thumb: "rc", scene: "재활용 공정 (Hub & Spoke)" },
  { slug: "upcycling", thumb: "up", scene: "업사이클링 실험실", added: [45, 49] },
  { slug: "soh-diagnosis", thumb: "sh", scene: "진단 라인", added: [50, 54] },
  { slug: "safety", thumb: "sf", scene: "안전 동선", added: [55, 61] },
  { slug: "automated-disassembly", thumb: "ad", scene: "로봇 해체 셀", added: [62, 68] },
  { slug: "byproduct-recovery", thumb: "bp", scene: "부산물 회수 라인", added: [69, 72] },
];

/** 사이트 읽는 법 — 세 단계 */
export const howto: { k: "pin" | "play" | "cite"; t: string; d: string }[] = [
  { k: "pin", t: "지도의 번호를 누르세요", d: "그 단계만 밝아지고, 아래에 무엇이 들어가 무엇이 나오는지가 뜹니다." },
  { k: "play", t: "‘공정 재생’을 누르세요", d: "빛 점이 흐름을 따라가며 설비가 차례로 움직입니다. 언제든 멈추고 이어 볼 수 있습니다." },
  { k: "cite", t: "작은 번호를 누르세요", d: "본문의 [62] 같은 번호를 누르면 페이지 아래 근거 문헌으로 갑니다." },
];

/** 근거를 다루는 원칙 */
export const rules: { t: string; d: string }[] = [
  { t: "숫자에는 출처가 붙습니다", d: "출처를 확인한 숫자만 씁니다. 출처가 없는 부분은 ‘개념 그림’이라고 밝힙니다." },
  { t: "문헌은 하나씩 확인했습니다", d: "DOI · PMID · KCI 등재번호를 직접 조회해 실제로 있는 문헌인지, 서지가 맞는지 대조했습니다." },
  { t: "근거의 무게를 구분합니다", d: "학술 문헌 · 정책 · 기업 발표 · 조사자 판단을 모양과 글자로 나눠 표시합니다. 기업 발표는 외부 검증 전으로 봅니다." },
  { t: "틀리면 고치고 남깁니다", d: "개편하며 찾은 오류는 바로잡고, 무엇을 고쳤는지 아래에 기록합니다." },
];

/** 정정 기록 (최근 순) */
export const fixes: { when: string; slug: string; no: string; t: string; d: string }[] = [
  {
    when: "2026.9",
    slug: "byproduct-recovery",
    no: "08",
    t: "200 L 파일럿은 전해액 회수가 아니었습니다",
    d: "초임계 CO₂ 200 L 파일럿을 ‘전해액 회수’로 적었으나, 실제로는 CO₂와 물로 블랙파우더의 리튬을 먼저 녹이는 공정이었습니다. 03 재활용의 표도 함께 고쳤습니다.",
  },
  {
    when: "2026.9",
    slug: "safety",
    no: "06",
    t: "‘보관 기간 30→180일’은 확정된 제도가 아닙니다",
    d: "태양광 폐패널 제도와 섞인 표현이었습니다. 배터리는 2023년 12월 정부 방안이며 시행 여부는 확인 전이라고 표기했습니다.",
  },
  {
    when: "2026.9",
    slug: "remanufacturing",
    no: "01",
    t: "‘사후 검사’를 법의 용어로 바꿨습니다",
    d: "사용후배터리법에 맞춰 ‘정기 안전검사(3년마다)’로 고쳤습니다.",
  },
];

/** 만든 방법 */
export const making: { t: string; d: string }[] = [
  { t: "장면은 코드로 그렸습니다", d: "지도 속 설비는 Blender를 파이썬 코드로 움직여 직접 만든 등각 장면입니다. 외부 3D 모델과 AI 이미지는 쓰지 않았습니다." },
  { t: "움직임도 계산했습니다", d: "‘공정 재생’은 흐름선과 설비 동작 그림을 겹쳐 보여 줍니다. 07의 로봇 팔은 관절 각도를 매 장면 계산해 움직입니다." },
  { t: "누구나 볼 수 있게", d: "키보드로 모두 조작할 수 있고, 기기에서 ‘동작 줄이기’를 켜면 움직임 없이 결과만 보여 줍니다. 그림마다 화면 낭독용 설명을 달았습니다." },
];
