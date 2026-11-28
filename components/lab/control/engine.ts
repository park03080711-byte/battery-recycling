/* ─────────────────────────────────────────────
   LAB 03 관제실 — 기록 재생 엔진 (React 없음, 순수 함수)
   comm_run1.csv(PC가 받은 순서 그대로)를 'PC 수신 시각 T' 기준으로 잘라
   그 순간 관제 화면이 알 수 있었던 상태를 돌려준다.
   값은 펌웨어(ess_stage3)가 기록한 것을 그대로 쓰고, 다시 계산하는 것은
   위험지수 기여 막대 · 버퍼 개수(추정) · 판정 사유 문장뿐이다.
   ───────────────────────────────────────────── */

export type Lv = 0 | 1 | 2 | 3;
export const LV = ["정상", "주의", "경고", "위험"] as const;
const JOSA = ["으로", "로", "로", "으로"] as const;

/* 펌웨어 판정 기준 (ess_stage3.ino 그대로) */
export const RULE = {
  dt: [2.0, 3.0, 4.0] as const, // 주의 · 경고 · 위험 °C
  hyst: 0.3, // 내려갈 때 여유 °C
  slope: 0.03, // °C/s, 10초 이상이면 주의
  slopeHoldS: 10,
  etaS: 30, // 위험까지 예측 시간 < 30 s 이고 ΔT ≥ 2 → 경고
  mA: [23, 27, 32] as const,
  mANominal: 19.5,
  mV: { caution: 4300, warnLow: 4000, warnHigh: 5400, nominal: 4600 },
  weights: { T: 0.45, S: 0.3, I: 0.15, V: 0.1 },
  ring: 600, // ESP32 버퍼 (1초 × 600 = 10분)
} as const;

/* 직렬화용 묶음: [pc s, es s, seq, mV, mA, dT, slope, eta, risk, lv, heater, tripped, tx, rtt, dup, (fault)]
   값이 없으면(부품을 뺀 모의 실험 등) NaN */
export type Row = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number?];

export interface Pkt {
  i: number; // 도착 순번
  pc: number; // PC가 받은 시각 (첫 수신 기준, 초)
  es: number; // ESP32가 잰 시각 (첫 기록 기준, 초)
  seq: number;
  mV: number;
  mA: number;
  dT: number;
  slope: number;
  eta: number; // -1 = 예측 없음
  risk: number;
  lv: Lv;
  heat: boolean;
  trip: boolean;
  tx: number; // 몇 번째 전송에서 도착했나
  rtt: number;
  dup: boolean;
  fault: boolean; // 온도 센서 고장 (값 없음)
}

/* 기록의 출처 — 화면 이름표 · 범례 · 문구가 이것을 따른다 */
export interface Source {
  kind: "real" | "sim";
  src: string; // 상단 막대의 짧은 이름
  title: string; // 재생 대기 카드의 설명
  note?: string; // 설정 요약 (모의)
  ring: number; // ESP32 버퍼 크기 (0 = 버퍼 없음)
}
export const REAL_SOURCE: Source = { kind: "real", src: "comm_run1 · 2026-11-14", title: "2026-11-14 통신 실험", ring: RULE.ring };

/* CSV → Row[] (도착 순서). 서버(빌드)에서 한 번만 실행 */
export function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const head = lines[0].split(",");
  const c = (n: string) => {
    const k = head.indexOf(n);
    if (k < 0) throw new Error(`열 없음: ${n}`);
    return k;
  };
  const K = {
    pc: c("pc_ms"), seq: c("seq"), es: c("esp_ms"), mV: c("bus_mV"), mA: c("current_mA"), dT: c("dT_C"), slope: c("slope_Cps"),
    eta: c("eta_s"), risk: c("risk"), lv: c("level"), heat: c("heater"), trip: c("tripped"), tx: c("tx"), rtt: c("rtt_ms"), dup: c("duplicate"),
  };
  const raw = lines.slice(1).map((l) => l.split(",").map(Number));
  raw.sort((a, b) => a[K.pc] - b[K.pc]);
  const pc0 = raw[0][K.pc];
  const es0 = Math.min(...raw.map((r) => r[K.es]));
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return raw.map((r) => [
    r3((r[K.pc] - pc0) / 1000), r3((r[K.es] - es0) / 1000), r[K.seq], r[K.mV], r[K.mA], r[K.dT], r[K.slope],
    r[K.eta], r[K.risk], r[K.lv], r[K.heat], r[K.trip], r[K.tx], r[K.rtt], r[K.dup],
  ]);
}

const toPkt = (r: Row, i: number): Pkt => ({
  i, pc: r[0], es: r[1], seq: r[2], mV: r[3], mA: r[4], dT: r[5], slope: r[6], eta: r[7], risk: r[8],
  lv: Math.max(0, Math.min(3, r[9])) as Lv, heat: !!r[10], trip: !!r[11], tx: r[12], rtt: r[13], dup: !!r[14],
  fault: !!r[15] || Number.isNaN(r[5]),
});
export const fin = (v: number) => Number.isFinite(v);

export type EvKind = "heat-on" | "heat-off" | "up" | "down" | "trip" | "fault" | "boot" | "cut" | "back";
export interface Ev {
  kind: EvKind;
  es: number; // 장치 시각
  pc: number; // 관제실이 알게 된 시각
  lv?: Lv;
  title: string;
  detail: string;
  gapBefore?: number; // 바로 앞 순번이 몇 개 빠졌나 (> 0이면 실제로는 이보다 먼저 일어났을 수 있음)
}

export interface Late {
  kind: "boot" | "wifi";
  from: number; // es
  to: number;
  n: number;
}

export interface Run {
  pkts: Pkt[]; // 도착 순서
  bySeq: Pkt[]; // 순번 순, 중복 제외(처음 도착한 것)
  span: number; // 마지막 수신 PC 시각
  esMax: number;
  total: number; // 고유 기록 수
  offset: number; // 장치 시각 ≈ PC 시각 + offset
  late: Late[]; // 늦게 도착한 구간
  gap: { from: number; to: number } | null; // 가장 긴 수신 공백 (PC 시각)
  boot: { n: number; until: number } | null; // 수신 프로그램을 켜기 전에 쌓인 기록
  events: Ev[]; // 장치 · 통신 사건 (pc 순)
  marks: { heatOn?: Ev; trip?: Ev; cut?: Ev; fault?: Ev };
  lost: number; // 끝내 오지 않은 순번 수
  dtRange: [number, number]; // 그래프 세로축 (°C)
  source: Source;
}

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
export const mmss = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
export const mmssd = (s: number) => `${mmss(s)}.${Math.floor((Math.max(0, s) % 1) * 10)}`;
const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "—");

/* 펌웨어 levelFromTemp: 올라갈 때는 기준 그대로, 내려갈 때는 0.3 °C 더 내려가야 */
export function levelFromTemp(dT: number, cur: Lv): Lv {
  const m = (l: Lv) => (cur >= l ? RULE.hyst : 0);
  if (dT >= RULE.dt[2] - m(3)) return 3;
  if (dT >= RULE.dt[1] - m(2)) return 2;
  if (dT >= RULE.dt[0] - m(1)) return 1;
  return 0;
}

/* 이 기록에서 성립하는 펌웨어 판정 규칙 (단계가 높은 것부터) */
export function rulesAt(run: Run, p: Pkt, prev: Lv = p.lv): { lv: Lv; text: string }[] {
  const out: { lv: Lv; text: string }[] = [];
  if (p.fault) out.push({ lv: 2, text: "온도 센서 고장 · 히터 차단" });
  // prev: 판정 직전 단계 (올라가는 순간에는 내림 여유를 쓰지 않음)
  const lt = levelFromTemp(p.dT, prev);
  const near = (l: Lv) => (p.dT < RULE.dt[l - 1] ? " · 내림 여유 0.3 °C 안" : "");
  if (lt === 3) out.push({ lv: 3, text: `온도차 위험 기준 ${RULE.dt[2].toFixed(1)} °C${near(3)}` });
  if (p.mA >= RULE.mA[2]) out.push({ lv: 3, text: "과전류 위험" });
  if (lt === 2) out.push({ lv: 2, text: `온도차 경고 기준 ${RULE.dt[1].toFixed(1)} °C${near(2)}` });
  if (p.eta > 0 && p.eta < RULE.etaS && p.dT >= RULE.dt[0]) out.push({ lv: 2, text: "위험까지 30초 안 예측" });
  if (p.mA >= RULE.mA[1]) out.push({ lv: 2, text: "과전류 경고" });
  if (p.mV < RULE.mV.warnLow || p.mV > RULE.mV.warnHigh) out.push({ lv: 2, text: "전압 이상" });
  if (lt === 1) out.push({ lv: 1, text: `온도차 주의 기준 ${RULE.dt[0].toFixed(1)} °C${near(1)}` });
  // 상승률 조기 경보: 앞선 10초 기록이 모두 0.03 °C/s 이상
  const k = run.bySeq.indexOf(p);
  if (p.slope >= RULE.slope && k >= RULE.slopeHoldS) {
    const back = run.bySeq.slice(k - RULE.slopeHoldS, k);
    if (back.every((q) => q.slope >= RULE.slope)) out.push({ lv: 1, text: "상승 속도 0.03 °C/s 이상 10초" });
  }
  if (p.mA >= RULE.mA[0]) out.push({ lv: 1, text: "과전류 주의" });
  if (p.mV < RULE.mV.caution) out.push({ lv: 1, text: "저전압 주의" });
  return out;
}

/* 지금 단계를 사람이 읽을 문장으로 */
export function explain(run: Run, p: Pkt, prev: Lv = p.lv): { title: string; detail: string } {
  const tail = p.trip ? "히터 차단 유지 · 해제는 사람이 x 명령으로" : "";
  if (p.fault && p.lv >= 2) return { title: "온도 센서 고장", detail: ["ΔT를 믿을 수 없음 · 펌웨어가 경고로 올리고 히터를 끊음", tail].filter(Boolean).join(" · ") };
  if (p.lv === 0) {
    const d = `ΔT ${f2(p.dT)} °C · 주의 기준 2.0 °C 아래`;
    return { title: "이상 없음", detail: tail ? `${d} · ${tail}` : d };
  }
  const rules = rulesAt(run, p, prev);
  // 올라가는 순간: 1초 기록 사이에 기준을 넘었다 내려왔을 수 있어, 그 단계 규칙이 없으면 가장 높은 규칙
  const hit = rules.find((r) => r.lv === p.lv) ?? (prev < p.lv ? rules[0] : undefined);
  const cooling = p.slope < -0.005 ? " · 식는 중" : "";
  if (hit) return { title: hit.text, detail: [`ΔT ${f2(p.dT)} °C${cooling}`, tail].filter(Boolean).join(" · ") };
  return {
    title: "기준 아래 · 내릴지 확인 중",
    detail: [`5초 연속 기준 아래여야 한 단계 내림 · ΔT ${f2(p.dT)} °C`, tail].filter(Boolean).join(" · "),
  };
}

/* 위험지수 기여 (펌웨어 riskIndex 식으로 기록값에서 다시 계산) */
export function riskParts(p: Pick<Pkt, "dT" | "slope" | "mA" | "mV">) {
  const c = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
  const w = RULE.weights;
  return [
    { k: "온도차", v: 100 * w.T * c(p.dT / RULE.dt[2]), max: 100 * w.T },
    { k: "상승 속도", v: 100 * w.S * c(p.slope / 0.08), max: 100 * w.S },
    { k: "전류", v: 100 * w.I * c((p.mA - RULE.mANominal) / (RULE.mA[2] - RULE.mANominal)), max: 100 * w.I },
    { k: "전압", v: 100 * w.V * c((RULE.mV.nominal - p.mV) / (RULE.mV.nominal - RULE.mV.warnLow)), max: 100 * w.V },
  ];
}

export function buildRun(rows: Row[], source: Source = REAL_SOURCE): Run {
  const pkts = rows.map(toPkt);
  const first = new Map<number, Pkt>();
  for (const p of pkts) if (!first.has(p.seq)) first.set(p.seq, p);
  const bySeq = [...first.values()].sort((a, b) => a.seq - b.seq);
  const span = pkts.length ? pkts[pkts.length - 1].pc : 0;
  const esMax = bySeq.length ? Math.max(...bySeq.map((p) => p.es)) : 0;
  const offset = bySeq.length ? median(bySeq.map((p) => p.es - p.pc)) : 0;
  const lost = bySeq.length ? bySeq[bySeq.length - 1].seq - bySeq[0].seq + 1 - bySeq.length : 0;
  const dts = bySeq.map((p) => p.dT).filter(fin);
  const dtRange: [number, number] = [Math.min(-1.5, Math.floor(Math.min(0, ...dts) * 2) / 2 - 0.5), Math.max(5, Math.ceil(Math.max(0, ...dts) * 2) / 2 + 0.5)];

  // 늦게 도착한 구간: 제때 왔다면 받았을 시각보다 3초 넘게 늦은 연속 순번
  const late: Late[] = [];
  for (const p of bySeq) {
    if (p.pc - (p.es - offset) <= 3) continue;
    const L = late[late.length - 1];
    if (L && p.es - L.to <= 1.6) {
      L.to = p.es;
      L.n++;
    } else late.push({ kind: p.seq === bySeq[0].seq ? "boot" : "wifi", from: p.es, to: p.es, n: 1 });
  }

  let gap: Run["gap"] = null;
  for (let k = 1; k < pkts.length; k++) {
    const d = pkts[k].pc - pkts[k - 1].pc;
    if (d > 3 && (!gap || d > gap.to - gap.from)) gap = { from: pkts[k - 1].pc, to: pkts[k].pc };
  }
  const bootL = late.find((l) => l.kind === "boot");
  const boot = bootL ? { n: bootL.n, until: Math.max(...bySeq.filter((p) => p.es <= bootL.to).map((p) => p.pc)) } : null;

  const run: Run = { pkts, bySeq, span, esMax, total: bySeq.length, offset, late, gap, boot, events: [], marks: {}, lost, dtRange, source };

  const ev: Ev[] = [];
  if (boot)
    ev.push({ kind: "boot", es: offset, pc: boot.until, title: `밀린 기록 ${boot.n}개 도착`, detail: "수신 프로그램을 켜기 전 ESP32 버퍼에 쌓인 것" });
  for (let k = 1; k < bySeq.length; k++) {
    const p = bySeq[k], q = bySeq[k - 1];
    const gapBefore = p.seq - q.seq - 1;
    const n0 = ev.length;
    if (p.heat && !q.heat) ev.push({ kind: "heat-on", es: p.es, pc: p.pc, title: "히터 켜짐", detail: "충전 · 발열 상황 모사 (h 명령)" });
    const tripNow = p.trip && !q.trip;
    if (p.lv !== q.lv) {
      const up = p.lv > q.lv;
      const why = up ? explain(run, p, q.lv).title : `ΔT ${f2(p.dT)} °C${p.slope < -0.005 ? " · 식는 중" : ""}`;
      const title = `${LV[p.lv]}${JOSA[p.lv]} ${up ? "올라감" : "내려감"}${tripNow && p.lv === 3 ? " · 히터 차단" : ""}`;
      ev.push({ kind: tripNow && p.lv === 3 ? "trip" : up ? "up" : "down", es: p.es, pc: p.pc, lv: p.lv, title, detail: why });
    } else if (tripNow) ev.push({ kind: "trip", es: p.es, pc: p.pc, lv: 3, title: "히터 자동 차단", detail: "릴레이 GPIO 22 끊음 · 장치가 스스로" });
    if (p.fault && !q.fault) ev.push({ kind: "fault", es: p.es, pc: p.pc, lv: 2, title: "온도 센서 고장", detail: "ΔT 값이 끊김 · 펌웨어가 히터를 끊음" });
    if (!p.heat && q.heat && !tripNow) ev.push({ kind: "heat-off", es: p.es, pc: p.pc, title: "히터 꺼짐", detail: p.fault ? "센서 고장이라 장치가 끊음" : "" });
    if (gapBefore > 0) for (let j = n0; j < ev.length; j++) ev[j].gapBefore = gapBefore;
  }
  if (gap) {
    const n = pkts.filter((p) => p.pc >= gap.to && p.pc - (p.es - offset) > 3 && !p.dup).length;
    const sec = Math.round(gap.to - gap.from);
    ev.push({ kind: "cut", es: gap.from + offset, pc: gap.from + 3, title: "Wi-Fi 끊김", detail: source.ring ? "장치는 판정 · 차단을 계속, 기록은 버퍼에" : "장치는 판정 · 차단을 계속, 버퍼가 없어 기록은 버려짐" });
    ev.push({
      kind: "back", es: gap.to + offset, pc: gap.to,
      title: n ? `다시 연결 · 밀린 기록 ${n}개` : "다시 연결 · 밀린 기록 없음",
      detail: lost ? (n ? `버퍼가 작아 오래된 기록 ${lost}개는 사라짐` : `끊긴 ${sec}초 동안 기록 ${lost}개 사라짐`) : `끊긴 ${sec}초 동안 쌓인 것을 한꺼번에`,
    });
  }
  ev.sort((a, b) => a.pc - b.pc || a.es - b.es);
  run.events = ev;
  run.marks = { heatOn: ev.find((e) => e.kind === "heat-on"), trip: ev.find((e) => e.kind === "trip"), cut: ev.find((e) => e.kind === "cut"), fault: ev.find((e) => e.kind === "fault") };
  return run;
}

/* PC 수신 시각 T에 관제실이 알고 있던 것 */
export interface View {
  T: number;
  n: number; // 받은 패킷 수 (중복 포함)
  seen: Pkt[]; // 받은 고유 기록, 순번 순
  last: Pkt | null; // 가장 최근 순번
  lastPc: number; // 마지막으로 무언가 받은 PC 시각
  gap: number; // 마지막 수신 뒤 지난 시간
  cut: boolean; // 3초 넘게 아무것도 안 옴
  esNow: number; // 장치 시각(추정) = T + offset
  burst: number; // 최근 1초에 받은 패킷 수
  pending: number; // ESP32 버퍼에 쌓였을 기록 수 (추정)
  resent: number; // 재전송으로 도착한 수
  dups: number; // 중복으로 버린 수
  missing: number; // 지금까지 받은 마지막 순번 앞에서 빠진 순번 수 (밀린 기록이 다 오면 = 사라진 기록)
  arrivals: Pkt[]; // 최근 도착 (터미널용)
  events: Ev[]; // 이미 알게 된 사건
}

export function countAt(run: Run, T: number) {
  let lo = 0, hi = run.pkts.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (run.pkts[m].pc <= T) lo = m + 1;
    else hi = m;
  }
  return lo;
}

export function viewAt(run: Run, T: number, tailN = 7): View {
  const n = countAt(run, T);
  const got = run.pkts.slice(0, n);
  const m = new Map<number, Pkt>();
  for (const p of got) if (!m.has(p.seq)) m.set(p.seq, p);
  const seen = [...m.values()].sort((a, b) => a.seq - b.seq);
  const last = seen.length ? seen[seen.length - 1] : null;
  const lastPc = n ? got[n - 1].pc : 0;
  const gap = n ? T - lastPc : T;
  const cut = n > 0 && gap > 3;
  const burst = got.filter((p) => p.pc > T - 1).length;
  const esNow = T + run.offset;
  const pending = cut && last ? Math.min(run.source.ring, Math.max(0, Math.round(esNow - last.es))) : 0;
  const events = run.events.filter((e) => e.pc <= T);
  if (cut && !events.some((e) => e.kind === "cut" && e.pc <= T)) {
    events.push({ kind: "cut", es: lastPc + run.offset + 3, pc: lastPc + 3, title: "Wi-Fi 끊김", detail: "장치는 판정 · 차단을 계속" });
  }
  return {
    T, n, seen, last, lastPc, gap, cut, esNow, burst, pending,
    resent: got.reduce((a, p) => a + (p.tx > 1 ? 1 : 0), 0),
    dups: got.reduce((a, p) => a + (p.dup ? 1 : 0), 0),
    missing: last && seen.length ? last.seq - seen[0].seq + 1 - seen.length : 0,
    arrivals: got.slice(-tailN),
    events,
  };
}

/* 히터를 켠 뒤 각 단계에 닿기까지 */
export function reach(run: Run) {
  const h = run.marks.heatOn;
  if (!h) return [];
  const up = (l: Lv) => run.events.find((e) => (e.kind === "up" || e.kind === "trip") && e.lv === l && e.es >= h.es);
  const t = run.marks.trip;
  const back = t ? run.events.find((e) => e.kind === "down" && e.lv === 0 && e.es > t.es) : undefined;
  return [
    { k: "주의", lv: 1 as Lv, ev: up(1), from: h },
    { k: "경고", lv: 2 as Lv, ev: up(2), from: h },
    { k: "위험 · 차단", lv: 3 as Lv, ev: up(3), from: h },
    { k: "정상 복귀", lv: 0 as Lv, ev: back, from: t ?? h },
  ].filter((r) => r.ev) as { k: string; lv: Lv; ev: Ev; from: Ev }[];
}
