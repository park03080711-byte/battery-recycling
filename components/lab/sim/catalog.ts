/* 가상 ESP32 실험대 — 부품 · 핀 · 환경 · 규칙 카드 목록.
   값의 근거는 부품마다 evidence로 밝힌다: 실측(LAB 01에서 잰 값) · 데이터시트 · 가정. */

export type Evidence = "실측" | "데이터시트" | "가정";
/** adc 아날로그 입력 · onewire/io 주고받기(입력 전용 핀 불가) · in 디지털 입력 · out 출력 */
export type PinKind = "adc" | "onewire" | "io" | "in" | "out";

export type PinRole = { key: string; label: string; kind: PinKind; def: number };
export type PartId = "ds" | "ntc" | "shunt" | "div" | "relay" | "rgb" | "dtmod" | "dht" | "accel" | "tilt" | "vib" | "reed" | "pir" | "photo" | "btn" | "buzz";

export type Part = {
  id: PartId;
  /** 3D 장면의 부품 번호 */
  rig: number;
  name: string;
  kit: string;
  role: string;
  evidence: Evidence;
  group: "core" | "kit";
  pins: PinRole[];
  /** 끌어올림 저항이 달린 모듈인가 (GPIO12에 꽂으면 부팅 실패) */
  pullup?: boolean;
  note: string;
  /** 뺐을 때 생기는 일 */
  off: string;
};

export const PARTS: Part[] = [
  {
    id: "ds",
    rig: 4,
    name: "DS18B20",
    kit: "디지털 온도 센서",
    role: "셀 표면 온도",
    evidence: "실측",
    group: "core",
    pins: [{ key: "DQ", label: "데이터", kind: "onewire", def: 13 }],
    pullup: true,
    note: "0.125 °C 단위, 한 번 읽는 데 0.4초. 셀(220 Ω 저항)에 붙여 씀.",
    off: "셀 온도를 모르니 온도 규칙이 모두 멈춰요.",
  },
  {
    id: "ntc",
    rig: 5,
    name: "NTC 10 kΩ",
    kit: "아날로그 온도 센서",
    role: "주변 온도",
    evidence: "실측",
    group: "core",
    pins: [{ key: "S", label: "출력", kind: "adc", def: 36 }],
    note: "공기 중에 둠. 셀 온도에서 이 값을 빼 ‘주변보다 얼마나 더 뜨거운가’를 구함.",
    off: "DHT11이 있으면 그 값을 주변 온도로 쓰고, 없으면 켤 때 셀 온도를 기준으로 삼아요. 방이 더워지면 셀이 데워진 것처럼 보여요.",
  },
  {
    id: "shunt",
    rig: 6,
    name: "22 Ω 션트",
    kit: "저항 (키트 밖)",
    role: "히터 전류",
    evidence: "실측",
    group: "core",
    pins: [{ key: "A", label: "전압 읽기", kind: "adc", def: 32 }],
    note: "히터와 GND 사이. 저항 양끝 전압 ÷ 22 Ω = 전류. 평소 약 19.6 mA.",
    off: "전류를 모르니 과전류와 ‘가열 대비 온도 확인’을 못 해요.",
  },
  {
    id: "div",
    rig: 7,
    name: "10 kΩ + 10 kΩ",
    kit: "저항 (키트 밖)",
    role: "5 V 버스 전압",
    evidence: "실측",
    group: "core",
    pins: [{ key: "M", label: "가운데점", kind: "adc", def: 33 }],
    note: "5 V를 반으로 나눠 3.3 V 아래로 낮춰 읽음. 평소 약 4.6 V.",
    off: "버스 전압을 못 봐요.",
  },
  {
    id: "relay",
    rig: 2,
    name: "5 V 릴레이",
    kit: "5V 릴레이",
    role: "히터(충전) 차단기",
    evidence: "실측",
    group: "core",
    pins: [{ key: "IN", label: "제어", kind: "out", def: 22 }],
    note: "히터에 가는 전기를 끊고 잇는 스위치.",
    off: "히터가 전원에 바로 연결돼요. 위험을 알아도 끊을 방법이 없어요.",
  },
  {
    id: "rgb",
    rig: 8,
    name: "RGB LED",
    kit: "RGB 컬러 LED",
    role: "상태 표시등",
    evidence: "실측",
    group: "core",
    pins: [
      { key: "R", label: "빨강", kind: "out", def: 25 },
      { key: "G", label: "초록", kind: "out", def: 26 },
      { key: "B", label: "파랑", kind: "out", def: 27 },
    ],
    note: "정상 초록 · 주의 노랑 · 경고 빨강 · 위험 빨강 깜빡임 · 센서 고장 파랑 깜빡임 · 정비 중 노랑 깜빡임.",
    off: "현장에 상태가 안 보여요. 판정은 그대로 해요.",
  },
  /* ── 키트 부품 (데이터시트 기반) ── */
  {
    id: "dtmod",
    rig: 10,
    name: "온도 스위치 모듈",
    kit: "디지털 온도 센서 모듈",
    role: "셀 과열 스위치",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "DO", label: "디지털 출력", kind: "in", def: 14 }],
    pullup: true,
    note: "NTC + 비교기(LM393). 손잡이(가변저항)로 정한 온도를 넘으면 DO가 바뀜. 셀에 붙이며 반응은 약 8초 늦음. 절대 온도라 방 온도의 영향을 받음.",
    off: "온도 센서가 하나뿐이면, 그 센서가 고장 났을 때 대신할 것이 없어요.",
  },
  {
    id: "dht",
    rig: 11,
    name: "DHT11",
    kit: "DHT11 디지털 온도 습도 센서",
    role: "함체 공기 온습도",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "DATA", label: "데이터", kind: "io", def: 4 }],
    pullup: true,
    note: "1초에 한 번, 1 °C 단위(±2 °C). NTC가 없으면 주변 온도로 대신 써요. 습도는 2차의 결로 환경에서 써요.",
    off: "함체 공기 온습도를 몰라요.",
  },
  {
    id: "accel",
    rig: 12,
    name: "ADXL335 가속도",
    kit: "아날로그 가속도 센서",
    role: "충격 · 기울기",
    evidence: "데이터시트",
    group: "kit",
    pins: [
      { key: "X", label: "X축", kind: "adc", def: 34 },
      { key: "Y", label: "Y축", kind: "adc", def: 35 },
      { key: "Z", label: "Z축", kind: "adc", def: 39 },
    ],
    note: "±3 g, 1 g당 0.3 V. 아날로그 핀을 3개나 써서 ADC1 6개가 다 차요.",
    off: "충격 세기와 기울어진 각도를 숫자로 몰라요.",
  },
  {
    id: "tilt",
    rig: 13,
    name: "기울기 스위치",
    kit: "기울기 센서",
    role: "기울어짐 (켜짐/꺼짐)",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "in", def: 16 }],
    pullup: true,
    note: "속의 쇠구슬이 굴러 접점이 열림. 약 25° 넘게 기울면 바뀜. 각도는 모르고 핀 하나만 씀.",
    off: "랙이 기울어도 몰라요.",
  },
  {
    id: "vib",
    rig: 14,
    name: "진동 스위치",
    kit: "진동 센서",
    role: "충격 (켜짐/꺼짐)",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "in", def: 17 }],
    pullup: true,
    note: "스프링이 흔들려 접점이 잠깐 붙음. 약 0.5 g 넘는 흔들림에 반응. 세기는 모름.",
    off: "충격이 와도 몰라요.",
  },
  {
    id: "reed",
    rig: 15,
    name: "리드 스위치",
    kit: "리드 스위치",
    role: "함체 문 열림",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "in", def: 18 }],
    pullup: true,
    note: "문에 붙인 자석이 가까우면 접점이 붙음(닫힘). 문이 열리면 떨어짐.",
    off: "정비하려고 문을 열어도 충전이 계속돼요.",
  },
  {
    id: "pir",
    rig: 16,
    name: "인체감지 HC-SR501",
    kit: "적외선 인체감지 센서",
    role: "사람 접근",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "OUT", label: "출력", kind: "in", def: 19 }],
    note: "사람 몸의 적외선 변화를 감지. 켠 뒤 30~60초는 안정되지 않아 헛신호가 나와요. 한 번 감지하면 약 2.5초 유지.",
    off: "사람이 다가와도 몰라요.",
  },
  {
    id: "photo",
    rig: 17,
    name: "포토인터럽트",
    kit: "포토인터럽트",
    role: "냉각팬 회전",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "in", def: 21 }],
    pullup: true,
    note: "틈 사이를 팬 날개가 지나갈 때마다 펄스. 펄스가 끊기면 팬이 멈춘 것.",
    off: "팬이 멈춰도 온도가 오를 때까지 몰라요.",
  },
  {
    id: "btn",
    rig: 18,
    name: "푸시 버튼",
    kit: "리셋 버튼",
    role: "현장 차단 해제",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "in", def: 23 }],
    pullup: true,
    note: "사람이 장치 앞에서 확인하고 누르면 위험 잠금을 풀어요(온도가 내려간 뒤에만).",
    off: "잠금을 풀려면 PC에서 시리얼 명령 x를 보내야 해요.",
  },
  {
    id: "buzz",
    rig: 19,
    name: "능동 버저",
    kit: "피에조 버저",
    role: "경보음",
    evidence: "데이터시트",
    group: "kit",
    pins: [{ key: "S", label: "신호", kind: "out", def: 2 }],
    note: "켜면 바로 소리 나는 버저. 경고에서 짧게, 위험에서 빠르게 울려요. 깨끗한 핀이 모자라 기본 핀이 GPIO2(부팅 설정 핀)예요.",
    off: "현장에서 소리로 알 수 없어요.",
  },
];
export const CORE: PartId[] = ["ds", "ntc", "shunt", "div", "relay", "rgb"];

/** 2차에서 더할 것 */
export const LATER = ["결로 환경 (DHT11 습도)", "화재 마지막 단계 (불꽃 감지)", "바닥 누수 (초음파)", "가스 배출 (키트에 없음 · 가정)"];

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
      } else if (r.kind !== "in" && INPUT_ONLY.includes(g)) {
        add("err", `GPIO${g}는 입력 전용이라 ${r.kind === "out" ? "출력을 낼" : "데이터를 주고받을"} 수 없어요.`, true);
      } else if (r.kind === "in" && INPUT_ONLY.includes(g) && !p.pullup) {
        add("info", `GPIO${g}는 입력 전용이고 내부 끌어올림 저항이 없어요. 이 모듈은 출력을 직접 내서 괜찮아요.`, false);
      }
      if (g === 12 && p.pullup) add("err", `GPIO12는 켤 때 LOW여야 해요. 끌어올림 저항이 달린 ${p.name} 모듈을 꽂으면 플래시 전압이 잘못 잡혀 부팅하지 못해요.`, true, true);
      else if (g === 12) add("warn", "GPIO12는 켤 때 LOW여야 하는 핀(부팅 설정)이에요. 켤 때 HIGH가 걸리면 부팅에 실패해요.", false);
      if (g === 0 || g === 2 || g === 5 || g === 15) add("warn", `GPIO${g}는 켤 때 상태를 보는 부팅 설정 핀이에요. 동작은 하지만 피하는 게 좋아요.${g === 2 ? " 보드의 파란 LED도 같이 켜져요." : ""}`, false);
      if (g === 1 || g === 3) add("warn", `GPIO${g}는 USB 시리얼(${g === 1 ? "TX" : "RX"})과 겹쳐 시리얼 모니터가 깨져요.`, false);
      if (g === 13 && p.id === "ds") add("info", "실험 때 화면 라이브러리 기본 설정이 GPIO13을 화면 데이터선으로 써서 이 센서가 nan을 냈어요. 화면을 함께 쓰면 설정을 꼭 바꾸세요.", false);
    }
  }
  return out;
}

/* ── 환경 ── */
export type Expect = "trip" | "quiet" | "cause" | "fast" | "stop" | "keep";
export type EnvId = "heat" | "room" | "sensor" | "fan" | "short" | "shock" | "door" | "wifi";
export type Env = {
  id: EnvId;
  group: "temp" | "site" | "comm";
  name: string;
  tag: string;
  story: string;
  expect: Expect;
  expectText: string;
  duration: number;
  /** 히터 켜기 명령(사람이 'h'를 입력한 것과 같음) */
  heaterAt: number | null;
  /** 충전 세기 (히터 평균 전력 비율). 1 = LAB 01과 같음 */
  load: number;
  /** 사건이 일어나는 시각 */
  event?: number;
  eventLabel?: string;
  variants?: { id: string; name: string; text: string }[];
};

export const ENVS: Env[] = [
  {
    id: "heat",
    group: "temp",
    name: "셀 내부 발열",
    tag: "기본 · 실측 재현",
    story: "충전 중인 셀 하나가 계속 데워집니다. LAB 01 판정 실험 2회차와 같은 조건이에요.",
    expect: "trip",
    expectText: "위험 전에 경보하고, 위험에서 히터를 끊어야 함",
    duration: 200,
    heaterAt: 12,
    load: 1,
  },
  {
    id: "room",
    group: "temp",
    name: "방 온도 변화",
    tag: "잘못된 경보 시험",
    story: "냉방이 멈춰 방이 90초 동안 23 °C에서 27.5 °C로 오릅니다. 셀은 아무 이상이 없어요.",
    expect: "quiet",
    expectText: "셀은 정상이니 아무 경보도 내면 안 됨",
    duration: 360,
    heaterAt: null,
    load: 0,
    event: 15,
    eventLabel: "냉방 멈춤",
  },
  {
    id: "sensor",
    group: "temp",
    name: "온도 센서 이상",
    tag: "센서 고장 시험",
    story: "셀은 기본 환경처럼 데워지는데, 셀 온도 센서에 문제가 생깁니다.",
    expect: "trip",
    expectText: "센서가 고장 나도 셀을 지켜야 함",
    duration: 200,
    heaterAt: 12,
    load: 1,
    variants: [
      { id: "cut", name: "선 빠짐", text: "45초에 DS18B20 선이 빠짐 (LAB 01 발열 1회의 251초 상황)" },
      { id: "contact", name: "접촉 불량", text: "처음부터 셀에 덜 붙어 늦고 낮게 읽힘 (LAB 01 발열 2회처럼)" },
    ],
  },
  {
    id: "fan",
    group: "site",
    name: "냉각팬 멈춤",
    tag: "원인 찾기 시험",
    story: "가벼운 충전 중이라 냉각팬이 돌면 셀이 +1.8 °C에서 버팁니다. 80초에 팬이 멈춰요.",
    expect: "cause",
    expectText: "팬이 멈춘 걸 바로 알아채고, 셀이 뜨거워지기 전에 충전을 멈춰야 함",
    duration: 300,
    heaterAt: 12,
    load: 0.28,
    event: 80,
    eventLabel: "팬 멈춤",
  },
  {
    id: "short",
    group: "site",
    name: "과전류 (부분 단락)",
    tag: "빠른 차단 시험",
    story: "40초에 히터 저항 일부가 녹아 붙어 220 Ω이 100 Ω처럼 됩니다. 전류가 약 37 mA로 뛰고 열이 1.7배로 늘어요.",
    expect: "fast",
    expectText: "단락 뒤 5초 안에 끊어야 함",
    duration: 200,
    heaterAt: 12,
    load: 1,
    event: 40,
    eventLabel: "단락",
  },
  {
    id: "shock",
    group: "site",
    name: "충격 · 기울어짐",
    tag: "지진 · 운송 시험",
    story: "가벼운 충전 중 50초에 2.8 g 충격이 오고, 랙이 30° 기울어진 채로 남습니다. 셀이 다쳤을 수 있어요.",
    expect: "stop",
    expectText: "충격 뒤 5초 안에 충전을 멈추고 알려야 함",
    duration: 160,
    heaterAt: 12,
    load: 0.28,
    event: 50,
    eventLabel: "충격",
  },
  {
    id: "door",
    group: "site",
    name: "문 열림 · 사람 접근",
    tag: "정비 안전 시험",
    story: "가벼운 충전 중 70초에 함체 문이 열리고 정비자가 다가옵니다. 130초에 문이 닫혀요.",
    expect: "stop",
    expectText: "문이 열리면 5초 안에 충전을 멈추고 ‘정비 중’으로 표시해야 함",
    duration: 180,
    heaterAt: 12,
    load: 0.28,
    event: 70,
    eventLabel: "문 열림",
  },
  {
    id: "wifi",
    group: "comm",
    name: "Wi-Fi 끊김",
    tag: "관제 통신 시험 · 실측 기반",
    story: "셀이 기본 환경처럼 데워지는 중에 40초부터 63초 동안 공유기가 꺼집니다. 위험 판정은 Wi-Fi가 끊긴 사이에 와요. 통신 값은 LAB 01 통신 실험에서 잰 것이에요.",
    expect: "keep",
    expectText: "Wi-Fi가 끊겨도 스스로 차단하고, PC로 보낼 기록은 하나도 잃지 않아야 함",
    duration: 200,
    heaterAt: 12,
    load: 1,
    event: 40,
    eventLabel: "Wi-Fi 끊김",
  },
];
/** Wi-Fi 끊김 환경에서 공유기가 꺼져 있는 구간 */
export const AP_DOWN: [number, number] = [40, 103];

export const EXPECT_LABEL: Record<Expect, string> = { trip: "차단해야 함", quiet: "아무것도 하면 안 됨", cause: "원인 알림 + 정지", fast: "5초 안 차단", stop: "5초 안 충전 정지", keep: "차단 + 기록 보존" };

/* ── 규칙 카드 ── */
export type Param = { key: string; label: string; unit: string; min: number; max: number; step: number; def: number };
export type CardId = "dt" | "slope" | "eta" | "cur" | "volt" | "fault" | "heatcheck" | "dtsw" | "shock" | "tiltA" | "tiltSw" | "vib" | "door" | "person" | "fan" | "buffer";
export type Card = {
  id: CardId;
  name: string;
  needs: PartId[];
  combo?: boolean;
  group: "temp" | "elec" | "site" | "comm";
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
    group: "temp",
    on: true,
    out: "주의 · 경고 · 위험",
    text: "셀이 주변보다 얼마나 더 뜨거운가(ΔT). 주변은 NTC, 없으면 DHT11, 둘 다 없으면 켤 때 셀 온도를 기준으로 삼아요.",
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
    group: "temp",
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
    group: "temp",
    on: true,
    out: "경고",
    text: "지금 속도로 위험 기준까지 남은 시간이 기준보다 짧으면. 초반 과민 반응을 막으려고 주의 단계 이상일 때만 봐요.",
    params: [{ key: "e", label: "남은 시간", unit: "초", min: 5, max: 120, step: 5, def: 30 }],
  },
  {
    id: "fault",
    name: "센서 고장 → 히터 정지",
    needs: ["ds"],
    group: "temp",
    on: true,
    out: "경고 + 히터 정지",
    text: "온도 센서 값이 안 들어오면(nan) 경고를 내고 히터를 끕니다.",
    params: [],
  },
  {
    id: "dtsw",
    name: "온도 스위치",
    needs: ["dtmod"],
    group: "temp",
    on: true,
    out: "위험 (차단)",
    text: "모듈의 비교기가 정한 온도를 넘었다고 알리면 바로 위험. 계산 없이 켜짐/꺼짐만 보므로 DS18B20이 고장 나도 동작해요.",
    params: [{ key: "t", label: "동작 온도", unit: "°C", min: 24, max: 40, step: 0.5, def: 28 }],
  },
  {
    id: "heatcheck",
    name: "가열 대비 온도 확인",
    needs: ["ds", "shunt"],
    combo: true,
    group: "temp",
    on: false,
    out: "경고 + 히터 정지",
    text: "히터 전류가 흐른 지 일정 시간이 지나도 ΔT가 너무 작으면, 셀이 안 데워지는 게 아니라 센서가 셀을 못 느끼는 것으로 보고 멈춥니다.",
    params: [
      { key: "t", label: "가열 후", unit: "초", min: 20, max: 120, step: 5, def: 60 },
      { key: "m", label: "ΔT 최소", unit: "°C", min: 0.5, max: 4, step: 0.1, def: 2 },
    ],
  },
  {
    id: "cur",
    name: "과전류",
    needs: ["shunt"],
    group: "elec",
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
    group: "elec",
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
    id: "fan",
    name: "냉각팬 멈춤",
    needs: ["photo"],
    group: "site",
    on: true,
    out: "경고 + 충전 정지",
    text: "팬 날개 펄스가 정한 시간 동안 안 들어오면.",
    params: [{ key: "s", label: "펄스 없음", unit: "초", min: 0.5, max: 10, step: 0.5, def: 2 }],
  },
  {
    id: "shock",
    name: "충격 (가속도)",
    needs: ["accel"],
    group: "site",
    on: true,
    out: "경고 + 충전 정지",
    text: "가속도가 평소(1 g)에서 정한 값보다 크게 벗어나면. 30초 동안 기억해요.",
    params: [{ key: "g", label: "충격", unit: "g", min: 0.3, max: 3, step: 0.1, def: 1.5 }],
  },
  {
    id: "tiltA",
    name: "기울어짐 (가속도)",
    needs: ["accel"],
    group: "site",
    on: true,
    out: "경고 + 충전 정지",
    text: "중력 방향으로 계산한 기울기가 정한 각도를 넘으면.",
    params: [{ key: "a", label: "각도", unit: "°", min: 5, max: 60, step: 1, def: 20 }],
  },
  {
    id: "tiltSw",
    name: "기울기 스위치",
    needs: ["tilt"],
    group: "site",
    on: true,
    out: "경고 + 충전 정지",
    text: "스위치가 1초 넘게 기울어짐을 알리면. 각도는 부품이 정해요(약 25°).",
    params: [],
  },
  {
    id: "vib",
    name: "진동 스위치",
    needs: ["vib"],
    group: "site",
    on: true,
    out: "주의",
    text: "흔들림이 감지되면 10초 동안 주의. 세기를 몰라 차단까지는 하지 않아요.",
    params: [],
  },
  {
    id: "door",
    name: "문 열림 → 정비 모드",
    needs: ["reed"],
    group: "site",
    on: true,
    out: "주의(정비) + 충전 정지",
    text: "문이 열리면 경보 대신 ‘정비 중’으로 표시하고 충전을 멈춰요.",
    params: [],
  },
  {
    id: "person",
    name: "사람 접근 → 정비 모드",
    needs: ["pir"],
    group: "site",
    on: true,
    out: "주의(정비) + 충전 정지",
    text: "사람이 감지되면 정비 모드. 센서가 켠 직후 헛신호를 내므로 처음 몇 초는 무시해요.",
    params: [{ key: "i", label: "켠 뒤 무시", unit: "초", min: 0, max: 90, step: 5, def: 45 }],
  },
  {
    id: "buffer",
    name: "끊김 대비 버퍼 · 재전송",
    needs: [],
    group: "comm",
    on: true,
    out: "기록 보존",
    text: "1초마다 PC로 보내는 기록을, Wi-Fi가 끊긴 동안 메모리에 쌓아 두었다가 다시 연결되면 0.1초마다 정한 개수씩 보내요. 가득 차면 가장 오래된 것부터 버려요. 끄면 끊긴 동안의 기록은 사라져요.",
    params: [
      { key: "n", label: "버퍼", unit: "개", min: 10, max: 600, step: 10, def: 600 },
      { key: "b", label: "재전송", unit: "개/0.1초", min: 1, max: 20, step: 1, def: 5 },
    ],
  },
];

export const defaultParams = () => Object.fromEntries(CARDS.flatMap((c) => c.params.map((p) => [`${c.id}.${p.key}`, p.def]))) as Record<string, number>;
export const defaultPins = () => Object.fromEntries(PARTS.flatMap((p) => p.pins.map((r) => [`${p.id}.${r.key}`, r.def]))) as Record<string, number>;
export const defaultCards = () => Object.fromEntries(CARDS.map((c) => [c.id, c.on])) as Record<CardId, boolean>;
