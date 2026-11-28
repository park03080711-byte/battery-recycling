/* 가상 ESP32 실험대 — 계산 모듈 (화면과 분리).
   ① 환경 모델: 방 온도 · 습도 · 셀 온도 · 전류 · 전압 · 바닥 물 · 문 · 충격의 '실제 값'
   ② 센서 모델: 센서마다 다르게 읽음 (반응 속도 · 잡음 · 해상도 · 고장)
   ③ 가상 펌웨어: LAB 01의 ess_stage3.ino 판정 부분을 그대로 옮기고, 키트 부품 규칙을 같은 방식으로 더함 (0.5초마다)
   셀 발열은 LAB 01 판정 실험 2회차 기록에 맞춘 1차 모델: 최종 상승 K = 6.5 °C, 가열 시간상수 66 s.
   (펌웨어의 지수 평활까지 거친 값이 기록과 맞도록 맞춤. 잡음 40가지로 돌린 평균이 주의 13.8 · 경고 26.4 · 위험 64.7초, 실측은 11 · 27 · 65초)
   냉각 시간상수 220 s는 발열 실험 1 · 3회 평균. 키트 부품 값은 데이터시트 기반. */
import { AP_DOWN, CARDS, ENVS, PARTS, cardUsable, checkPins, defaultFlags, type CardId, type EnvId, type Flags, type PartId, type PinIssue } from "./catalog";
import { comm as commRows } from "../../../data/lab/essData";

/** LAB 01 통신 실험에서 잰 왕복 지연 (ms) — 여기서 하나씩 뽑아 쓴다 */
/** 왕복 지연: LAB 01에서 연결이 이어져 있던 동안 잰 435개 (LAB 01 그림 8과 같은 기준 — 끊긴 뒤 몰아 보낸 기록은 버퍼 모형이 따로 다룬다) */
const RTT = commRows.filter((r) => r[1] <= 2 && r[4] > 0).map((r) => r[4]);

export const MODEL = {
  K: 6.5,
  tauHeat: 66,
  tauCool: 220,
  tauCellAmb: 220,
  tauNtc: 20,
  tauDs: 0.1,
  contactGain: 0.73,
  contactTau: 25,
  Ta0: 23,
  ntcBias: -0.55,
  Rheat: 211,
  Rshort: 100,
  tauMod: 8,
  tauDht: 10,
  dhtBias: 1.0,
  /** 함체 공기: 평소 23 °C · 50 % */
  rh0: 0.5,
  /** 결로 환경의 바깥 공기 (여름철 가정) · 섞이는 시간상수 */
  outT: 31,
  outRH: 0.8,
  tauAir: 30,
  /** 초음파: 물받이 바닥까지 15 cm · 한 번 잴 때 잡음 1 mm (데이터시트 분해능 3 mm 안쪽) */
  sonarH: 150,
  sonarNoise: 1.0,
  /** 누수: 60초부터 2분 동안 20 mm (가정) */
  leakMm: 20,
  leakDur: 120,
};
/** 포화 수증기압 (hPa, Magnus) */
export const esat = (T: number) => 6.112 * Math.exp((17.62 * T) / (243.12 + T));
/** 이슬점 (°C): 수증기압으로 */
export const dewFromE = (e: number) => {
  const g = Math.log(e / 6.112);
  return (243.12 * g) / (17.62 - g);
};
/** 이슬점 (°C): 온도 · 상대습도로 (펌웨어가 DHT11 값으로 계산하는 식) */
export const dewPoint = (T: number, rh: number) => dewFromE((Math.max(1, rh) / 100) * esat(T));
const E0 = MODEL.rh0 * esat(MODEL.Ta0);
const EOUT = MODEL.outRH * esat(MODEL.outT);
const TICK = 0.5;
/** 기본 잡음: 40가지 중 평균에 가장 가까운 것 (주의 13.5 · 경고 26 · 위험 64.5초) */
export const SEED = 18;
const SUB = 0.1;
export const LEVEL_KO = ["정상", "주의", "경고", "위험"] as const;

export type Config = {
  env: EnvId;
  variant?: string;
  present: PartId[];
  pins: Record<string, number>;
  cards: Record<CardId, boolean>;
  params: Record<string, number>;
  flags?: Flags;
  seed?: number;
};

export type Sample = {
  t: number;
  dT: number | null;
  truth: number;
  slope: number;
  eta: number | null;
  cur: number | null;
  volt: number | null;
  level: number;
  heat: boolean;
  fault: boolean;
  /** 위험 단계로 히터를 끊은 뒤 'x' 전까지 */
  trip: boolean;
};
export type Led = { color: "g" | "y" | "r" | "b" | "off"; blink: "none" | "fast" | "slow" };
export type SimEvent = { t: number; kind: "level" | "cut" | "fault" | "heater" | "boot" | "cmd"; text: string; level?: number; bogus?: boolean };

/** PC로 보내는 기록 한 줄 (1초마다) */
export type Packet = { seq: number; t: number; level: number; dT: number | null; heat: boolean; sent: number | null; arrive: number | null; late: boolean; lost: boolean };
export type CommState = { ap: boolean; link: boolean; backlog: number; made: number; recv: number; lost: number; pending: number; pc: Packet | null; catchUp: number | null; rttMed: number | null };

export type Score = {
  verdict: "pass" | "partial" | "late" | "miss" | "false" | "boot" | "idle";
  title: string;
  detail: string;
  firstAlarm: number | null;
  cut: number | null;
  /** 사건 뒤 히터(충전)를 멈추기까지 (초) */
  react: number | null;
  peakTruth: number;
  falseAlarms: number;
  parts: number;
  pinsUsed: number;
  comm: { made: number; recv: number; lost: number; catchUp: number | null };
  /** 결로: 물이 맺히기 몇 초 전에 멈췄나 (음수면 맺힌 뒤) */
  dewLead: number | null;
  /** 누수: 멈출 때 실제 물 높이 (mm) */
  waterAt: number | null;
};

/** 3D · 화면에 보여 줄 현장 상태 */
export type Site = {
  door: boolean;
  person: boolean;
  pirOut: boolean;
  tilt: number;
  shock: number;
  dtmodOn: boolean;
  dhtT: number | null;
  dhtRH: number | null;
  beep: "none" | "slow" | "fast";
  maint: boolean;
  wifi: boolean;
  /** 실제 바닥 물 (mm) · 초음파로 잰 물 높이 */
  water: number;
  floorMm: number | null;
  /** 셀에 맺힌 물 0~1 · 펌웨어가 계산한 이슬점 */
  wet: number;
  dew: number | null;
  /** 실제 공기 습도 (%) */
  rhTrue: number;
};

/** 받침에 맞는 조사: 로/으로, 을/를 */
const jong = (w: string) => {
  const c = w.trim().charCodeAt(w.trim().length - 1);
  return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : /[0-9]$/.test(w) ? -1 : 0;
};
export const ro = (w: string) => w + (jong(w) === 0 || jong(w) === 8 ? "로" : "으로");
export const eul = (w: string) => w + (jong(w) === 0 ? "를" : "을");

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Sim {
  readonly cfg: Config;
  readonly env = ENVS[0];
  readonly issues: PinIssue[];
  readonly has: (p: PartId) => boolean;
  readonly ok: (p: PartId) => boolean;
  private rand: () => number;
  /** 통신용 난수는 따로 — 센서 잡음 순서를 바꾸지 않도록 */
  private rand2: () => number;
  private gauss = () => {
    const u = Math.max(1e-9, this.rand()),
      v = this.rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  private P = (k: string) => this.cfg.params[k];
  readonly card = (id: CardId) => !!this.cfg.cards[id] && cardUsable(CARDS.find((c) => c.id === id)!, this.has);

  /* ── 세계 ── */
  t = 0;
  Ta = MODEL.Ta0;
  Tca = MODEL.Ta0;
  x = 0;
  Tn = MODEL.Ta0;
  Ts = MODEL.Ta0;
  Tmod = MODEL.Ta0;
  Tdht = MODEL.Ta0;
  loadOn = false;
  door = false;
  /** 함체 공기 수증기압 (hPa) · DHT11이 느끼는 값 */
  vap = E0;
  vapDht = E0;
  /** 셀에 맺힌 물 0~1 · 처음 맺힌 시각 */
  wet = 0;
  tCond: number | null = null;
  /** 바닥 물 (mm) */
  water = 0;
  person = false;
  tilt = 0;
  shock = 0;
  get Rh() {
    return this.env.id === "short" && this.t >= (this.env.event ?? 0) ? MODEL.Rshort : MODEL.Rheat;
  }
  /** 히터 전류 (평균, mA) */
  get Iheat() {
    return this.power ? (4.56 / (this.Rh + 22)) * 1000 * this.env.load : 0;
  }
  get power() {
    if (!this.loadOn) return false;
    if (!this.has("relay")) return true;
    return this.ok("relay") && this.heaterOn && !this.bootFail;
  }
  get truth() {
    return this.Tca + this.x - this.Ta;
  }

  /* ── 펌웨어 상태 ── */
  readonly bootFail: boolean;
  heaterOn = false;
  tripped = false;
  level = 0;
  reason = "";
  dT = 0;
  slope = 0;
  eta: number | null = null;
  busV = 0;
  curMa = 0;
  fault = false;
  suspect = false;
  /** 충전을 멈춰야 하는 현장 이유 (정비 · 충격 · 결로 · 누수) */
  halt: string | null = null;
  maint = false;
  private haltBogus = false;
  private offset = 0;
  private calib: number[] = [];
  private calibrated = false;
  private emaDs = NaN;
  private emaAmb = NaN;
  private dsRaw = NaN;
  private dhtRaw = NaN;
  private dhtRH = NaN;
  private win: [number, number][] = [];
  private avgV: number[] = [];
  private avgI: number[] = [];
  private slopeSince = 0;
  private raiseN = 0;
  private lowerN = 0;
  private firstExceed = 0;
  private heaterAt = 0;
  private hotSince = 0;
  private lastLog = -1;
  private ticks = 0;
  private dtmodOn = false;
  private pirHoldUntil = -1;
  /** 초음파: 켤 때 잰 바닥까지 거리 · 지금 물 높이 */
  private sonarBase: number[] = [];
  private floorBase = NaN;
  floorMm: number | null = null;
  private leakN = 0;
  private dewN = 0;
  dewEst: number | null = null;
  private shockUntil = -1;
  private vibUntil = -1;
  private tiltSince = 0;
  private shockPeak = 0;

  /* ── 관제 통신 (LAB 01 ess_stage3 그대로: 1초마다 기록 · 끊기면 링버퍼 · 0.1초마다 b개 재전송 · 10초마다 재연결) ── */
  readonly packets: Packet[] = [];
  private ring: Packet[] = [];
  ap = true;
  link = true;
  private lastTry = 0;
  private reconnectAt = 0;
  private backlogStart = 0;
  catchUp: number | null = null;

  readonly samples: Sample[] = [];
  readonly events: SimEvent[] = [];
  readonly log: string[] = [];
  led: Led = { color: "off", blink: "none" };

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.env = ENVS.find((e) => e.id === cfg.env)!;
    const present = new Set(cfg.present);
    this.has = (p) => present.has(p);
    this.issues = checkPins(present, cfg.pins, cfg.flags ?? defaultFlags());
    const broken = new Set(this.issues.filter((i) => i.breaks).map((i) => i.part));
    this.ok = (p) => present.has(p) && !broken.has(p);
    this.bootFail = this.issues.some((i) => i.bootFail);
    this.rand = rng(cfg.seed ?? SEED);
    this.rand2 = rng((cfg.seed ?? SEED) * 7919 + 1);
    this.boot();
  }

  /* ── 시리얼 ── */
  private say(line: string) {
    this.log.push(`${this.t.toFixed(1).padStart(5)}s  ${line}`);
  }
  private ev(kind: SimEvent["kind"], text: string, level?: number, bogus = false) {
    this.events.push({ t: this.t, kind, text, level, bogus });
  }

  private boot() {
    if (this.bootFail) {
      this.log.push("ets Jun  8 2016 00:22:57", "rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)", "flash read err, 1000", "ets_main.c 371");
      this.ev("boot", "부팅 실패 — GPIO12에 끌어올림 저항");
      return;
    }
    this.say("# === ESS 가상 ESP32 — 4단계 판정 · 자동 차단 ===");
    if (this.has("shunt")) this.say(this.ok("shunt") ? "# 전류 0점 142 mV" : "# 전류 0점 0 mV (션트 핀에서 값을 못 읽음)");
    const kit = PARTS.filter((p) => p.group === "kit" && this.has(p.id));
    if (kit.length) this.say(`# 키트 부품 ${kit.length}종: ${kit.map((p) => (this.ok(p.id) ? p.name : `${p.name}(핀 오류)`)).join(", ")}`);
    if (this.has("ds")) this.say(`# 온도 기준 잡는 중 (8초, 히터 OFF 상태여야 함)...`);
    else this.say("# 셀 온도 센서 없음 — 온도 판정을 하지 않습니다");
  }

  /** 시리얼 명령 (사람이 입력한 것과 같음). b는 현장 버튼 */
  command(c: "h" | "o" | "x" | "b") {
    if (this.bootFail) return;
    if (c === "h") {
      this.loadOn = true;
      if (!this.has("relay")) {
        this.say("# 히터 ON (차단기 없음 — 전원에 바로 연결)");
        this.heaterAt = this.t;
        return;
      }
      if (this.tripped) this.say("# 차단 상태입니다. 온도가 내려간 뒤 'x'로 해제하세요.");
      else if (this.fault || this.suspect) this.say("# 센서 고장 상태라 히터를 켤 수 없습니다.");
      else if (this.halt) this.say(`# ${this.halt} — 지금은 히터를 켤 수 없습니다.`);
      else {
        this.setHeater(true);
        this.say(this.ok("relay") ? "# 히터 ON" : "# 히터 ON 명령 — 그러나 릴레이 핀이 동작하지 않아 히터에 전기가 안 감");
      }
    } else if (c === "o") {
      this.loadOn = false;
      this.setHeater(false);
      this.say("# 히터 OFF");
    } else if (c === "x" || c === "b") {
      if (c === "b" && !this.ok("btn")) return;
      const who = c === "b" ? "# 현장 버튼 → " : "# ";
      if (this.dT < this.P("dt.w") - 0.3 && this.curMa < this.P("cur.w")) {
        this.tripped = false;
        this.suspect = false;
        this.say(`${who}차단 해제`);
      } else this.say(`${who}아직 해제할 수 없습니다 (ΔT ${this.dT.toFixed(2)} °C, ${this.curMa.toFixed(1)} mA)`);
    }
    this.ev("cmd", c);
  }

  private setHeater(on: boolean) {
    if (on && !this.heaterOn) this.heaterAt = this.t;
    this.heaterOn = on;
  }

  /* ── 환경 ── */
  private world(dt: number) {
    const e = this.env.id,
      t = this.t,
      E = this.env.event ?? Infinity;
    if (e === "room") this.Ta = MODEL.Ta0 + 4.5 * Math.min(1, Math.max(0, (t - 15) / 90));
    if (e === "condense" && t >= E) {
      const m = 1 - Math.exp(-(t - E) / MODEL.tauAir);
      this.Ta = MODEL.Ta0 + (MODEL.outT - MODEL.Ta0) * m;
      this.vap = E0 + (EOUT - E0) * m;
    }
    if (e === "leak") this.water = MODEL.leakMm * Math.min(1, Math.max(0, (t - E) / MODEL.leakDur));
    this.door = e === "door" && t >= E && t < 130;
    this.person = e === "door" && t >= E + 2 && t < 125;
    if (e === "shock") {
      this.shock = t >= E ? 2.8 * Math.exp(-(t - E) / 0.5) : 0;
      if (this.shock < 0.02) this.shock = 0;
      this.tilt = 30 * Math.min(1, Math.max(0, (t - E - 0.5) / 1.5));
    }
    this.Tca += (dt * (this.Ta - this.Tca)) / MODEL.tauCellAmb;
    const pw = this.power;
    // 같은 셀에 들어가는 열: 평소 전력 대비 비율 (단락이면 커짐) × 충전 세기
    const i = 4.56 / (this.Rh + 22),
      i0 = 4.56 / (MODEL.Rheat + 22);
    const pf = (i * i * this.Rh) / (i0 * i0 * MODEL.Rheat);
    const K = MODEL.K * pf * this.env.load;
    this.x += (dt * ((pw ? K : 0) - this.x)) / (pw ? MODEL.tauHeat : MODEL.tauCool);
    this.Tn += (dt * (this.Ta - this.Tn)) / MODEL.tauNtc;
    const contact = e === "sensor" && this.cfg.variant === "contact";
    const target = contact ? this.Tca + MODEL.contactGain * this.x : this.Tca + this.x;
    this.Ts += (dt * (target - this.Ts)) / (contact ? MODEL.contactTau : MODEL.tauDs);
    this.Tmod += (dt * (this.Tca + this.x - this.Tmod)) / MODEL.tauMod;
    this.Tdht += (dt * (this.Ta - this.Tdht)) / MODEL.tauDht;
    this.vapDht += (dt * (this.vap - this.vapDht)) / MODEL.tauDht;
    // 결로: 셀 표면이 공기 이슬점보다 차가우면 물이 맺힘
    const cond = this.Tca + this.x < dewFromE(this.vap);
    if (cond && this.tCond === null) this.tCond = this.t;
    this.wet = Math.min(1, Math.max(0, this.wet + dt * (cond ? 1 / 30 : -1 / 90)));
  }

  /* ── 센서 ── */
  private readDs() {
    if (!this.ok("ds")) return NaN;
    if (this.env.id === "sensor" && this.cfg.variant === "cut" && this.t >= 45) return NaN;
    return Math.round((this.Ts + 0.03 * this.gauss()) / 0.125) * 0.125;
  }
  private readNtc() {
    if (!this.ok("ntc")) return NaN;
    return this.Tn + MODEL.ntcBias + 0.08 * this.gauss();
  }
  private readCur() {
    if (!this.ok("shunt")) return 0;
    if (!this.power) return 0;
    const i = this.Iheat + 0.3 * this.gauss();
    return i * 22 <= 157 ? 0 : i; // 0점 근처(약 7 mA 아래)는 0으로 (펌웨어와 같음)
  }
  private readBus() {
    if (!this.ok("div")) return 0;
    return 4.6 - 0.0021 * this.Iheat + 0.01 * this.gauss();
  }
  /** 주변 온도: NTC가 있으면 NTC, 없으면 DHT11, 둘 다 없으면 null */
  private ambSrc(): "ntc" | "dht" | null {
    return this.has("ntc") ? "ntc" : this.has("dht") ? "dht" : null;
  }

  /* ── 키트 부품 읽기 ── */
  private readKit(src: "ntc" | "dht" | null) {
    // DHT11: 1초에 한 번, 1 °C 단위
    if (this.ok("dht") && this.ticks % 2 === 0) {
      this.dhtRaw = Math.round(this.Tdht + MODEL.dhtBias + 0.3 * this.gauss());
      this.dhtRH = Math.min(95, Math.max(20, Math.round((100 * this.vapDht) / esat(this.Tdht) + 1.5 * this.gauss())));
    } else if (!this.ok("dht")) {
      this.dhtRaw = NaN;
      this.dhtRH = NaN;
    }
    // 온도 스위치: 비교기, 0.5 °C 여유
    if (this.ok("dtmod")) {
      const set = this.P("dtsw.t");
      if (!this.dtmodOn && this.Tmod >= set) this.dtmodOn = true;
      else if (this.dtmodOn && this.Tmod < set - 0.5) this.dtmodOn = false;
    } else this.dtmodOn = false;
    // 가속도: 빠른 루프에서 잰 0.5초 최대값
    this.shockPeak = this.ok("accel") ? this.shock + 0.02 * Math.abs(this.gauss()) : 0;
    // 인체감지: 켠 뒤 30~60초는 헛신호 (6~9초, 22~25초)
    const warm = (this.t >= 6 && this.t < 9) || (this.t >= 22 && this.t < 25);
    if (this.ok("pir") && (this.person || warm)) this.pirHoldUntil = this.t + 2.5;
    // 초음파: 5번 재서 가운데값 (가끔 엉뚱한 메아리)
    if (this.ok("sonar")) {
      const cTrue = 331.3 + 0.606 * this.Ta;
      const tm = src === "ntc" ? this.emaAmb : this.dhtRaw;
      const cUse = this.card("sos") && !isNaN(tm) ? 331.3 + 0.606 * tm : 343.4;
      const d = (MODEL.sonarH - this.water) * (cUse / cTrue);
      const pings = Array.from({ length: 5 }, () => (this.rand() < 0.03 ? d + 5 + 40 * this.rand() : Math.round((d + MODEL.sonarNoise * this.gauss()) / 0.17) * 0.17)).sort((a, b) => a - b);
      const med = pings[2];
      if (this.t <= 8) this.sonarBase.push(med);
      else {
        if (isNaN(this.floorBase) && this.sonarBase.length) this.floorBase = [...this.sonarBase].sort((a, b) => a - b)[Math.floor(this.sonarBase.length / 2)];
        if (!isNaN(this.floorBase)) this.floorMm = this.floorBase - med;
      }
    } else this.floorMm = null;
    // 진동 스위치
    if (this.ok("vib") && this.shock > 0.5) this.vibUntil = this.t + 10;
  }
  get pirOut() {
    return this.ok("pir") && this.t < this.pirHoldUntil;
  }

  /* ── 펌웨어 tick (0.5초) ── */
  private tick() {
    this.ticks++;
    const avg = (buf: number[], v: number) => {
      buf.push(v);
      if (buf.length > 5) buf.shift();
      return buf.reduce((a, b) => a + b, 0) / buf.length;
    };
    this.busV = avg(this.avgV, this.readBus());
    this.curMa = avg(this.avgI, this.readCur());
    const src = this.ambSrc();
    this.readKit(src);
    const amb = src === "ntc" ? this.readNtc() : src === "dht" ? this.dhtRaw : NaN;
    this.dsRaw = this.readDs();
    if (!isNaN(amb)) this.emaAmb = isNaN(this.emaAmb) ? amb : 0.3 * amb + 0.7 * this.emaAmb;
    if (!isNaN(this.dsRaw)) this.emaDs = isNaN(this.emaDs) ? this.dsRaw : 0.3 * this.dsRaw + 0.7 * this.emaDs;
    const wasFault = this.fault;
    this.fault = this.has("ds") && (isNaN(this.dsRaw) || (src !== null && isNaN(this.emaAmb)));
    if (this.fault && !wasFault) this.ev("fault", isNaN(this.dsRaw) ? "셀 온도 센서 값 없음 (nan)" : "주변 온도 센서 값 없음 (nan)");

    // 기준 잡기 (처음 8초)
    if (!this.calibrated && this.has("ds")) {
      if (this.t <= 8) {
        if (!isNaN(this.dsRaw) && (src === null || !isNaN(amb))) this.calib.push(src ? this.dsRaw - amb : this.dsRaw);
        this.outputs();
        return;
      }
      this.calibrated = true;
      if (this.calib.length >= 5) {
        this.offset = this.calib.reduce((a, b) => a + b, 0) / this.calib.length;
        const nm = src === "ntc" ? "NTC" : "DHT11";
        this.say(src ? `# 기준 차이 (DS18B20 − ${nm}) = ${this.offset >= 0 ? "+" : ""}${this.offset.toFixed(2)} °C  (${this.calib.length}회 평균)` : `# 주변 센서 없음 → 켤 때 셀 온도 ${this.offset.toFixed(2)} °C를 기준으로 삼음`);
      } else this.say("# 기준을 잡지 못했습니다. 센서 연결을 확인하세요.");
      this.emaDs = NaN;
      this.emaAmb = NaN;
      this.win = [];
      this.outputs();
      return;
    }

    if (this.has("ds") && !this.fault && !isNaN(this.emaDs)) {
      this.dT = src ? this.emaDs - this.emaAmb - this.offset : this.emaDs - this.offset;
      this.win.push([this.t, this.dT]);
      if (this.win.length > 20) this.win.shift();
      this.slope = this.lsq();
      const dD = this.P("dt.d");
      this.eta = this.slope > 0.005 && this.dT < dD ? (dD - this.dT) / this.slope : null;
    }

    // 안전: 60 °C · 10분
    if (this.heaterOn && ((!isNaN(this.emaDs) && this.emaDs > 60) || this.t - this.heaterAt > 600)) {
      this.setHeater(false);
      this.say("# 안전 정지: 60°C 초과 또는 10분 연속 가열");
      this.ev("cut", "안전 정지");
    }

    // 가열 대비 온도 확인 (조합 카드)
    if (this.card("heatcheck")) {
      if (this.power && this.curMa >= 15) {
        if (!this.hotSince) this.hotSince = this.t;
      } else this.hotSince = 0;
      if (!this.suspect && this.hotSince && this.t - this.hotSince >= this.P("heatcheck.t") && this.dT < this.P("heatcheck.m")) {
        this.suspect = true;
        this.ev("fault", "가열 대비 온도가 너무 낮음 — 센서 접촉 의심");
      }
    }

    // 현장 카드: 충전을 멈출 이유
    let halt: string | null = null,
      bogus = false,
      maint = false;
    if (this.card("shock") && Math.abs(this.shockPeak) >= this.P("shock.g")) this.shockUntil = this.t + 30;
    if (this.card("shock") && this.t < this.shockUntil) halt = "충격 감지";
    if (this.card("tiltA") && this.ok("accel") && this.tilt >= this.P("tiltA.a")) halt = "기울어짐 (가속도)";
    if (this.card("tiltSw") && this.ok("tilt") && this.tilt > 25) {
      if (!this.tiltSince) this.tiltSince = this.t;
      if (this.t - this.tiltSince >= 1) halt = "기울기 스위치";
    } else this.tiltSince = 0;
    // 결로: 셀 표면(DS18B20) − 이슬점(DHT11) 이 여유보다 작으면 (두 번 연속)
    this.dewEst = this.ok("dht") && !isNaN(this.dhtRaw) && !isNaN(this.dhtRH) ? dewPoint(this.dhtRaw, this.dhtRH) : null;
    if (this.card("dew") && this.ok("ds") && this.dewEst !== null && !this.fault && this.calibrated && !isNaN(this.emaDs)) {
      this.dewN = this.emaDs - this.dewEst < this.P("dew.m") ? this.dewN + 1 : 0;
      if (this.dewN >= 2) halt = "결로 위험";
    } else this.dewN = 0;
    // 누수: 바닥이 기준만큼 가까워지면 (두 번 연속)
    if (this.card("leak") && this.floorMm !== null) {
      this.leakN = this.floorMm >= this.P("leak.h") ? this.leakN + 1 : 0;
      if (this.leakN >= 2) halt = "바닥 누수";
    } else this.leakN = 0;
    if (this.card("door") && this.ok("reed") && this.door) {
      halt = "정비 중 — 문 열림";
      maint = true;
    }
    if (this.card("person") && this.pirOut && this.t >= this.P("person.i")) {
      if (!halt) {
        halt = "정비 중 — 사람 접근";
        bogus = !this.person;
      }
      maint = true;
    }
    this.halt = halt;
    this.haltBogus = bogus;
    this.maint = maint;

    const cand = this.judge();
    if (cand > this.level) {
      if (this.raiseN === 0) this.firstExceed = this.t;
      this.lowerN = 0;
      if (++this.raiseN >= 2) {
        this.change(cand);
        this.raiseN = 0;
      }
    } else if (cand < this.level) {
      this.raiseN = 0;
      if (++this.lowerN >= 10) {
        this.change(this.level - 1);
        this.lowerN = 0;
      }
    } else {
      this.raiseN = 0;
      this.lowerN = 0;
    }

    if ((this.fault && this.card("fault")) || this.suspect) {
      if (this.heaterOn) {
        this.setHeater(false);
        this.say(this.suspect ? "# 센서 접촉 의심 → 히터 차단" : "# 센서 고장 → 히터 차단");
        this.ev("cut", this.suspect ? "센서 접촉 의심으로 히터 정지" : "센서 고장으로 히터 정지");
      }
    }
    if (this.halt && this.heaterOn) {
      this.setHeater(false);
      this.say(`# ${this.halt} → 충전(히터) 정지`);
      this.ev("cut", `${ro(this.halt)} 충전 정지`, undefined, this.haltBogus);
    }
    this.outputs();
  }

  private lsq() {
    const n = this.win.length;
    if (n < 6) return 0;
    let mt = 0,
      my = 0;
    for (const [t, y] of this.win) {
      mt += t;
      my += y;
    }
    mt /= n;
    my /= n;
    let num = 0,
      den = 0;
    for (const [t, y] of this.win) {
      num += (t - mt) * (y - my);
      den += (t - mt) ** 2;
    }
    return den > 0 ? num / den : 0;
  }

  private levelFromTemp() {
    const c = this.P("dt.c"),
      w = this.P("dt.w"),
      d = this.P("dt.d");
    const m = (lv: number) => (this.level >= lv ? 0.3 : 0);
    if (this.dT >= d - m(3)) return 3;
    if (this.dT >= w - m(2)) return 2;
    if (this.dT >= c - m(1)) return 1;
    return 0;
  }

  private judge() {
    let cand = 0;
    this.reason = "";
    const raise = (l: number, why: string) => {
      if (l > cand) {
        cand = l;
        this.reason = why;
      }
    };
    if (this.fault && this.card("fault")) raise(2, "센서 고장");
    if (this.suspect) raise(2, "센서 접촉 의심 (가열 대비 온도 낮음)");
    if (this.has("ds") && !this.fault && this.calibrated) {
      if (this.card("dt")) {
        const lt = this.levelFromTemp();
        if (lt === 3) raise(3, "온도차 위험 기준 초과");
        if (lt === 2) raise(2, "온도차 경고 기준 초과");
        if (lt === 1) raise(1, "온도차 주의 기준 초과");
      }
      if (this.card("slope")) {
        if (this.slope >= this.P("slope.s")) {
          if (!this.slopeSince) this.slopeSince = this.t;
        } else this.slopeSince = 0;
        if (this.slopeSince && this.t - this.slopeSince >= this.P("slope.h")) raise(1, "온도 상승률 지속 (조기 경보)");
      }
      if (this.card("eta") && this.eta !== null && this.eta < this.P("eta.e") && this.dT >= this.P("dt.c")) raise(2, `위험 예측: 위험까지 ${this.P("eta.e")}초 미만`);
    }
    if (this.card("dtsw") && this.dtmodOn) raise(3, "온도 스위치 동작");
    if (this.card("cur")) {
      if (this.curMa >= this.P("cur.d")) raise(3, "과전류 위험");
      else if (this.curMa >= this.P("cur.w")) raise(2, "과전류 경고");
      else if (this.curMa >= this.P("cur.c")) raise(1, "과전류 주의");
    }
    if (this.card("volt")) {
      if (this.busV < this.P("volt.w") || this.busV > this.P("volt.h")) raise(2, "전압 이상");
      else if (this.busV < this.P("volt.c")) raise(1, "저전압 주의");
    }
    if (this.halt) raise(this.maint ? 1 : 2, this.halt);
    if (this.card("vib") && this.t < this.vibUntil) raise(1, "진동 감지");
    if (this.card("rh") && this.ok("dht") && this.dhtRH >= this.P("rh.h")) raise(1, "습도 높음");
    return cand;
  }

  private change(to: number) {
    const from = this.level;
    this.level = to;
    if (to > from) {
      let tail = "";
      if (to === 3) {
        this.tripped = true;
        if (!this.has("relay")) tail = " | 차단기(릴레이)가 없어 히터를 끊지 못함";
        else if (!this.ok("relay")) tail = " | 릴레이 핀이 동작하지 않음";
        else if (this.heaterOn) {
          this.setHeater(false);
          tail = " | 히터 자동 차단";
          this.ev("cut", "위험 판정으로 히터 차단");
        }
      }
      this.say(`# 단계 상승 ${LEVEL_KO[from]} → ${LEVEL_KO[to]} (${this.reason}) | 기준 초과 후 ${Math.round((this.t - this.firstExceed) * 1000)} ms 만에 확정${tail}`);
      this.ev("level", `${LEVEL_KO[to]} — ${this.reason}`, to, this.haltBogus && this.reason === this.halt);
    } else {
      this.say(`# 단계 하강 ${LEVEL_KO[from]} → ${LEVEL_KO[to]}`);
      this.ev("level", `${ro(LEVEL_KO[to])} 내려감`, to);
    }
  }

  private outputs() {
    if (!this.ok("rgb") || this.bootFail) this.led = { color: "off", blink: "none" };
    else if ((this.fault && this.card("fault")) || this.suspect) this.led = this.level >= 3 ? { color: "r", blink: "fast" } : { color: "b", blink: "slow" };
    else if (this.maint && this.level <= 1) this.led = { color: "y", blink: "slow" };
    else if (!this.calibrated && this.has("ds")) this.led = { color: "b", blink: "none" };
    else this.led = [{ color: "g", blink: "none" }, { color: "y", blink: "none" }, { color: "r", blink: "none" }, { color: "r", blink: "fast" }][this.level] as Led;
  }

  get site(): Site {
    const beep = !this.ok("buzz") || this.bootFail ? "none" : this.level >= 3 ? "fast" : this.level >= 2 ? "slow" : "none";
    return {
      door: this.door,
      person: this.person,
      pirOut: this.pirOut,
      tilt: this.tilt,
      shock: this.shock,
      dtmodOn: this.dtmodOn,
      dhtT: this.ok("dht") && !isNaN(this.dhtRaw) ? this.dhtRaw : null,
      dhtRH: this.ok("dht") && !isNaN(this.dhtRH) ? this.dhtRH : null,
      beep,
      maint: this.maint,
      wifi: this.link && !this.bootFail,
      water: this.water,
      floorMm: this.ok("sonar") && !this.bootFail ? this.floorMm : null,
      wet: this.wet,
      dew: this.dewEst,
      rhTrue: (100 * this.vap) / esat(this.Ta),
    };
  }

  private send(p: Packet, at: number, late: boolean) {
    p.sent = at;
    p.arrive = at + RTT[Math.floor(this.rand2() * RTT.length)] / 2000;
    p.late = late;
  }
  private commTick() {
    const [a, b] = AP_DOWN;
    this.ap = !(this.env.id === "wifi" && this.t >= a && this.t < b);
    if (!this.ap && this.link) {
      this.link = false;
      this.lastTry = this.t;
      this.say(`# Wi-Fi 끊김 (밀린 패킷은 버퍼에 저장 중: ${this.ring.length}개)`);
    } else if (!this.link && this.t - this.lastTry >= 10 - 1e-6) {
      this.lastTry = this.t;
      if (this.ap) {
        this.link = true;
        this.reconnectAt = this.t;
        this.backlogStart = this.ring.length;
        this.say(`# Wi-Fi 연결: IP 192.168.0.23, 신호 -58 dBm (끊긴 지 ${(this.t - a).toFixed(0)}초, 밀린 기록 ${this.ring.length}개)`);
      }
    }
    const buf = this.card("buffer");
    // 1초마다 기록 한 줄
    if (this.t >= 9 && Math.abs(this.t - Math.round(this.t)) < 1e-6) {
      const pk: Packet = { seq: this.packets.length, t: this.t, level: this.level, dT: this.has("ds") && this.calibrated ? this.dT : null, heat: this.power, sent: null, arrive: null, late: false, lost: false };
      this.packets.push(pk);
      if (this.link) this.send(pk, this.t, false);
      else if (buf) {
        this.ring.push(pk);
        if (this.ring.length > this.P("buffer.n")) {
          this.ring.shift()!.lost = true;
        }
      } else pk.lost = true;
    }
    // 밀린 것 재전송: 0.1초마다 b개
    if (this.link && this.ring.length) {
      const per = this.P("buffer.b");
      const k = Math.min(per * 5, this.ring.length);
      for (let i = 0; i < k; i++) this.send(this.ring.shift()!, this.t + Math.floor(i / per) * 0.1, true);
      if (!this.ring.length) {
        const last = this.packets.filter((p) => p.late).reduce((m, p) => Math.max(m, p.arrive ?? 0), 0);
        this.catchUp = last - this.reconnectAt;
        this.say(`# 밀린 패킷 전송 완료 (${this.backlogStart}개, 다시 연결 뒤 ${this.catchUp.toFixed(1)}초)`);
      }
    }
  }

  get comm(): CommState {
    let recv = 0,
      lost = 0,
      pending = 0;
    let pc: Packet | null = null;
    for (const p of this.packets) {
      if (p.lost) lost++;
      else if (p.arrive !== null && p.arrive <= this.t) {
        recv++;
        if (!pc || p.t > pc.t) pc = p;
      } else pending++;
    }
    const r = this.packets.filter((p) => p.arrive !== null && !p.late).map((p) => (p.arrive! - p.sent!) * 2000).sort((x, y) => x - y);
    return { ap: this.ap, link: this.link, backlog: this.ring.length, made: this.packets.length, recv, lost, pending, pc, catchUp: this.catchUp, rttMed: r.length ? r[Math.floor(r.length / 2)] : null };
  }

  /** 0.5초 진행 */
  step() {
    for (let i = 0; i < TICK / SUB - 1e-9; i++) {
      this.world(SUB);
      this.t = Math.round((this.t + SUB) * 10) / 10;
    }
    if (this.env.heaterAt !== null && Math.abs(this.t - this.env.heaterAt) < 1e-6) this.command("h");
    if (this.env.event !== undefined && Math.abs(this.t - this.env.event) < 1e-6) this.ev("heater", `사건: ${this.env.eventLabel}`);
    if (!this.bootFail) {
      this.tick();
      this.commTick();
    }
    const s: Sample = {
      t: this.t,
      dT: this.has("ds") && this.calibrated && !this.bootFail ? this.dT : null,
      truth: this.truth,
      slope: this.slope,
      eta: this.eta,
      cur: this.has("shunt") && !this.bootFail ? this.curMa : null,
      volt: this.has("div") && !this.bootFail ? this.busV : null,
      level: this.level,
      heat: this.power,
      fault: this.fault || this.suspect,
      trip: this.tripped,
    };
    this.samples.push(s);
    // 5초마다 측정값 한 줄 (펌웨어의 CSV 기록을 줄여서)
    if (!this.bootFail && this.t >= 10 && Math.abs(this.t / 5 - Math.round(this.t / 5)) < 1e-6 && this.t !== this.lastLog) {
      this.lastLog = this.t;
      const parts: string[] = [];
      if (this.has("ds")) parts.push(this.fault ? "ΔT nan" : `ΔT ${this.dT.toFixed(2)}`, `${this.slope >= 0 ? "+" : ""}${this.slope.toFixed(3)}/s`);
      if (this.has("shunt")) parts.push(`${this.curMa.toFixed(1)} mA`);
      if (this.has("div")) parts.push(`${this.busV.toFixed(2)} V`);
      if (this.ok("dht") && !isNaN(this.dhtRaw)) parts.push(`${this.dhtRaw} °C ${this.dhtRH}%`);
      if (this.ok("accel")) parts.push(`${this.tilt.toFixed(0)}°`);
      if (this.dewEst !== null) parts.push(`이슬점 ${this.dewEst.toFixed(1)} °C`);
      if (this.floorMm !== null) parts.push(`바닥 물 ${this.floorMm.toFixed(1)} mm`);
      parts.push(LEVEL_KO[this.level], this.power ? "ON" : "OFF");
      this.say(parts.join(" · "));
    }
    return s;
  }

  get done() {
    return this.t >= this.env.duration - 1e-6;
  }

  runAll() {
    while (!this.done) this.step();
    return this;
  }

  /* ── 성적표 ── */
  score(): Score {
    const parts = this.cfg.present.length;
    const pinsUsed = PARTS.filter((p) => this.has(p.id)).reduce((a, p) => a + p.pins.length, 0);
    const peak = Math.max(...this.samples.map((s) => s.truth));
    const alarms = this.events.filter((e) => e.kind === "level" && (e.level ?? 0) >= 1 && e.text.indexOf("내려감") < 0);
    const h0 = this.env.heaterAt ?? 0;
    const E = this.env.event;
    const firstAlarm = alarms.length ? alarms[0].t - h0 : null;
    const offAt = (from: number) => {
      for (let i = 1; i < this.samples.length; i++) if (this.samples[i].t >= from && this.samples[i - 1].heat && !this.samples[i].heat) return this.samples[i].t;
      return null;
    };
    const cutAbs = offAt(0);
    const cut = cutAbs === null ? null : cutAbs - h0;
    const afterAbs = E === undefined ? null : offAt(E);
    const react = afterAbs === null || E === undefined ? null : afterAbs - E;
    const cm = this.comm;
    // 끝나는 순간 보내는 중인 것은 도착한 것으로 (보내지도 못한 것만 잃음)
    const unsent = this.packets.filter((p) => !p.lost && p.sent === null).length;
    const base = { parts, pinsUsed, firstAlarm, cut, react, peakTruth: peak, falseAlarms: 0, comm: { made: cm.made, recv: cm.made - cm.lost - unsent, lost: cm.lost + unsent, catchUp: cm.catchUp }, dewLead: null, waterAt: null };
    const S = (verdict: Score["verdict"], title: string, detail: string, extra: Partial<Score> = {}): Score => ({ ...base, verdict, title, detail, ...extra });

    if (this.bootFail) return S("boot", "부팅 실패", "ESP32가 켜지지 않아 아무것도 측정하지 못했어요. 릴레이도 켜지지 않아 히터는 돌지 않았지만, 실제 장치였다면 감시가 전혀 없는 상태예요.", { firstAlarm: null, cut: null });
    if (this.env.heaterAt !== null && !this.samples.some((s) => s.heat)) {
      const dsClash = this.issues.find((i) => i.part === "ds" && i.breaks && i.msg.includes("같이 쓰고"));
      const why = !this.has("relay") ? "" : !this.ok("relay") ? "릴레이 핀이 동작하지 않아 히터에 전기가 가지 않았어요." : this.fault && dsClash ? `DS18B20 핀(GPIO${dsClash.gpio})을 ${dsClash.msg.match(/을 (.+?)와 같이/)?.[1] ?? "다른 부품"}도 써서 온도가 nan이라, 펌웨어가 히터를 켜 주지 않았어요.${dsClash.msg.includes("화면") ? " LAB 01 점검 1과 같은 상황이에요(화면도 안 켜짐)." : ""}` : this.fault ? "처음부터 센서 고장 상태라 펌웨어가 히터를 켜 주지 않았어요." : this.halt ? `‘${this.halt}’ 상태라 히터를 켜지 못했어요.` : "히터가 켜지지 않았어요.";
      return S("idle", "시작 못 함", `${why} 셀은 안전했지만 장치가 제 일을 못 한 상태예요. 부품 · 핀 탭의 빨간 표시를 확인하세요.`, { cut: null });
    }
    const bogus = this.events.find((e) => e.kind === "cut" && e.bogus);
    if (bogus)
      return S("partial", "헛신호로 멈춤", `아무도 없는데 ${bogus.t.toFixed(0)}초에 인체감지 센서의 헛신호로 충전을 멈췄어요. 켠 직후 30~60초는 이 센서를 믿으면 안 돼요. ‘켠 뒤 무시’ 시간을 늘려 보세요.`, {
        falseAlarms: alarms.filter((a) => a.bogus).length || 1,
      });

    const ex = this.env.expect;
    if (ex === "quiet") {
      const n = alarms.length;
      const cutAny = this.events.some((e) => e.kind === "cut");
      if (!n && !cutAny) return S("pass", "통과 — 조용히 지켜봄", "셀은 정상이었고, 경보를 한 번도 내지 않았어요.", { firstAlarm: null, cut: null });
      return S("false", `잘못된 경보 ${n}번`, `셀은 정상인데 ${alarms[0]?.t.toFixed(0)}초에 ‘${alarms[0]?.text}’ 경보를 냈어요.${cutAny ? " 히터 차단까지 했어요." : ""}`, { firstAlarm: alarms[0]?.t ?? null, cut: null, falseAlarms: n });
    }
    if (ex === "keep") {
      const gone = cm.lost + unsent;
      if (cut === null) return S("miss", "놓침 — 끝까지 데워짐", `셀이 주변보다 ${peak.toFixed(1)} °C까지 데워졌는데 히터를 끊지 못했어요.`);
      if (peak >= 4.6) return S("late", "늦은 차단", `${cut.toFixed(1)}초에 끊었지만 실제 셀은 이미 +${peak.toFixed(2)} °C였어요.`);
      const offline = cutAbs !== null && cutAbs >= AP_DOWN[0] && cutAbs < AP_DOWN[1];
      if (gone > 0)
        return S("partial", `차단은 됐지만 기록 ${gone}개를 잃음`, `${offline ? "Wi-Fi가 끊긴 사이에도 " : ""}${cut.toFixed(1)}초에 스스로 끊었어요. 하지만 PC는 그동안의 기록 ${gone}개를 끝내 받지 못해, 관제실은 언제 왜 멈췄는지 기록으로 확인할 수 없어요.`);
      return S("pass", "통과 — 끊겨도 스스로 차단, 기록도 모두 도착", `${offline ? "Wi-Fi가 끊긴 사이 " : ""}${cut.toFixed(1)}초에 스스로 끊었고, 쌓아 둔 기록은 다시 연결되고 ${cm.catchUp?.toFixed(1) ?? "—"}초 만에 모두 PC에 도착했어요 (${cm.made}/${cm.made}).`);
    }
    if (ex === "trip") {
      if (cut === null) return S("miss", "놓침 — 끝까지 데워짐", `셀이 주변보다 ${peak.toFixed(1)} °C까지 데워졌는데 히터를 끊지 못했어요.`);
      if (peak < 4.6) return S("pass", "통과 — 위험 전에 차단", `히터를 켠 뒤 ${cut.toFixed(1)}초에 끊었고, 실제 셀은 최고 +${peak.toFixed(2)} °C에서 멈췄어요.`);
      return S("late", "늦은 차단", `${cut.toFixed(1)}초에 끊었지만 그때 실제 셀은 이미 +${peak.toFixed(2)} °C였어요. 센서가 셀을 제대로 못 느꼈어요.`);
    }
    const after = alarms.filter((a) => E !== undefined && a.t >= E);
    if (ex === "dew" || ex === "leak") {
      // 사건 전에 멈추거나 울리면 잘못된 경보
      // 사건 전에 결로 · 누수 · 습도 경보를 내거나 충전을 멈추면 잘못된 경보 (충전 초반의 온도 주의는 따로 셈하지 않음)
      const early = this.events.filter((e) => E !== undefined && e.t < E && (e.kind === "cut" || (e.kind === "level" && /결로|누수|습도/.test(e.text) && e.text.indexOf("내려감") < 0)));
      if (early.length) return S("false", "잘못된 경보 — 사건 전에 울림", `아직 ${ex === "dew" ? "습한 공기가 들어오지도" : "물이 고이지도"} 않았는데 ${early[0].t.toFixed(0)}초에 ‘${early[0].text}’${early[0].kind === "cut" ? "" : " 경보를 냈어요"}${early[0].kind === "cut" ? "가 일어났어요" : ""}.`, { falseAlarms: early.length });
      const stopAt = afterAbs;
      if (ex === "dew") {
        const tc = this.tCond;
        const lead = stopAt !== null && tc !== null ? tc - stopAt : null;
        if (stopAt !== null && (lead === null || lead >= 20)) return S("pass", "통과 — 물 맺히기 전에 멈춤", lead === null ? "셀에 물이 맺히기 전에 충전을 멈췄어요." : `셀 표면에 물이 맺히기 ${lead.toFixed(0)}초 전에 결로 위험을 알리고 충전을 멈췄어요.`, { dewLead: lead });
        if (stopAt !== null && lead !== null && lead >= 0) return S("partial", `빠듯함 — 물 맺히기 ${lead.toFixed(0)}초 전`, `멈추긴 했지만 정답(20초 전)보다 늦었어요. 이슬점 계산에 DHT11 오차가 섞여 여유를 넓혀야 해요.`, { dewLead: lead });
        if (stopAt !== null && lead !== null) return S("late", `늦은 정지 — 물이 맺힌 뒤 ${(-lead).toFixed(0)}초`, `셀 표면에 이미 물이 맺힌 뒤에야 멈췄어요.`, { dewLead: lead });
        if (after.length) return S("partial", "알렸지만 충전은 계속", `${eul(after[0].text.replace(/^[^—]*— /, ""))} 알렸지만 충전을 멈추지 않았어요. 습도만으로는 물이 맺히는지 알 수 없어요.`);
        return S("miss", "몰랐어요 — 물이 맺힌 채 충전", tc !== null ? `${tc.toFixed(0)}초에 셀 표면이 이슬점 아래로 내려가 물이 맺혔는데 충전을 계속했어요. 셀 온도와 공기 습도를 함께 봐야 해요.` : "결로를 알아채지 못했어요.");
      }
      const wAt = stopAt === null ? null : MODEL.leakMm * Math.min(1, Math.max(0, (stopAt - (E ?? 0)) / MODEL.leakDur));
      if (wAt !== null && wAt < 5) return S("pass", "통과 — 물이 차기 전에 멈춤", `물이 ${wAt.toFixed(1)} mm일 때(누수 ${react?.toFixed(0)}초 뒤) 알리고 충전을 멈췄어요.`, { waterAt: wAt });
      if (wAt !== null) return S("late", `늦은 정지 — 물 ${wAt.toFixed(1)} mm`, `물이 이미 ${wAt.toFixed(1)} mm 고인 뒤에 멈췄어요. 물 높이 기준을 낮춰 보세요(방 온도 환경도 같이 시험).`, { waterAt: wAt });
      if (after.length) return S("partial", "알렸지만 충전은 계속", `${eul(after[0].text.replace(/^[^—]*— /, ""))} 알렸지만 충전을 멈추지 않았어요.`);
      return S("miss", "몰랐어요 — 물이 찬 채 충전", `바닥에 물이 ${MODEL.leakMm} mm까지 찼는데 충전을 계속했어요.`);
    }
    if (ex === "fast") {
      if (react !== null && react <= 5) return S("pass", "통과 — 단락을 바로 끊음", `단락 ${react.toFixed(1)}초 만에 히터를 끊었어요. 실제 셀은 최고 +${peak.toFixed(2)} °C.`);
      if (react !== null) return S("late", `늦은 차단 — 단락 ${react.toFixed(0)}초 뒤`, `그동안 평소의 약 1.9배 전류가 흘렀어요. 전류가 아니라 온도로 뒤늦게 막았어요. 실제 셀은 +${peak.toFixed(2)} °C까지.`);
      return S("miss", "놓침 — 단락된 채 계속", `과전류가 끝까지 흘렀고 셀은 +${peak.toFixed(1)} °C까지 데워졌어요.`);
    }
    // stop: 충격 · 문
    const what = this.env.id === "door" ? "문이 열리고" : "충격";
    if (react !== null && react <= 5) return S("pass", "통과 — 바로 멈춤", this.env.id === "door" ? `문이 열리고 ${react.toFixed(1)}초 만에 정비 모드로 충전을 멈췄어요.` : `충격 ${react.toFixed(1)}초 만에 충전을 멈추고 알렸어요.`);
    if (after.length && react === null) return S("partial", "알렸지만 충전은 계속", `${eul(after[0].text.replace(/^[^—]*— /, ""))} 알렸지만 충전을 멈추지 않았어요.`);
    if (react !== null) return S("late", `늦은 정지 — ${react.toFixed(0)}초`, `${what} ${react.toFixed(0)}초 뒤에야 멈췄어요.`);
    return S("miss", "몰랐어요", this.env.id === "door" ? "사람이 손대는 동안에도 충전이 계속됐어요." : "충격도 기울어짐도 알아채지 못하고 충전을 계속했어요.");
  }
}

export const defaultPresent = (): PartId[] => ["ds", "ntc", "shunt", "div", "relay", "rgb"];
export const allParts = (): PartId[] => PARTS.map((p) => p.id);
