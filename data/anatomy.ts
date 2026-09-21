/**
 * 배터리팩 해부도 데이터.
 * 이미지는 Blender(bpy)로 직접 모델링·렌더링한 예시 팩이다 (특정 제조사 제품 아님).
 * 좌표(%)는 렌더 카메라에서 3D 기준점을 투영해 얻은 값 — data/anatomy-coords.json
 */
import C from "./anatomy-coords.json";

type XY = [number, number];
const c = C as unknown as Record<string, Record<string, XY>>;

export const ANAT_IMG = "/anatomy";
export const RATIO = { w: 1920, h: 1080 };

export interface Note {
  at: XY;
  title: string;
  text: string;
}

export interface Part {
  id: "cell" | "module" | "bms" | "case";
  no: string;
  label: string;
  en: string;
  hot: XY;
  summary: string;
  detail: {
    img: string;
    title: string;
    lead: string;
    notes: Note[];
    topics: string[];
  };
}

export const parts: Part[] = [
  {
    id: "cell",
    no: "01",
    label: "파우치 셀",
    en: "POUCH CELL",
    hot: c.overview.cell,
    summary: "에너지가 저장되는 가장 작은 단위",
    detail: {
      img: "detail_cell",
      title: "파우치 셀 — 에너지가 저장되는 곳",
      lead: "양극·분리막·음극을 여러 겹 쌓고 전해액과 함께 알루미늄 파우치 필름으로 밀봉한 셀입니다. 재활용이 회수하려는 리튬·니켈·코발트·망간은 대부분 양극 코팅층에 들어 있습니다.",
      notes: [
        { at: c.cell.cathode, title: "양극 · NCM", text: "알루미늄 박 위에 니켈·코발트·망간 산화물을 입힌 층입니다. 셀 원가와 재활용 회수 가치의 중심입니다." },
        { at: c.cell.sep2, title: "분리막", text: "양극과 음극이 닿지 않게 막는 다공성 고분자 필름입니다. 리튬 이온만 통과시킵니다." },
        { at: c.cell.anode, title: "음극 · 흑연", text: "구리 박 위에 흑연을 입힌 층입니다. 흑연은 회수 가치가 낮아 재활용 공정에서 부산물로 남는 경우가 많습니다." },
      ],
      topics: ["recycling", "soh-diagnosis", "byproduct-recovery"],
    },
  },
  {
    id: "module",
    no: "02",
    label: "모듈",
    en: "MODULE",
    hot: c.overview.module,
    summary: "셀을 묶어 교체하는 단위",
    detail: {
      img: "detail_module",
      title: "모듈 — 셀을 묶는 단위",
      lead: "셀 24장을 2병렬·12직렬로 연결하고 엔드플레이트와 밴드로 눌러 묶은 덩어리입니다. 재제조에서는 열화가 심한 모듈만 골라 이 단위로 교체합니다.",
      notes: [
        { at: c.module.busbar, title: "버스바 · 레이저 용접", text: "셀 탭을 버스바에 용접해 전기적으로 잇습니다. 해체할 때 가장 끊어 내기 까다로운 접합부입니다." },
        { at: c.module.endplate, title: "엔드플레이트 · 밴드", text: "충방전 때 조금씩 부푸는 셀을 일정한 압력으로 눌러 줍니다." },
        { at: c.module.cmu, title: "셀 감시 보드", text: "셀 전압과 온도를 측정해 배선으로 BMS에 보냅니다." },
      ],
      topics: ["remanufacturing", "reuse", "automated-disassembly"],
    },
  },
  {
    id: "bms",
    no: "03",
    label: "BMS · 차단 장치",
    en: "BMS · BDU",
    hot: c.overview.bms,
    summary: "팩의 상태를 기록하는 두뇌",
    detail: {
      img: "detail_bms",
      title: "BMS · 차단 장치 — 팩의 두뇌와 스위치",
      lead: "BMS는 모든 셀의 전압·전류·온도를 기록하며 충전 상태와 수명을 계산합니다. 이 운행 기록이 사용후 배터리 잔존수명 진단과 이력관리의 출발점이 됩니다.",
      notes: [
        { at: c.bms.board, title: "BMS 마스터 보드", text: "모듈마다 올라간 감시 보드의 데이터를 모아 충전 상태(SOC)와 건강 상태(SOH)를 추정합니다." },
        { at: c.bms.contactor, title: "메인 릴레이", text: "이상이 감지되면 고전압 회로를 끊습니다. 해체 전에는 방전과 차단 상태를 반드시 확인해야 합니다." },
        { at: c.bms.connector, title: "고전압 커넥터", text: "차량과 팩을 잇는 출구입니다. 주황색 피복은 고전압 부품이라는 표시입니다." },
      ],
      topics: ["soh-diagnosis", "traceability", "safety"],
    },
  },
  {
    id: "case",
    no: "04",
    label: "트레이 · 냉각판",
    en: "TRAY · COOLING",
    hot: c.overview.case,
    summary: "구조를 받치고 열을 빼내는 바닥",
    detail: {
      img: "detail_cool",
      title: "트레이 · 냉각판 — 구조와 열 관리",
      lead: "알루미늄 트레이가 모듈을 받치고 충격을 견디며, 바닥의 냉각판으로 냉각수가 흐르며 열을 빼냅니다. 한 자리를 비운 것은 모듈을 들어낸 정비 상태를 보여 주기 위해서입니다.",
      notes: [
        { at: c.cool.channel, title: "냉각 유로", text: "냉각판 속을 지그재그로 흐르는 냉각수가 셀의 열을 가져갑니다." },
        { at: c.cool.pad, title: "갭필러", text: "모듈과 냉각판 사이 틈을 메워 열을 전달합니다. 접착형을 쓰면 모듈을 떼어 내기 어려워집니다." },
        { at: c.cool.tray, title: "트레이 · 크로스멤버", text: "볼트로 체결한 구조는 분해가 쉽고, 접착·용접한 구조는 해체 비용을 높입니다." },
      ],
      topics: ["design-for-disassembly", "safety", "automated-disassembly"],
    },
  },
];

export const partById = (id: string | null) => parts.find((p) => p.id === id) ?? null;
