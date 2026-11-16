/* 가상 ESP32 실험대 — 계산 모듈 (화면과 분리).
   ① 환경 모델: 방 온도 · 셀 온도 · 전류 · 전압의 '실제 값'
   ② 센서 모델: 센서마다 다르게 읽음 (반응 속도 · 잡음 · 해상도 · 고장)
   ③ 가상 펌웨어: LAB 01의 ess_stage3.ino 판정 부분을 그대로 옮김 (0.5초마다)
   셀 발열은 LAB 01 판정 실험 2회차 기록에 맞춘 1차 모델: 최종 상승 K = 6.5 °C, 가열 시간상수 66 s.
   (펌웨어의 지수 평활까지 거친 값이 기록과 맞도록 맞춤. 이 모델로 판정하면 주의 13 · 경고 26 · 위험 65초, 실측은 11 · 27 · 65초)
   냉각 시간상수 220 s는 발열 실험 1 · 3회 평균. */
import { CARDS, ENVS, PARTS, checkPins, type CardId, type EnvId, type PartId, type PinIssue } from "./catalog";

export const MODEL = { K: 6.5, tauHeat: 66, tauCool: 220, tauCellAmb: 220, tauNtc: 20, tauDs: 0.1, contactGain: 0.73, contactTau: 25, Ta0: 23, ntcBias: -0.55 };
const TICK = 0.5;
const SUB = 0.1;
export const LEVEL_KO = ["정상", "주의", "경고", "위험"] as const;

export type Config = {
  env: EnvId;
  variant?: string;
  present: PartId[];
  pins: Record<string, number>;
  cards: Record<CardId, boolean>;
  params: Record<string, number>;
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
};
export type Led = { color: "g" | "y" | "r" | "b" | "off"; blink: "none" | "fast" | "slow" };
export type SimEvent = { t: number; kind: "level" | "cut" | "fault" | "heater" | "boot" | "cmd"; text: string; level?: number };

export type Score = {
  verdict: "pass" | "late" | "miss" | "false" | "boot" | "idle";
  title: string;
  detail: string;
  firstAlarm: number | null;
  cut: number | null;
  peakTruth: number;
  falseAlarms: number;
  parts: number;
  pinsUsed: number;
};

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
  private ok: (p: PartId) => boolean;
  private rand: () => number;
  private gauss = () => {
    const u = Math.max(1e-9, this.rand()),
      v = this.rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  private P = (k: string) => this.cfg.params[k];
  private card = (id: CardId) => !!this.cfg.cards[id] && CARDS.find((c) => c.id === id)!.needs.every((n) => this.has(n));

  /* 세계 */
  t = 0;
  Ta = MODEL.Ta0;
  Tca = MODEL.Ta0;
  x = 0;
  Tn = MODEL.Ta0;
  Ts = MODEL.Ta0;
  load = false;
  get power() {
    if (!this.load) return false;
    if (!this.has("relay")) return true;
    return this.ok("relay") && this.heaterOn && !this.bootFail;
  }
  get truth() {
    return this.Tca + this.x - this.Ta;
  }

  /* 펌웨어 상태 */
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
  private offset = 0;
  private calib: number[] = [];
  private calibrated = false;
  private emaDs = NaN;
  private emaNtc = NaN;
  private dsRaw = NaN;
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

  readonly samples: Sample[] = [];
  readonly events: SimEvent[] = [];
  readonly log: string[] = [];
  led: Led = { color: "off", blink: "none" };

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.env = ENVS.find((e) => e.id === cfg.env)!;
    const present = new Set(cfg.present);
    this.has = (p) => present.has(p);
    this.issues = checkPins(present, cfg.pins);
    const broken = new Set(this.issues.filter((i) => i.breaks).map((i) => i.part));
    this.ok = (p) => present.has(p) && !broken.has(p);
    this.bootFail = this.issues.some((i) => i.bootFail);
    this.rand = rng(cfg.seed ?? 7);
    this.boot();
  }

  /* ── 시리얼 ── */
  private say(line: string) {
    this.log.push(`${this.t.toFixed(1).padStart(5)}s  ${line}`);
  }
  private ev(kind: SimEvent["kind"], text: string, level?: number) {
    this.events.push({ t: this.t, kind, text, level });
  }

  private boot() {
    if (this.bootFail) {
      this.log.push("ets Jun  8 2016 00:22:57", "rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)", "flash read err, 1000", "ets_main.c 371");
      this.ev("boot", "부팅 실패 — GPIO12에 끌어올림 저항");
      return;
    }
    this.say("# === ESS 가상 ESP32 — 4단계 판정 · 자동 차단 ===");
    if (this.has("shunt")) this.say(this.ok("shunt") ? "# 전류 0점 142 mV" : "# 전류 0점 0 mV (션트 핀에서 값을 못 읽음)");
    if (this.has("ds")) this.say(`# 온도 기준 잡는 중 (8초, 히터 OFF 상태여야 함)...`);
    else this.say("# 셀 온도 센서 없음 — 온도 판정을 하지 않습니다");
  }

  /** 시리얼 명령 (사람이 입력한 것과 같음) */
  command(c: "h" | "o" | "x") {
    if (this.bootFail) return;
    if (c === "h") {
      this.load = true;
      if (!this.has("relay")) {
        this.say("# 히터 ON (차단기 없음 — 전원에 바로 연결)");
        this.heaterAt = this.t;
        return;
      }
      if (this.tripped) this.say("# 차단 상태입니다. 온도가 내려간 뒤 'x'로 해제하세요.");
      else if (this.fault || this.suspect) this.say("# 센서 고장 상태라 히터를 켤 수 없습니다.");
      else {
        this.setHeater(true);
        this.say(this.ok("relay") ? "# 히터 ON" : "# 히터 ON 명령 — 그러나 릴레이 핀이 동작하지 않아 히터에 전기가 안 감");
      }
    } else if (c === "o") {
      this.load = false;
      this.setHeater(false);
      this.say("# 히터 OFF");
    } else if (c === "x") {
      const dW = this.P("dt.w");
      if (this.dT < dW - 0.3 && this.curMa < this.P("cur.w")) {
        this.tripped = false;
        this.suspect = false;
        this.say("# 차단 해제");
      } else this.say(`# 아직 해제할 수 없습니다 (ΔT ${this.dT.toFixed(2)} °C, ${this.curMa.toFixed(1)} mA)`);
    }
    this.ev("cmd", c);
  }

  private setHeater(on: boolean) {
    if (on && !this.heaterOn) this.heaterAt = this.t;
    this.heaterOn = on;
  }

  /* ── 환경 ── */
  private world(dt: number) {
    const e = this.env.id;
    if (e === "room") this.Ta = MODEL.Ta0 + 4.5 * Math.min(1, Math.max(0, (this.t - 15) / 90));
    this.Tca += (dt * (this.Ta - this.Tca)) / MODEL.tauCellAmb;
    const pw = this.power;
    this.x += (dt * ((pw ? MODEL.K : 0) - this.x)) / (pw ? MODEL.tauHeat : MODEL.tauCool);
    this.Tn += (dt * (this.Ta - this.Tn)) / MODEL.tauNtc;
    const contact = e === "sensor" && this.cfg.variant === "contact";
    const target = contact ? this.Tca + MODEL.contactGain * this.x : this.Tca + this.x;
    this.Ts += (dt * (target - this.Ts)) / (contact ? MODEL.contactTau : MODEL.tauDs);
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
    if (!this.power) return 0; // 0점 근처는 0으로 처리 (펌웨어와 같음)
    const i = (4.56 / 233) * 1000 + 0.3 * this.gauss();
    return i * 22 <= 157 ? 0 : i;
  }
  private readBus() {
    if (!this.ok("div")) return 0;
    return (this.power ? 4.56 : 4.6) + 0.01 * this.gauss();
  }

  /* ── 펌웨어 tick (0.5초) ── */
  private tick() {
    const avg = (buf: number[], v: number) => {
      buf.push(v);
      if (buf.length > 5) buf.shift();
      return buf.reduce((a, b) => a + b, 0) / buf.length;
    };
    this.busV = avg(this.avgV, this.readBus());
    this.curMa = avg(this.avgI, this.readCur());
    const ntc = this.readNtc();
    this.dsRaw = this.readDs();
    const hasNtc = this.has("ntc");
    if (!isNaN(ntc)) this.emaNtc = isNaN(this.emaNtc) ? ntc : 0.3 * ntc + 0.7 * this.emaNtc;
    if (!isNaN(this.dsRaw)) this.emaDs = isNaN(this.emaDs) ? this.dsRaw : 0.3 * this.dsRaw + 0.7 * this.emaDs;
    const wasFault = this.fault;
    this.fault = this.has("ds") && (isNaN(this.dsRaw) || (hasNtc && isNaN(this.emaNtc)));
    if (this.fault && !wasFault) this.ev("fault", isNaN(this.dsRaw) ? "셀 온도 센서 값 없음 (nan)" : "주변 온도 센서 값 없음 (nan)");

    // 기준 잡기 (처음 8초)
    if (!this.calibrated && this.has("ds")) {
      if (this.t <= 8) {
        if (!isNaN(this.dsRaw) && (!hasNtc || !isNaN(ntc))) this.calib.push(hasNtc ? this.dsRaw - ntc : this.dsRaw);
        return;
      }
      this.calibrated = true;
      if (this.calib.length >= 5) {
        this.offset = this.calib.reduce((a, b) => a + b, 0) / this.calib.length;
        this.say(hasNtc ? `# 기준 차이 (DS18B20 − NTC) = ${this.offset >= 0 ? "+" : ""}${this.offset.toFixed(2)} °C  (${this.calib.length}회 평균)` : `# 주변 센서 없음 → 켤 때 셀 온도 ${this.offset.toFixed(2)} °C를 기준으로 삼음`);
      } else this.say("# 기준을 잡지 못했습니다. 센서 연결을 확인하세요.");
      this.emaDs = NaN;
      this.emaNtc = NaN;
      this.win = [];
      return;
    }

    if (this.has("ds") && !this.fault && !isNaN(this.emaDs)) {
      this.dT = hasNtc ? this.emaDs - this.emaNtc - this.offset : this.emaDs - this.offset;
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
    if (this.card("cur")) {
      if (this.curMa >= this.P("cur.d")) raise(3, "과전류 위험");
      else if (this.curMa >= this.P("cur.w")) raise(2, "과전류 경고");
      else if (this.curMa >= this.P("cur.c")) raise(1, "과전류 주의");
    }
    if (this.card("volt")) {
      if (this.busV < this.P("volt.w") || this.busV > this.P("volt.h")) raise(2, "전압 이상");
      else if (this.busV < this.P("volt.c")) raise(1, "저전압 주의");
    }
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
      this.ev("level", `${LEVEL_KO[to]} — ${this.reason}`, to);
    } else {
      this.say(`# 단계 하강 ${LEVEL_KO[from]} → ${LEVEL_KO[to]}`);
      this.ev("level", `${LEVEL_KO[to]}로 내려감`, to);
    }
  }

  private outputs() {
    if (!this.ok("rgb") || this.bootFail) this.led = { color: "off", blink: "none" };
    else if ((this.fault && this.card("fault")) || this.suspect) this.led = this.level >= 3 ? { color: "r", blink: "fast" } : { color: "b", blink: "slow" };
    else this.led = [{ color: "g", blink: "none" }, { color: "y", blink: "none" }, { color: "r", blink: "none" }, { color: "r", blink: "fast" }][this.level] as Led;
  }

  /** 0.5초 진행 */
  step() {
    for (let i = 0; i < TICK / SUB - 1e-9; i++) {
      this.world(SUB);
      this.t = Math.round((this.t + SUB) * 10) / 10;
    }
    if (this.env.heaterAt !== null && Math.abs(this.t - this.env.heaterAt) < 1e-6) this.command("h");
    if (!this.bootFail) this.tick();
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
    };
    this.samples.push(s);
    // 5초마다 측정값 한 줄 (펌웨어의 CSV 기록을 줄여서)
    if (!this.bootFail && this.t >= 10 && Math.abs(this.t / 5 - Math.round(this.t / 5)) < 1e-6 && this.t !== this.lastLog) {
      this.lastLog = this.t;
      const parts: string[] = [];
      if (this.has("ds")) parts.push(this.fault ? "ΔT nan" : `ΔT ${this.dT.toFixed(2)}`, `${this.slope >= 0 ? "+" : ""}${this.slope.toFixed(3)}/s`);
      if (this.has("shunt")) parts.push(`${this.curMa.toFixed(1)} mA`);
      if (this.has("div")) parts.push(`${this.busV.toFixed(2)} V`);
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
    const base = { parts, pinsUsed };
    const peak = Math.max(...this.samples.map((s) => s.truth));
    const alarms = this.events.filter((e) => e.kind === "level" && (e.level ?? 0) >= 1 && e.text.indexOf("내려감") < 0);
    const h0 = this.env.heaterAt ?? 0;
    const firstAlarm = alarms.length ? alarms[0].t - h0 : null;
    // 히터 전원이 끊긴 첫 시각 (켜진 뒤)
    let cut: number | null = null;
    for (let i = 1; i < this.samples.length; i++) if (this.samples[i - 1].heat && !this.samples[i].heat) {
      cut = this.samples[i].t - h0;
      break;
    }
    if (this.bootFail)
      return { verdict: "boot", title: "부팅 실패", detail: "ESP32가 켜지지 않아 아무것도 측정하지 못했어요. 릴레이도 켜지지 않아 히터는 돌지 않았지만, 실제 장치였다면 감시가 전혀 없는 상태예요.", firstAlarm: null, cut: null, peakTruth: peak, falseAlarms: 0, ...base };
    if (this.env.heaterAt !== null && !this.samples.some((s) => s.heat)) {
      const why = !this.has("relay") ? "" : !this.ok("relay") ? "릴레이 핀이 동작하지 않아 히터에 전기가 가지 않았어요." : this.fault ? "처음부터 센서 고장 상태라 펌웨어가 히터를 켜 주지 않았어요." : "히터가 켜지지 않았어요.";
      return { verdict: "idle", title: "시작 못 함", detail: `${why} 셀은 안전했지만 장치가 제 일을 못 한 상태예요. 부품 · 핀 탭의 빨간 표시를 확인하세요.`, firstAlarm, cut: null, peakTruth: peak, falseAlarms: 0, ...base };
    }
    if (this.env.expect === "quiet") {
      const n = alarms.length;
      const cutAny = this.events.some((e) => e.kind === "cut");
      if (!n && !cutAny) return { verdict: "pass", title: "통과 — 조용히 지켜봄", detail: "셀은 정상이었고, 경보를 한 번도 내지 않았어요.", firstAlarm: null, cut: null, peakTruth: peak, falseAlarms: 0, ...base };
      return { verdict: "false", title: `잘못된 경보 ${n}번`, detail: `셀은 정상인데 ${alarms[0]?.t.toFixed(0)}초에 ‘${alarms[0]?.text}’ 경보를 냈어요.${cutAny ? " 히터 차단까지 했어요." : ""}`, firstAlarm: alarms[0]?.t ?? null, cut: null, peakTruth: peak, falseAlarms: n, ...base };
    }
    if (cut === null)
      return { verdict: "miss", title: "놓침 — 끝까지 데워짐", detail: `셀이 주변보다 ${peak.toFixed(1)} °C까지 데워졌는데 히터를 끊지 못했어요.`, firstAlarm, cut: null, peakTruth: peak, falseAlarms: 0, ...base };
    if (peak < 4.6) return { verdict: "pass", title: "통과 — 위험 전에 차단", detail: `히터를 켠 뒤 ${cut.toFixed(1)}초에 끊었고, 실제 셀은 최고 +${peak.toFixed(2)} °C에서 멈췄어요.`, firstAlarm, cut, peakTruth: peak, falseAlarms: 0, ...base };
    return { verdict: "late", title: "늦은 차단", detail: `${cut.toFixed(1)}초에 끊었지만 그때 실제 셀은 이미 +${peak.toFixed(2)} °C였어요. 센서가 셀을 제대로 못 느꼈어요.`, firstAlarm, cut, peakTruth: peak, falseAlarms: 0, ...base };
  }
}

export const defaultPresent = (): PartId[] => PARTS.map((p) => p.id);
