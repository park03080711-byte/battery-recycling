import type { LayerId } from "./layers";

export type VizName =
  | "soh"
  | "temperature"
  | "processes"
  | "products"
  | "eu"
  | "growth"
  | "feasibility"
  | "hubspoke";

export type Block =
  | { type: "p"; text: string }
  | { type: "steps"; items: { title: string; desc: string }[] }
  | { type: "note"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string }
  | { type: "list"; items: string[] }
  | { type: "viz"; name: VizName };

export interface Section {
  label: string;
  heading: string;
  blocks: Block[];
}

export interface Fact {
  value: string;
  label: string;
  note?: string;
}

export type Coverage = "심층 분석" | "개괄" | "병목으로 다룸" | "확장 후보";

export interface Topic {
  no: string;
  slug: string;
  layer: LayerId;
  title: string;
  en: string;
  tagline: string;
  lead: string;
  coverage: Coverage;
  facts: Fact[];
  sections: Section[];
  refs: number[];
  related: string[];
}

export const topics: Topic[] = [
  /* ───────────────────────── A. 처리 경로 ───────────────────────── */
  {
    no: "01",
    slug: "remanufacturing",
    layer: "paths",
    title: "재제조",
    en: "Remanufacturing",
    tagline: "지친 셀만 바꿔 다시 전기차로",
    lead: "잔존용량이 80% 이상 남은 배터리를 분해하고, 열화된 셀만 교체한 뒤 다시 조립해 본래 성능으로 되돌리는 경로입니다. 다시 자동차에 실리기 때문에 세 경로 가운데 안전 기준이 가장 높습니다.",
    coverage: "개괄",
    facts: [
      { value: "80%+", label: "잔존용량 분류 기준", note: "일반적 기준, 사업자·용도별 상이" },
      { value: "3단계", label: "품질 점검 체계", note: "성능평가 · 유통 전 안전검사 · 사후 검사" },
      { value: "국토교통부", label: "소관 부처", note: "자동차관리법 제30조의2" },
    ],
    sections: [
      {
        label: "WHERE IT STARTS",
        heading: "세 갈래 중 가장 위쪽 가지",
        blocks: [
          { type: "p", text: "전기차에서 떼어낸 배터리는 곧바로 분해되지 않습니다. 남은 성능, 즉 잔존용량(SOH)에 따라 갈 길이 정해집니다. 재제조는 그중 성능이 가장 많이 남은 배터리가 가는 길입니다." },
          { type: "viz", name: "soh" },
        ],
      },
      {
        label: "PROCESS",
        heading: "어떻게 되살리는가",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "팩 개봉과 진단", desc: "팩을 열어 모듈과 셀 단위로 상태를 확인합니다." },
              { title: "선별 교체", desc: "열화가 심한 모듈이나 셀만 골라내 교체합니다." },
              { title: "셀밸런싱", desc: "남은 셀들의 충전 상태를 서로 맞춥니다." },
              { title: "재조립 · 검사", desc: "다시 조립하고 차량 탑재 기준에 맞는지 검사합니다." },
            ],
          },
          { type: "p", text: "다시 자동차에 들어가야 하므로 급가속과 급충전을 견뎌야 합니다. ESS로 가는 재사용보다 요구 조건이 훨씬 까다로운 이유입니다." },
        ],
      },
      {
        label: "BOTTLENECKS",
        heading: "막히는 곳은 두 군데",
        blocks: [
          { type: "p", text: "첫째는 개별 셀의 상태를 빠르고 정확하게 알아내는 일, 둘째는 팩을 안전하고 빠르게 분해하는 일입니다. 두 병목은 각각 05번 잔존수명 진단, 07번 자동화 해체 주제로 이어집니다." },
          { type: "note", title: "폐기물이 아니라 제품", text: "탈거 전 상세 성능평가에서 재제조·재사용 기준을 충족한 배터리는 탈거 시점부터 폐기물이 아닌 제품으로 인정되고 순환자원으로 지정됩니다. 품질 신뢰를 위해 성능평가, 유통 전 안전검사, 사후 검사의 3단계 점검 체계가 함께 도입됩니다." },
        ],
      },
    ],
    refs: [23, 26],
    related: ["soh-diagnosis", "automated-disassembly", "reuse"],
  },
  {
    no: "02",
    slug: "reuse",
    layer: "paths",
    title: "재사용",
    en: "Reuse · Second Life",
    tagline: "자동차엔 부족해도 ESS엔 충분하다",
    lead: "잔존용량 60~80%의 배터리를 에너지저장장치(ESS)처럼 성능 요구가 낮은 용도로 옮겨 쓰는 경로입니다. 배터리 제조에 이미 들어간 에너지를 더 오래 활용한다는 점이 핵심입니다.",
    coverage: "개괄",
    facts: [
      { value: "60~80%", label: "잔존용량 분류 기준", note: "일반적 기준" },
      { value: "6+", label: "대표 활용처", note: "ESS · UPS · 태양광 가로등 · 골프카 · 전기이륜차 · 전동휠체어" },
      { value: "환경부", label: "소관 부처", note: "친환경산업법(신설 예정)" },
    ],
    sections: [
      {
        label: "WHY IT WORKS",
        heading: "성능 요구의 차이가 기회를 만든다",
        blocks: [
          { type: "p", text: "자동차는 급가속과 급충전을 견뎌야 하지만 정치형 ESS는 그렇지 않습니다. 전기차용으로는 부족해진 배터리도 ESS에는 충분한 경우가 많고, 이 차이가 재사용을 가능하게 합니다." },
          { type: "viz", name: "soh" },
        ],
      },
      {
        label: "ECONOMICS",
        heading: "경제성은 조건부다",
        blocks: [
          { type: "p", text: "Dong 외(2023)는 가정용, 전력망용, 전기차 충전소용 재사용의 경제성과 환경 편익을 종합 검토했습니다. 결론은 경제적 편익이 전기요금, 배터리 가격, 사용 시나리오에 크게 좌우된다는 것입니다. 재사용은 기술의 문제라기보다 시장 조건의 문제에 가깝습니다." },
          { type: "p", text: "Soloot 외(2026)는 재사용과 재활용을 전과정평가로 직접 비교했습니다. 기존 연구들이 용도 전환과 그 준비 과정을 뭉뚱그려 다루던 것을 세분화했다는 점이 특징입니다." },
        ],
      },
      {
        label: "TRADE-OFF",
        heading: "재사용이 재활용보다 항상 나을까",
        blocks: [
          { type: "note", title: "경쟁이 아니라 시간 순서", text: "성능이 떨어진 배터리를 계속 쓰면 같은 전력을 저장하는 데 더 많은 셀이 필요하고 효율도 낮아집니다. 재사용 기간이 끝나면 결국 재활용으로 가므로 두 경로는 경쟁 관계가 아니라 시간 순서 관계입니다. 다만 재사용을 거치면 금속 회수가 그만큼 늦어지므로, 원료 공급이 시급한 상황에서는 곧바로 재활용하는 편이 유리할 수 있습니다." },
        ],
      },
    ],
    refs: [25, 24],
    related: ["soh-diagnosis", "lca", "recycling"],
  },
  {
    no: "03",
    slug: "recycling",
    layer: "paths",
    title: "재활용",
    en: "Recycling",
    tagline: "배터리를 원소로 되돌리는 일",
    lead: "잔존용량 60% 미만의 배터리를 부수고 녹여 리튬·니켈·코발트 같은 유가금속을 원소 단위로 회수합니다. 리사이클링 공정은 크게 9가지로 분류되며, 이 중 상용화된 것은 4가지입니다.",
    coverage: "심층 분석",
    facts: [
      { value: "95%+", label: "습식제련 회수율", note: "기업 자체 발표 기준" },
      { value: "9 / 4", label: "공정 분류 / 상용화", note: "세부 변형 포함 시 14가지" },
      { value: "4 of 5", label: "세계 상위 양산 업체 중 습식 채택", note: "이유는 리튬 회수" },
    ],
    sections: [
      {
        label: "STANDARD PROCESS",
        heading: "기준점: Hub & Spoke 습식제련",
        blocks: [
          { type: "p", text: "국내 최대 리사이클링 기업의 공정은 지리적으로 분리된 두 단계로 나뉩니다. 해외 각지의 전처리 거점(Spoke)이 부피와 위험을 줄이고, 국내 거점(Hub)이 화학적 정제를 맡습니다. 무겁고 화재 위험이 큰 배터리 팩은 현지에서 분말로 바꾼 뒤에만 이동합니다." },
          { type: "viz", name: "hubspoke" },
          { type: "p", text: "침출 단계의 과산화수소는 단순한 첨가제가 아니라 환원제입니다. 양극재의 코발트는 Co³⁺ 상태로 안정하게 결합해 있어 산만으로는 잘 녹지 않는데, 과산화수소가 이를 Co²⁺로 환원시키면서 비로소 용해가 빠르게 진행됩니다." },
          { type: "viz", name: "products" },
        ],
      },
      {
        label: "PYRO vs HYDRO",
        heading: "무게로 가를까, 화학으로 가를까",
        blocks: [
          { type: "p", text: "건식제련은 1,400℃ 이상에서 배터리를 통째로 녹여 밀도 차이로 금속을 가릅니다. 아래층에 코발트·니켈·구리 합금이, 위층에 슬래그가 뜨는데, 이때 가벼운 리튬과 알루미늄, 망간이 슬래그로 빠져나갑니다. 습식제련은 녹인 뒤 화학적 성질로 가르기 때문에 느리고 단계가 많은 대신 리튬까지 건질 수 있습니다." },
          { type: "viz", name: "temperature" },
          { type: "note", title: "리튬 회수가 왜 중요한가", text: "EU는 2027년까지 폐배터리 리튬의 50%를 추출하도록 요구하고, 2031년부터는 신품에 리튬 재생원료 6%를 넣도록 강제합니다. 리튬을 회수하지 못하는 공정은 규제 대응 자체가 불가능합니다." },
        ],
      },
      {
        label: "NINE PROCESSES",
        heading: "재활용 공정 9종",
        blocks: [
          { type: "p", text: "직접재생은 분해해서 원료를 되찾는 대신 분해하지 않고 고칩니다. 충방전으로 빠져나간 리튬의 빈자리만 다시 채워 넣으므로 결정 구조가 한 번도 해체되지 않습니다. 바이오리칭은 황을 먹고 황산을 내놓는 세균에게 산 생산을 맡깁니다. 가장 낮은 온도, 가장 적은 화학물질 구매, 가장 긴 시간이 특징입니다." },
          { type: "viz", name: "processes" },
        ],
      },
      {
        label: "FEASIBILITY",
        heading: "이론적 대안은 어디까지 왔나",
        blocks: [
          { type: "p", text: "다섯 대안 중 어느 것도 습식제련을 통째로 대체하는 방향으로는 근거가 부족합니다. 반면 특정 단계를 떼어내 대체하는 방향으로는 설득력이 있습니다. 기계화학은 침출 단계를, 초임계 CO₂는 열처리에 의한 전해액 처리를 각각 대체할 수 있습니다." },
          { type: "viz", name: "feasibility" },
          { type: "note", title: "등급에 관한 유의점", text: "실현 가능성 등급은 문헌 서술을 근거로 한 조사자의 판단이며 표준화된 기술성숙도(TRL) 평가가 아닙니다. 인용된 성능 수치 대부분은 단일 조성의 정제된 시료에서 얻은 실험실 값입니다." },
        ],
      },
    ],
    refs: [1, 2, 3, 4, 5, 8, 9, 11, 14, 15, 19, 22, 27, 28, 31],
    related: ["upcycling", "byproduct-recovery", "lca"],
  },
  {
    no: "04",
    slug: "upcycling",
    layer: "paths",
    title: "업사이클링",
    en: "Upcycling",
    tagline: "원소로 돌아가지 않고 새 소재로",
    lead: "지금까지의 방식은 모두 폐배터리를 원소나 재생 활물질로 되돌려 다시 배터리 원료로 쓰는 순환을 전제합니다. 업사이클링은 그 고리를 끊고, 금속을 회수하지 않은 채 곧바로 다른 기능성 소재로 재구성합니다.",
    coverage: "심층 분석",
    facts: [
      { value: "1,170", label: "CoTPA 전극 용량 (mAh/g)", note: "폐LiCoO₂ + 폐PET" },
      { value: "92.1%", label: "500사이클 후 용량 유지", note: "Dai 외, 2026" },
      { value: "2", label: "세부 변형", note: "레독스 흐름전지 투입 / 금속-유기 전극" },
    ],
    sections: [
      {
        label: "CASE 1",
        heading: "두 폐기물이 서로의 시약이 되다",
        blocks: [
          { type: "p", text: "LiCoO₂와 폐PET를 함께 반응시킨 연구에서는 PET가 분해되며 나오는 테레프탈산과 에틸렌글리콜이 배위 리간드, 양성자 공급원, 환원제 역할을 동시에 수행했습니다. 외부 침출제나 환원제 없이 금속-유기 골격체 전극(CoTPA)이 만들어졌습니다." },
        ],
      },
      {
        label: "CASE 2",
        heading: "폐양극재를 흐름전지에 그대로",
        blocks: [
          { type: "p", text: "부산대·부경대·KIGAM 공동 연구는 폐 LiMn₂O₄를 수계 아연-망간 레독스 흐름전지에 직접 통합하는 방식을 제시했습니다. 망간을 따로 정제하지 않고 다른 에너지저장 장치의 재료로 곧바로 투입하는 접근입니다." },
        ],
      },
      {
        label: "THE REAL GAP",
        heading: "병목은 기술이 아니라 시장",
        blocks: [
          { type: "p", text: "PET 유래 하드카본은 나트륨이온전지 음극에서 400 mAh/g 이상의 가역 용량을 보이며 상용 문턱에 섰습니다. 나트륨이온전지 시장이 실제로 열리고 있기 때문입니다. 반면 CoTPA가 향하는 듀얼이온 배터리는 아직 상용화되지 않았습니다." },
          { type: "note", title: "기술적으로 작동하나 생태계가 없다", text: "반응은 이미 작동하고 성능도 나옵니다. 부족한 것은 그 물건을 쓸 시장입니다. 다만 LFP처럼 회수 금속의 가치가 낮아 습식제련이 적자를 보는 영역에서는 '싸게 회수하기'보다 '다른 가치로 전환하기'가 경제적 해법이 될 수 있습니다." },
        ],
      },
    ],
    refs: [34, 20, 45, 46, 47, 48, 49],
    related: ["recycling", "techno-economic", "supply-chain"],
  },

  /* ───────────────────────── B. 지원 기술 ───────────────────────── */
  {
    no: "05",
    slug: "soh-diagnosis",
    layer: "support",
    title: "잔존수명 진단",
    en: "State-of-Health Diagnosis",
    tagline: "세 갈래 길의 입구",
    lead: "배터리의 남은 성능을 빠르고 정확하게 매기는 기술입니다. 재제조·재사용·재활용 중 어디로 보낼지가 여기서 정해지므로, 세 경로 전체의 입구에 해당합니다.",
    coverage: "병목으로 다룸",
    facts: [
      { value: "80 · 60", label: "경로가 갈리는 잔존용량(%)", note: "일반적 기준" },
      { value: "4종", label: "실험실 정밀 진단법", note: "충방전 · 펄스 · EIS · 열 특성" },
      { value: "ML", label: "최근 연구 방향", note: "최소 시험 + 합성 데이터 + 기계학습" },
    ],
    sections: [
      {
        label: "WHY IT'S HARD",
        heading: "왜 어려운가",
        blocks: [
          { type: "p", text: "Zhang 외(2025)의 리뷰는 은퇴 배터리 진단이 어려운 이유를 네 가지로 정리합니다." },
          { type: "list", items: ["측정 데이터가 드물다", "사용 이력 기록이 불완전하다", "화학조성이 제각각이다", "배터리가 스스로 표시하는 건전성 값이 제한적이거나 부정확하다"] },
          { type: "viz", name: "soh" },
        ],
      },
      {
        label: "LAB vs FIELD",
        heading: "정밀한 방법은 이미 있다, 다만 느리다",
        blocks: [
          { type: "p", text: "완전 충방전 시험, 펄스 시험, 전기화학 임피던스 분광법(EIS), 열 특성 분석이 실험실 수준의 정밀 진단법입니다. 문제는 이 방법들이 너무 오래 걸리거나 장비를 많이 요구해, 대량으로 들어오는 배터리를 선별하는 현장에는 쓸 수 없다는 점입니다." },
          { type: "p", text: "그래서 최근 연구는 최소한의 시험만으로 얻을 수 있는 특징, 합성 데이터, 기계학습 기반 추정으로 방향을 틀었습니다. 정확도와 해석 가능성, 확장성, 계산 부담 사이의 균형을 찾는 것이 과제입니다." },
        ],
      },
      {
        label: "POLICY LINK",
        heading: "제도가 된 기술 — 탈거 전 성능평가",
        blocks: [
          { type: "note", title: "국내법과의 접점", text: "이 기술이 곧 사용후배터리법이 규정한 탈거 전 성능평가입니다. 전기차에 탑재된 상태에서 배터리 등급을 신속히 분류해 어디로 보낼지 결정합니다. 빠르고 정확한 검사가 사업 경제성을 좌우하므로 정부도 평가 기술과 장비 개발을 지원 대상으로 명시하고 있습니다." },
        ],
      },
    ],
    refs: [23],
    related: ["remanufacturing", "reuse", "traceability"],
  },
  {
    no: "06",
    slug: "safety",
    layer: "support",
    title: "안전 관리",
    en: "Safety Management",
    tagline: "모든 공정은 방전에서 시작한다",
    lead: "완전 방전, 열폭주 방지, 운송 규제 대응을 아우르는 주제입니다. 폐배터리는 비어 보여도 전기와 가연성 전해액을 품고 있어, 어떤 경로든 첫 단계는 위험을 없애는 일입니다.",
    coverage: "확장 후보",
    facts: [
      { value: "1단계", label: "안전 방전", note: "잔류 전력에 의한 화재 · 열폭주 예방" },
      { value: "30→180일", label: "재활용 용도 보관 · 처리 기간", note: "제도 개선으로 연장" },
      { value: "분말 이송", label: "Hub & Spoke의 안전 전략", note: "팩 상태로는 장거리 이동하지 않음" },
    ],
    sections: [
      {
        label: "FIRST STEP",
        heading: "왜 방전부터 하는가",
        blocks: [
          { type: "p", text: "전처리의 첫 단계는 완전 방전입니다. 잔류 전력이 남은 상태로 팩을 해체하거나 파쇄하면 화재와 열폭주로 이어질 수 있기 때문입니다. 방전을 마친 뒤에야 팩을 모듈과 셀 단위로 분해합니다." },
          { type: "p", text: "이어지는 열처리 단계에서는 배터리 내부의 전해액을 안전하게 휘발시키고 바인더를 분해합니다. 현재 공정에서 전해액은 회수 대상이 아니라 안전을 위해 제거하는 대상입니다." },
        ],
      },
      {
        label: "LOGISTICS",
        heading: "물류가 곧 안전이다",
        blocks: [
          { type: "p", text: "Hub & Spoke 구조는 물류 최적화이면서 동시에 안전 전략입니다. 무겁고 화재 위험이 큰 배터리 팩은 현지 거점에서 블랙파우더로 바꾼 뒤에만 이동합니다. 운송비와 화재 위험을 함께 줄이는 방식입니다." },
          { type: "viz", name: "hubspoke" },
        ],
      },
      {
        label: "PEOPLE",
        heading: "작업자를 지키는 일",
        blocks: [
          { type: "p", text: "배터리 팩 해체는 현재 대부분 사람 손으로 이루어지며, 작업자가 감전과 유해 화학물질에 노출됩니다. 이 문제의식이 07번 자동화 해체 주제로 이어집니다." },
          { type: "note", title: "제도적 안전장치", text: "재제조·재사용 배터리에는 성능평가, 유통 전 안전검사, 사후 검사의 3단계 점검 체계가 적용됩니다. 재활용 용도의 보관·처리 가능 기간은 30일에서 180일로 연장되어 원재료 조달의 안정성이 높아졌습니다." },
        ],
      },
    ],
    refs: [14, 26],
    related: ["automated-disassembly", "byproduct-recovery", "recycling"],
  },
  {
    no: "07",
    slug: "automated-disassembly",
    layer: "support",
    title: "자동화 해체",
    en: "Automated Disassembly",
    tagline: "사람 손에서 로봇 팔로",
    lead: "배터리 팩 해체는 지금도 대부분 수작업입니다. 위험하고, 팩마다 설계가 달라 표준화도 어렵습니다. 로보틱스와 원격조작으로 안전성과 비용 효율을 함께 잡으려는 연구가 이 주제입니다.",
    coverage: "병목으로 다룸",
    facts: [
      { value: "수작업", label: "현재 해체 방식", note: "감전 · 유해물질 노출 위험" },
      { value: "셀 단위", label: "비전 기반 로봇 분해 목표", note: "사전 위치 정보 없이" },
      { value: "DT · XR", label: "원격 해체 접근", note: "디지털 트윈 · 확장현실" },
    ],
    sections: [
      {
        label: "PROBLEM",
        heading: "표준이 없는 팩을 분해하는 일",
        blocks: [
          { type: "p", text: "전기차 배터리 팩은 제조사와 차종마다 구조가 다릅니다. 나사, 접착, 용접, 배선 배치가 제각각이라 한 가지 절차로 모든 팩을 처리할 수 없습니다. 이것이 지금까지 사람이 해체를 맡아온 이유이자, 자동화가 어려운 이유입니다." },
        ],
      },
      {
        label: "APPROACHES",
        heading: "세 가지 접근",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "로봇 셀", desc: "Liang 외(2025)는 모듈 해체용 로봇 셀 시제품을 제안했습니다. 안전성과 비용 효율성을 동시에 겨냥한 설계입니다." },
              { title: "비전 기반 분해", desc: "로봇이 미리 위치를 모르는 팩을 시각 정보만으로 셀 단위까지 분해하는 방법이 연구되고 있습니다." },
              { title: "디지털 트윈 · XR 원격 해체", desc: "가상 모델과 확장현실을 이용해 사람이 떨어진 곳에서 해체를 지휘하는 방식입니다." },
            ],
          },
        ],
      },
      {
        label: "INDUSTRY",
        heading: "산업 현장의 같은 문제의식",
        blocks: [
          { type: "p", text: "국내 리사이클링 기업의 공정 설명에서도 대용량 전기차 배터리의 효율적이고 안전한 해체를 위해 공정 자동화와 로보틱스 도입이 활발히 연구되고 있다고 서술합니다. 재제조처럼 셀을 온전히 꺼내야 하는 경로일수록 해체 품질이 곧 경제성입니다." },
          { type: "note", title: "근본 해법은 설계에 있다", text: "팩마다 설계가 다르다는 문제는 해체 기술만으로 풀기 어렵습니다. 처음부터 분해하기 쉽게 만드는 14번 '분해를 고려한 설계'가 짝을 이루는 이유입니다." },
        ],
      },
    ],
    refs: [26],
    related: ["safety", "remanufacturing", "design-for-disassembly"],
  },
  {
    no: "08",
    slug: "byproduct-recovery",
    layer: "support",
    title: "부산물 회수",
    en: "By-product Recovery",
    tagline: "버려지던 전해액과 흑연",
    lead: "현재 재활용 공정은 리튬·니켈·코발트 같은 금속에 집중합니다. 전해액은 열처리로 휘발시키고 흑연도 대부분 회수하지 않습니다. 안전을 위해 없애는 것이지 회수하는 것이 아니며, 이 공백이 가장 큰 영역입니다.",
    coverage: "확장 후보",
    facts: [
      { value: "99.82%+", label: "초임계 CO₂ 파일럿 Li₂CO₃ 순도", note: "추가 정제 없이, 2026" },
      { value: "200 L", label: "오토클레이브 파일럿 규모", note: "ACS Sustain. Resour. Manag." },
      { value: "LiPF₆", label: "전해액 속 고가 성분", note: "현재는 휘발 제거" },
    ],
    sections: [
      {
        label: "WHAT'S LOST",
        heading: "지금 무엇이 버려지는가",
        blocks: [
          {
            type: "table",
            head: ["성분", "현재 처리", "비고"],
            rows: [
              ["알루미늄 · 구리", "해체 · 선별 단계에서 스크랩으로 회수", "비교적 잘 회수됨"],
              ["철 · 포일류", "자력 · 비중 선별로 분리", "블랙파우더에서 걸러냄"],
              ["전해액 (LiPF₆ 등)", "열처리로 휘발", "안전 목적의 제거"],
              ["흑연 (음극)", "대부분 미회수", "블랙파우더가 검은 이유"],
            ],
          },
        ],
      },
      {
        label: "SUPERCRITICAL CO₂",
        heading: "디카페인 커피의 원리를 배터리에",
        blocks: [
          { type: "p", text: "CO₂는 31℃, 7.4 MPa를 넘으면 액체처럼 물질을 녹이면서 기체처럼 빠르게 확산하는 초임계 유체가 됩니다. 압력만 낮추면 그대로 날아가 추출물에 남지 않습니다. 1970년대 커피 카페인 제거에 상용화된 기술입니다." },
          { type: "p", text: "노화된 배터리는 전해액이 전극 깊숙이 스며들어 '말라 보이는' 상태가 되는데, 초임계 CO₂는 기체처럼 확산하므로 이런 깊은 층까지 침투해 뽑아낼 수 있습니다. 2026년 200 L 파일럿에서 순도 99.82% 이상의 배터리급 탄산리튬을 추가 정제 없이 얻었습니다." },
        ],
      },
      {
        label: "DOMESTIC",
        heading: "국내 연구",
        blocks: [
          { type: "p", text: "국내에서도 폐 리튬이온전지 전해액 재활용 기술을 분석한 연구(안재우 외, 2025)가 나와 있습니다. 전해액 회수는 초임계 CO₂의 두 용도 가운데 실현 단계에 가장 가까운 쪽으로 평가됩니다." },
          { type: "note", title: "두 용도는 구분해야 한다", text: "초임계 CO₂ 단독으로는 금속이 녹지 않습니다. 금속 추출에 쓰려면 산을 공용매로 넣어야 해서 '산을 안 쓴다'는 장점이 사라집니다. 전해액 회수와 금속 추출은 원리가 같아도 실현 가능성이 크게 다릅니다." },
        ],
      },
    ],
    refs: [17, 30, 31, 29],
    related: ["recycling", "safety", "lca"],
  },
  {
    no: "09",
    slug: "traceability",
    layer: "support",
    title: "이력관리",
    en: "Battery Passport · Traceability",
    tagline: "제조부터 재활용까지 한 줄로",
    lead: "배터리의 제조부터 운행, 회수, 재활용까지 정보를 추적하는 제도입니다. EU의 배터리 여권과 국내의 전주기 이력관리 시스템이 대표적이며, 조성별 분류의 제도적 기반이 됩니다.",
    coverage: "확장 후보",
    facts: [
      { value: "2028", label: "EU 재생원료 사용 비중 보고 시작", note: "사업장별 배터리 모델 단위" },
      { value: "전주기", label: "국내 이력관리 범위", note: "제조 · 운행 · 회수 · 재활용" },
      { value: "NCM622", label: "→ NCM622", note: "직접재생은 같은 조성끼리만" },
    ],
    sections: [
      {
        label: "WHY TRACK",
        heading: "왜 추적해야 하는가",
        blocks: [
          { type: "p", text: "직접재생은 NCM622만 모아야 NCM622가 나옵니다. NCM과 LFP가 섞여 들어오면 성립하지 않습니다. 결국 어떤 배터리가 어떤 조성인지 알아야 하고, 그 정보를 배터리 수명 내내 들고 다니게 하는 장치가 이력관리입니다." },
          { type: "p", text: "잔존수명 진단에서도 사용 이력 기록이 불완전하다는 점이 어려움으로 꼽힙니다. 이력이 남아 있으면 진단도 쉬워집니다." },
        ],
      },
      {
        label: "SYSTEMS",
        heading: "EU와 한국의 제도",
        blocks: [
          {
            type: "table",
            head: ["구분", "EU", "한국"],
            rows: [
              ["추적 장치", "배터리 여권", "전주기 이력관리 시스템"],
              ["근거", "EU 배터리 규정 (2024년 2월 시행)", "사용후배터리법 (2026년 5월 국무회의 의결)"],
              ["함께 부과되는 의무", "탄소발자국 신고 · 공급망 실사", "탈거 전 성능평가 · 재생원료 인증"],
            ],
          },
        ],
      },
      {
        label: "TRILEMMA",
        heading: "화학으로 풀 수 없는 문제의 해법",
        blocks: [
          { type: "note", title: "트릴레마 논문의 결론", text: "Zhang(2026)은 실험실의 99% 순도 회수와 수익을 내는 공장 사이의 간극을 지적하며, 원료 조성이 제각각이라는 문제는 화학으로 풀 수 없다고 봤습니다. 제시한 해법은 새로운 공정이 아니라 배터리 조성 정보를 추적하는 디지털 제품 여권과 분해를 고려한 설계입니다." },
        ],
      },
    ],
    refs: [35],
    related: ["certification", "design-for-disassembly", "soh-diagnosis"],
  },
  {
    no: "10",
    slug: "certification",
    layer: "support",
    title: "재생원료 인증",
    en: "Recycled Content Certification",
    tagline: "얼마나 되살렸는지 증명하는 일",
    lead: "재생원료의 생산과 사용을 공식적으로 인증하는 제도입니다. 기업 자체 발표에 의존하던 회수 성능이 검증 가능한 데이터로 바뀌고, EU의 재생원료 의무 사용 비율에 대응하는 근거가 됩니다.",
    coverage: "확장 후보",
    facts: [
      { value: "2027.5", label: "국내 재생원료 인증제 도입 예정" },
      { value: "6곳", label: "2026년 6월 시범사업 참여 기업", note: "한국환경공단과 협약" },
      { value: "Co 16%", label: "EU 2031 코발트 재생원료 의무", note: "2036년 26%로 상향" },
    ],
    sections: [
      {
        label: "THE GAP",
        heading: "지금은 구분이 안 된다",
        blocks: [
          { type: "p", text: "현재 재활용 업계는 폐배터리를 파쇄해 블랙매스로 만든 뒤 리튬·니켈·코발트를 생산하지만, 광물에서 만든 중간 원료와 섞어 쓰는 경우가 많아 구분이 되지 않습니다. 폐배터리에서 실제로 얼마나 회수했는지에 대한 정확한 데이터가 없고, 최종 생산물도 재생원료로 인증받지 못하고 있습니다." },
        ],
      },
      {
        label: "EU TARGETS",
        heading: "재활용이 시장 진입 요건이 되다",
        blocks: [
          { type: "p", text: "EU 배터리 규정의 핵심은 신품 배터리에 재생원료를 일정 비율 이상 넣도록 강제한 것입니다. 국내 배터리 3사가 모두 EU에 진출해 있어 한국 기업에도 직접 적용됩니다." },
          { type: "viz", name: "eu" },
        ],
      },
      {
        label: "KOREA",
        heading: "국내 제도의 흐름",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "2026.05 법 의결", desc: "「사용후 배터리의 관리 및 산업육성에 관한 법률」 제정안 국무회의 의결. 공포 후 1년 경과 시 시행." },
              { title: "2026.06 시범사업", desc: "재활용 기업 6곳과 한국환경공단 간 재생원료 생산 인증 시범사업 협약." },
              { title: "2027.05 인증제 도입", desc: "재생원료의 생산 · 사용 인증, 함유율 목표제로 EU 기준에 대응." },
            ],
          },
          { type: "note", title: "인증이 바꾸는 것", text: "회수율 95%, CO₂ 70% 절감 같은 수치는 지금은 기업 자체 발표입니다. 인증제는 이런 성능 지표에 공식 근거를 부여합니다. 제도는 개정될 수 있으므로 인용 시점에 최신 내용을 다시 확인해야 합니다." },
        ],
      },
    ],
    refs: [35],
    related: ["traceability", "supply-chain", "recycling"],
  },

  /* ───────────────────────── C. 평가 ───────────────────────── */
  {
    no: "11",
    slug: "lca",
    layer: "evaluation",
    title: "전과정평가",
    en: "Life Cycle Assessment",
    tagline: "환경에 정말 이로운가를 숫자로",
    lead: "원료 채취부터 폐기까지 전 과정의 환경영향을 정량적으로 평가하는 방법론입니다. 어떤 재활용 방식이 '친환경적'인지는 느낌이 아니라 이 계산으로 판단합니다.",
    coverage: "심층 분석",
    facts: [
      { value: "70%+", label: "채굴 대비 CO₂ 절감", note: "습식제련 기업 자체 발표" },
      { value: "~20%", label: "용융염 방식 에너지 · CO₂ 절감", note: "Xiao 외, 2026" },
      { value: "0", label: "직접재생의 결정 구조 해체 횟수", note: "구조 에너지를 보존" },
    ],
    sections: [
      {
        label: "CONSENSUS",
        heading: "네 편의 리뷰, 하나의 진단",
        blocks: [
          { type: "p", text: "Pang 외(2025)는 LCA로 건식과 습식을 비교해 습식제련이 회수율과 환경 성능에서 앞서지만 복잡한 화학물질·폐수 관리를 요구한다고 결론지었습니다. Paul & Shrotriya(2025)는 건식제련이 에너지를 많이 쓰면서도 리튬을 잃고 배출량도 크다고 지적합니다. 서로 다른 기관의 리뷰가 같은 진단을 내렸습니다." },
        ],
      },
      {
        label: "HIDDEN COST",
        heading: "습식제련이 회수하지 못하는 에너지",
        blocks: [
          { type: "p", text: "습식제련은 양극 활물질의 결정 구조를 허물고 원소 단위로 되돌립니다. 잘 만들어진 결정 구조를 일단 허물고 다시 쌓는 셈이라, 그 구조에 들어간 에너지는 회수되지 않습니다. 직접재생이 에너지와 탄소 배출에서 근본적으로 유리한 이유입니다." },
          { type: "viz", name: "temperature" },
        ],
      },
      {
        label: "REUSE vs RECYCLE",
        heading: "재사용과 재활용을 같은 저울에",
        blocks: [
          { type: "p", text: "Soloot 외(2026)는 2차·3차 수명 재사용과 재활용을 전과정평가로 직접 비교했습니다. 용도 전환 준비 과정까지 세분화해 계산했다는 점에서, 재사용이 언제 유리하고 언제 불리한지를 가르는 근거가 됩니다." },
          { type: "note", title: "숫자를 읽을 때", text: "CO₂ 70% 절감은 기업 자체 발표이고, 신기술의 절감 수치는 대부분 실험실 조건에서 나왔습니다. LCA 결과는 전력 구성, 운송 거리, 원료 조성 같은 가정에 따라 크게 달라지므로 출처와 전제를 함께 밝혀야 합니다." },
        ],
      },
    ],
    refs: [3, 2, 24, 27],
    related: ["techno-economic", "reuse", "recycling"],
  },
  {
    no: "12",
    slug: "techno-economic",
    layer: "evaluation",
    title: "기술경제성 분석",
    en: "Techno-Economic Analysis",
    tagline: "실험실 99%와 공장 흑자 사이",
    lead: "기술이 돈이 되는지를 따지는 분석입니다. 실험실의 99% 순도와 실제로 수익을 내는 공장 사이에는 큰 간극이 있고, 이 간극을 재는 것이 기술경제성 분석의 몫입니다.",
    coverage: "심층 분석",
    facts: [
      { value: "~10배", label: "용융염 저온 방식 수익성 추산", note: "Xiao 외, 2026 · 실험실 기반" },
      { value: "1/3", label: "바이오리칭 비용 평가", note: "광석 기준 — 블랙매스엔 그대로 적용 불가" },
      { value: "LFP", label: "습식제련 적자 영역", note: "회수 금속 가치가 낮음" },
    ],
    sections: [
      {
        label: "TRILEMMA",
        heading: "아름다운 화학이 무너지는 곳",
        blocks: [
          { type: "p", text: "2026년 Materials에 실린 트릴레마 논문은 아름다운 화학이 수천 가지 배터리 종류, 요동치는 금속 가격, 제각각인 규제 앞에서 무너진다고 지적합니다. 실제 블랙매스는 여러 화학조성이 섞이고 구리·알루미늄·불소 잔류물이 들어 있어 논문 속 정제된 시료와 다릅니다." },
        ],
      },
      {
        label: "PRICE",
        heading: "리튬 가격이 공정을 바꾼다",
        blocks: [
          { type: "p", text: "건식과 습식의 차이는 리튬 가격이 오른 지금 곧 수익성의 차이가 됩니다. 국내 연구(유경근, 2023)에 따르면 리튬 가격 급등 이후 새 공정은 니켈·코발트보다 리튬을 먼저 회수하는 순서로 바뀌었습니다." },
          { type: "p", text: "직접재생의 주요 원가는 보충용 리튬염입니다. Appleberry 외(2026)는 블랙파우더에 이미 남은 잔류 리튬을 끌어 써서 외부 리튬염 투입을 없앴습니다. 혼다 연구소가 공저자로 참여했다는 점에서 완성차 업체의 관심을 읽을 수 있습니다." },
        ],
      },
      {
        label: "CAUTION",
        heading: "같은 기술, 다른 원료, 다른 계산",
        blocks: [
          { type: "note", title: "'3분의 1 비용'의 함정", text: "여러 문헌이 바이오리칭을 기존 침출 기술의 3분의 1 비용으로 평가하는데, 이 수치는 주로 광산 폐석 처리 경험에서 나왔습니다. 광석은 금속 농도가 낮아 시간을 들여도 괜찮지만, 블랙매스는 금속 농도가 높아 빨리 처리해야 자본이 회수됩니다." },
          { type: "p", text: "재사용의 경제성 역시 전기요금, 배터리 가격, 사용 시나리오에 따라 달라지는 조건부 결론입니다(Dong 외, 2023). 기술경제성 분석은 한 번의 답이 아니라 조건별 답을 내는 작업입니다." },
        ],
      },
    ],
    refs: [35, 9, 13, 14, 25, 27],
    related: ["lca", "supply-chain", "upcycling"],
  },
  {
    no: "13",
    slug: "supply-chain",
    layer: "evaluation",
    title: "공급망 · 자원안보",
    en: "Supply Chain & Resource Security",
    tagline: "폐배터리는 도시광산이다",
    lead: "폐배터리에는 전략 광물이 천연 광석보다 높은 농도로 들어 있습니다. 이를 회수하는 일은 환경 문제이자 자원 확보 전략이며, 기술보다 정책의 문제에 가깝습니다.",
    coverage: "확장 후보",
    facts: [
      { value: "107,500", label: "2030년 국내 사용후 배터리 배출 전망(개)", note: "환경 당국 추정 · 2023년 약 2,355개" },
      { value: "4,227만 대", label: "2040년 세계 전기차 폐차 추산", note: "시장 2,000억 달러 이상" },
      { value: "20%", label: "2030 재자원화 비율 목표", note: "10대 전략 핵심광물" },
    ],
    sections: [
      {
        label: "URBAN MINE",
        heading: "도시광산이라는 표현의 근거",
        blocks: [
          { type: "p", text: "폐배터리는 천연 광석보다 유가금속 농도가 높습니다. 채굴 대비 낮은 에너지로 같은 금속을 얻을 수 있다는 뜻이며, 폐배터리를 폐기물이 아닌 자원으로 보는 관점의 출발점입니다. 국내에서도 사용후 배터리를 국가 전략자원으로 관리하겠다는 방향이 법제화됐습니다." },
          { type: "viz", name: "growth" },
        ],
      },
      {
        label: "TARGETS",
        heading: "정부가 제시한 목표",
        blocks: [
          { type: "p", text: "정부는 2030년까지 리튬·니켈·코발트·망간·흑연 등 10대 전략 핵심광물의 특정국 의존도를 50%대로 낮추고 재자원화 비율을 20%까지 확대한다는 목표를 제시하고 있습니다." },
          { type: "note", title: "수치를 인용할 때", text: "국내 발생량은 집계 기준에 따라 2023년 2,355개, 2024년 3,001개 등 다른 값이 제시되기도 합니다. 정책 수치는 공공기관 발표와 언론 보도에 근거하므로 인용 시 출처를 확인해야 합니다." },
        ],
      },
      {
        label: "GLOBAL",
        heading: "국경을 넘는 공급망",
        blocks: [
          { type: "p", text: "EU 배터리 규정은 재생원료 의무 비율과 함께 탄소발자국 신고, 공급망 실사 의무를 부과합니다. 해외 전처리 거점에서 블랙파우더를 만들어 국내로 들여오는 Hub & Spoke 구조는 원료 조달을 국경 밖으로 넓힌 사례입니다." },
          { type: "viz", name: "eu" },
        ],
      },
    ],
    refs: [14, 35],
    related: ["certification", "techno-economic", "recycling"],
  },

  /* ───────────────────────── D. 설계 ───────────────────────── */
  {
    no: "14",
    slug: "design-for-disassembly",
    layer: "design",
    title: "분해를 고려한 설계",
    en: "Design for Disassembly",
    tagline: "처리하기 쉽게, 처음부터",
    lead: "앞의 열세 주제는 이미 만들어진 배터리를 어떻게 처리할지 다룹니다. 이 주제는 순서가 거꾸로입니다. 처리하기 쉽도록 처음부터 설계하자는 접근이며, 트릴레마 논문이 새로운 공정 대신 해법으로 제시한 방향입니다.",
    coverage: "확장 후보",
    facts: [
      { value: "13 → 1", label: "사후 처리에서 사전 설계로", note: "14개 주제 중 유일한 '앞단' 주제" },
      { value: "조성", label: "화학으로 풀 수 없는 문제", note: "원료 불균일성" },
      { value: "여권 + 설계", label: "트릴레마 논문의 해법", note: "Zhang, 2026" },
    ],
    sections: [
      {
        label: "REVERSE ORDER",
        heading: "왜 순서를 뒤집어야 하는가",
        blocks: [
          { type: "p", text: "직접재생의 관문은 원료 조성의 불균일성이고, 자동화 해체의 관문은 팩마다 다른 설계입니다. 두 문제 모두 공정을 아무리 개선해도 사라지지 않습니다. 배터리가 만들어지는 순간에 이미 결정되기 때문입니다." },
          { type: "p", text: "트릴레마 논문이 새로운 화학 공정이 아니라 분해를 고려한 설계와 디지털 제품 여권을 해법으로 제시한 이유가 여기에 있습니다." },
        ],
      },
      {
        label: "DIRECTIONS",
        heading: "설계가 겨냥하는 지점",
        blocks: [
          {
            type: "steps",
            items: [
              { title: "해체 가능성", desc: "로봇이 셀 단위까지 분해할 수 있도록 체결 방식과 구조를 단순하게 만듭니다. (→ 07 자동화 해체)" },
              { title: "조성 식별", desc: "어떤 셀이 어떤 조성인지 바로 알 수 있게 해 같은 조성끼리 모을 수 있게 합니다. (→ 09 이력관리)" },
              { title: "소재 분리", desc: "활물질이 집전체에서 쉽게 떨어지도록 설계하면 직접재생의 최대 난제였던 박리가 쉬워집니다. (→ 03 재활용)" },
            ],
          },
        ],
      },
      {
        label: "CONNECTION",
        heading: "모든 주제가 여기로 돌아온다",
        blocks: [
          { type: "note", title: "제도적 조건", text: "기술이 성숙하더라도 원료 조성이 제각각이라는 문제는 화학으로 풀 수 없습니다. 다섯 가지 이론적 대안 모두 이 제도적 조건, 즉 추적 가능한 정보와 분해하기 쉬운 구조가 갖춰져야 제 성능을 냅니다." },
          { type: "p", text: "재사용과 재제조를 거친 배터리도 결국 재활용으로 옵니다. 앞의 경로가 활성화될수록 원료의 조성 이력은 더 복잡해지므로, 설계 단계의 배려가 갖는 가치는 시간이 갈수록 커집니다." },
        ],
      },
    ],
    refs: [35, 26, 19],
    related: ["traceability", "automated-disassembly", "recycling"],
  },
];

export const topicBySlug = (slug: string) => topics.find((t) => t.slug === slug);
export const topicsByLayer = (layer: LayerId) => topics.filter((t) => t.layer === layer);
