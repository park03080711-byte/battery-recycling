/* 가상 ESP32 실험대 — 부품 · 핀 · 환경 · 규칙 카드 목록.
   값의 근거는 부품마다 evidence로 밝힌다: 실측(LAB 01에서 잰 값) · 데이터시트 · 가정. */

export type Evidence = "실측" | "데이터시트" | "가정";
export type PinKind = "adc" | "onewire" | "out";

export type PinRole = { key: string; label: string; kind: PinKind; def: number };
export type PartId = "ds" | "ntc" | "shunt" | "div" | "relay" | "rgb";

export type Part = {
  id: PartId;
  /** LAB 01 3D 장면의 부품 번호 */
  rig: number;
  name: string;
  kit: string;
  role: string;
  evidence: Evidence;
  pins: PinRole[];
  /** 끌어올림 저항이 달린 모듈인가 (GPIO12에 꽂으면 부팅 실패) */
  pullup?: boolean;
  note: string;
};

export const PARTS: Part[] = [
  {
    id: "ds",
    rig: 4,
    name: "DS18B20",
    kit: "디지털 온도 센서",
    role: "셀 표면 온도",
    evidence: "실측",
    pins: [{ key: "DQ", label: "데이터", kind: "onewire", def: 13 }],
    pullup: true,
    note: "0.125 °C 단위, 한 번 읽는 데 0.4초. 셀(220 Ω 저항)에 붙여 씀.",
  },
  {
    id: "ntc",
    rig: 5,
    name: "NTC 10 kΩ",
    kit: "아날로그 온도 센서",
    role: "주변 온도",
    evidence: "실측",
    pins: [{ key: "S", label: "출력", kind: "adc", def: 36 }],
    note: "공기 중에 둠. 셀 온도에서 이 값을 빼 ‘주변보다 얼마나 더 뜨거운가’를 구함.",
  },
  {
    id: "shunt",
    rig: 6,
    name: "22 Ω 션트",
    kit: "저항 (키트 밖)",
    role: "히터 전류",
    evidence: "실측",
    pins: [{ key: "A", label: "전압 읽기", kind: "adc", def: 32 }],
    note: "히터와 GND 사이. 저항 양끝 전압 ÷ 22 Ω = 전류. 평소 약 19.6 mA.",
  },
  {
    id: "div",
    rig: 7,
    name: "10 kΩ + 10 kΩ",
    kit: "저항 (키트 밖)",
    role: "5 V 버스 전압",
    evidence: "실측",
    pins: [{ key: "M", label: "가운데점", kind: "adc", def: 33 }],
    note: "5 V를 반으로 나눠 3.3 V 아래로 낮춰 읽음. 평소 약 4.6 V.",
  },
  {
    id: "relay",
    rig: 2,
    name: "5 V 릴레이",
    kit: "5V 릴레이",
    role: "히터 차단기",
    evidence: "실측",
    pins: [{ key: "IN", label: "제어", kind: "out", def: 22 }],
    note: "없으면 히터가 전원에 바로 물려 있어, 위험을 알아도 끊지 못함.",
  },
  {
    id: "rgb",
    rig: 8,
    name: "RGB LED",
    kit: "RGB 컬러 LED",
    role: "상태 표시등",
    evidence: "실측",
    pins: [
      { key: "R", label: "빨강", kind: "out", def: 25 },
      { key: "G", label: "초록", kind: "out", def: 26 },
      { key: "B", label: "파랑", kind: "out", def: 27 },
    ],
    note: "정상 초록 · 주의 노랑 · 경고 빨강 · 위험 빨강 깜빡임 · 센서 고장 파랑 깜빡임.",
  },
];

/** 1-2에서 더할 키트 부품 (지금은 목록에만 보임) */
export const SOON = ["디지털 온도 센서 모듈", "DHT11 온습도", "아날로그 가속도", "기울기", "진동", "리드 스위치", "적외선 인체감지", "포토인터럽트", "리셋 버튼", "능동 버저"];

/* ── ESP32 DevKit 38핀 GPIO ── */
export const GPIOS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39];
export const ADC1 = [32, 33, 34, 35, 36, 39];
export const ADC2 = [0, 2, 4, 12, 13, 14, 15, 25, 26, 27];
export const INPUT_ONLY = [34, 35, 36, 39];
export const FLASH = [6, 7, 8, 9, 10, 11];

export type PinIssue = { part: PartId; pin: string; gpio: number; sev: "err" | "warn" | "info"; msg: string; breaks: boolean; bootFail?: boolean };

/** 핀 배정 검사 — 실제 ESP32 제약 그대로. breaks=true면 그 부품은 모의실험에서 동작하지 않는다. */
export function checkPins(present: Set<PartId>, pins: Record<string, number>): PinIssue[] {
  const out: PinIssue[] = [];
  const used = new Map<number, string>();
  for (const p of PARTS) {
    if (!present.has(p.id)) continue;
    for (const r of p.pins) {
      const g = pins[`${p.id}.${r.key}`] ?? r.def;
      const add = (sev: PinIssue["sev"], msg: string, breaks: boolean, bootFail = false) => out.push({ part: p.id, pin: r.key, gpio: g, sev, msg, breaks, bootFail });
      const other = used.get(g);
      if (other) add("err", `GPIO${g}을 ${other}와 같이 쓰고 있어요. 한 핀에는 한 부품만.`, true);
      used.set(g, `${p.name}${p.pins.length > 1 ? ` ${r.label}` : ""}`);
      if (FLASH.includes(g)) {
        add("err", `GPIO${g}는 보드 안 플래시 메모리에 연결돼 있어 쓸 수 없어요.`, true);
        continue;
      }
      if (r.kind === "adc") {
        if (ADC2.includes(g)) add("err", `Wi-Fi를 켜면 ADC2(GPIO${g})는 값을 못 읽어요. ADC1(32 · 33 · 34 · 35 · 36 · 39)로 옮기세요.`, true);
        else if (!ADC1.includes(g)) add("err", `GPIO${g}에는 아날로그 입력(ADC)이 없어요.`, true);
      } else if (INPUT_ONLY.includes(g)) {
        add("err", `GPIO${g}는 입력 전용이라 ${r.kind === "out" ? "출력을 낼" : "데이터를 주고받을"} 수 없어요.`, true);
      }
      if (g === 12 && p.pullup) add("err", `GPIO12는 켤 때 LOW여야 해요. 끌어올림 저항이 달린 ${p.name} 모듈을 꽂으면 플래시 전압이 잘못 잡혀 부팅하지 못해요.`, true, true);
      else if (g === 12) add("warn", "GPIO12는 켤 때 LOW여야 하는 핀(부팅 설정)이에요. 켤 때 HIGH가 걸리면 부팅에 실패해요.", false);
      if (g === 0 || g === 2 || g === 5 || g === 15) add("warn", `GPIO${g}는 켤 때 상태를 보는 부팅 설정 핀이에요. 동작은 하지만 피하는 게 좋아요.`, false);
      if (g === 1 || g === 3) add("warn", `GPIO${g}는 USB 시리얼(${g === 1 ? "TX" : "RX"})과 겹쳐 시리얼 모니터가 깨져요.`, false);
      if (g === 13 && p.id === "ds") add("info", "실험 때 화면 라이브러리 기본 설정이 GPIO13을 화면 데이터선으로 써서 이 센서가 nan을 냈어요. 화면을 함께 쓰면 설정을 꼭 바꾸세요.", false);
    }
  }
  return out;
}

/* ── 환경 ── */
export type Expect = "trip" | "quiet" | "stop";
export type EnvId = "heat" | "room" | "sensor";
export type Env = {
  id: EnvId;
  name: string;
  tag: string;
  story: string;
  expect: Expect;
  expectText: string;
  duration: number;
  /** 히터 켜기 명령(사람이 'h'를 입력한 것과 같음) */
  heaterAt: number | null;
  variants?: { id: string; name: string; text: string }[];
};

export const ENVS: Env[] = [
  {
    id: "heat",
    name: "셀 내부 발열",
    tag: "기본 · 실측 재현",
    story: "충전 중인 셀 하나가 계속 데워집니다. LAB 01 판정 실험 2회차와 같은 조건이에요.",
    expect: "trip",
    expectText: "위험 전에 경보하고, 위험에서 히터를 끊어야 함",
    duration: 200,
    heaterAt: 12,
  },
  {
    id: "room",
    name: "방 온도 변화",
    tag: "잘못된 경보 시험",
    story: "냉방이 멈춰 방이 90초 동안 23 °C에서 27.5 °C로 오릅니다. 셀은 아무 이상이 없어요.",
    expect: "quiet",
    expectText: "셀은 정상이니 아무 경보도 내면 안 됨",
    duration: 360,
    heaterAt: null,
  },
  {
    id: "sensor",
    name: "온도 센서 이상",
    tag: "센서 고장 시험",
    story: "셀은 기본 환경처럼 데워지는데, 셀 온도 센서에 문제가 생깁니다.",
    expect: "trip",
    expectText: "센서가 고장 나도 셀을 지켜야 함",
    duration: 200,
    heaterAt: 12,
    variants: [
      { id: "cut", name: "선 빠짐", text: "45초에 DS18B20 선이 빠짐 (LAB 01 발열 1회의 251초 상황)" },
      { id: "contact", name: "접촉 불량", text: "처음부터 셀에 덜 붙어 늦고 낮게 읽힘 (LAB 01 발열 2회처럼)" },
    ],
  },
];

export const EXPECT_LABEL: Record<Expect, string> = { trip: "차단해야 함", quiet: "아무것도 하면 안 됨", stop: "경보 + 히터 정지" };

/* ── 규칙 카드 ── */
export type Param = { key: string; label: string; unit: string; min: number; max: number; step: number; def: number };
export type CardId = "dt" | "slope" | "eta" | "cur" | "volt" | "fault" | "heatcheck";
export type Card = {
  id: CardId;
  name: string;
  needs: PartId[];
  combo?: boolean;
  /** 처음에 켜져 있나 */
  on: boolean;
  out: string;
  text: string;
  params: Param[];
};

export const CARDS: Card[] = [
  {
    id: "dt",
    name: "온도차 단계",
    needs: ["ds"],
    on: true,
    out: "주의 · 경고 · 위험",
    text: "셀이 주변보다 얼마나 더 뜨거운가(ΔT). 주변 센서가 없으면 켤 때 셀 온도를 기준으로 삼아요.",
    params: [
      { key: "c", label: "주의", unit: "°C", min: 0.5, max: 6, step: 0.1, def: 2 },
      { key: "w", label: "경고", unit: "°C", min: 1, max: 8, step: 0.1, def: 3 },
      { key: "d", label: "위험", unit: "°C", min: 1.5, max: 10, step: 0.1, def: 4 },
    ],
  },
  {
    id: "slope",
    name: "상승 속도 조기 경보",
    needs: ["ds"],
    on: true,
    out: "주의",
    text: "최근 10초 기울기가 기준을 넘는 상태가 일정 시간 이어지면.",
    params: [
      { key: "s", label: "속도", unit: "°C/s", min: 0.005, max: 0.2, step: 0.005, def: 0.03 },
      { key: "h", label: "지속", unit: "초", min: 1, max: 30, step: 1, def: 10 },
    ],
  },
  {
    id: "eta",
    name: "위험 도달 예측",
    needs: ["ds"],
    on: true,
    out: "경고",
    text: "지금 속도로 위험 기준까지 남은 시간이 기준보다 짧으면. 초반 과민 반응을 막으려고 주의 단계 이상일 때만 봐요.",
    params: [{ key: "e", label: "남은 시간", unit: "초", min: 5, max: 120, step: 5, def: 30 }],
  },
  {
    id: "cur",
    name: "과전류",
    needs: ["shunt"],
    on: true,
    out: "주의 · 경고 · 위험",
    text: "히터 전류가 평소(약 19.6 mA)보다 크면.",
    params: [
      { key: "c", label: "주의", unit: "mA", min: 20, max: 60, step: 0.5, def: 23 },
      { key: "w", label: "경고", unit: "mA", min: 20, max: 60, step: 0.5, def: 27 },
      { key: "d", label: "위험", unit: "mA", min: 20, max: 60, step: 0.5, def: 32 },
    ],
  },
  {
    id: "volt",
    name: "전압 이상",
    needs: ["div"],
    on: true,
    out: "주의 · 경고",
    text: "5 V 버스 전압이 너무 낮거나 높으면.",
    params: [
      { key: "c", label: "주의 아래", unit: "V", min: 3.5, max: 4.6, step: 0.05, def: 4.3 },
      { key: "w", label: "경고 아래", unit: "V", min: 3.0, max: 4.5, step: 0.05, def: 4.0 },
      { key: "h", label: "경고 위", unit: "V", min: 5.0, max: 6.0, step: 0.05, def: 5.4 },
    ],
  },
  {
    id: "fault",
    name: "센서 고장 → 히터 정지",
    needs: ["ds"],
    on: true,
    out: "경고 + 히터 정지",
    text: "온도 센서 값이 안 들어오면(nan) 경고를 내고 히터를 끕니다.",
    params: [],
  },
  {
    id: "heatcheck",
    name: "가열 대비 온도 확인",
    needs: ["ds", "shunt"],
    combo: true,
    on: false,
    out: "경고 + 히터 정지",
    text: "히터 전류가 흐른 지 일정 시간이 지나도 ΔT가 너무 작으면, 셀이 안 데워지는 게 아니라 센서가 셀을 못 느끼는 것으로 보고 멈춥니다.",
    params: [
      { key: "t", label: "가열 후", unit: "초", min: 20, max: 120, step: 5, def: 60 },
      { key: "m", label: "ΔT 최소", unit: "°C", min: 0.5, max: 4, step: 0.1, def: 2 },
    ],
  },
];

export const defaultParams = () => Object.fromEntries(CARDS.flatMap((c) => c.params.map((p) => [`${c.id}.${p.key}`, p.def]))) as Record<string, number>;
export const defaultPins = () => Object.fromEntries(PARTS.flatMap((p) => p.pins.map((r) => [`${p.id}.${r.key}`, r.def]))) as Record<string, number>;
export const defaultCards = () => Object.fromEntries(CARDS.map((c) => [c.id, c.on])) as Record<CardId, boolean>;
