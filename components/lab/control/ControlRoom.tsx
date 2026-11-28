"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CrChart } from "./CrChart";
import { CrPlant, alarms } from "./CrPlant";
import Link from "next/link";
import { buildRun, explain, fin, LV, mmss, mmssd, reach, riskParts, RULE, viewAt, type Ext, type Lv, type Row, type Source } from "./engine";
import { PRESETS } from "./presets";

const SPEEDS = [1, 10, 30] as const;
type Speed = (typeof SPEEDS)[number];
type Perm = "na" | "default" | "granted" | "denied";

/* 단계 아이콘: 색만이 아니라 모양으로도 구분 (정상 ○ · 주의 ▲ · 경고 ▲! · 위험 ⯃) */
function LvIcon({ lv }: { lv: Lv }) {
  if (lv === 0)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  if (lv === 1)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9.5 17h-19z" fill="currentColor" />
      </svg>
    );
  if (lv === 2)
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9.5 17h-19z" fill="currentColor" />
        <path d="M12 9.5v4.5" stroke="var(--cr-cut)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.3" fill="var(--cr-cut)" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8z" fill="currentColor" />
      <path d="M8 12h8" stroke="var(--cr-cut)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

const TERM_LV = ["NORM", "CAUT", "WARN", "DANG"];

/* 최근 60초 흐름 (작은 선 그래프) — 기준선은 점선 */
function Spark({ pts, lines = [], min }: { pts: [number, number][]; lines?: number[]; min?: number }) {
  const W = 200, H = 34;
  const ok = pts.filter(([, v]) => fin(v));
  if (ok.length < 2) return <svg className="cr-spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" />;
  const t0 = pts[pts.length - 1][0] - 60;
  const vs = ok.map(([, v]) => v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (min !== undefined) lo = Math.min(lo, min);
  const span0 = Math.max(hi - lo, 0.5);
  const near = lines.filter((l) => l > lo - span0 * 0.3 && l < hi + span0 * 0.3);
  lo = Math.min(lo, ...near);
  hi = Math.max(hi, ...near);
  if (hi - lo < 1e-6) hi = lo + 1;
  const x = (t: number) => ((t - t0) / 60) * W;
  const y = (v: number) => H - 3 - ((v - lo) / (hi - lo)) * (H - 6);
  let d = "";
  pts.forEach(([t, v], i) => {
    if (!fin(v)) return;
    const brk = i === 0 || !fin(pts[i - 1][1]);
    d += `${brk ? "M" : "L"}${x(t).toFixed(1)} ${y(v).toFixed(1)}`;
  });
  return (
    <svg className="cr-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {near.map((l) => (
        <path key={l} d={`M0 ${y(l)}H${W}`} className="cr-spark-thr" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={d} className="cr-spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* 위험지수 반원 게이지 */
function Gauge({ v, lv, empty }: { v: number; lv: Lv; empty: boolean }) {
  const a = Math.PI * (1 - Math.max(0, Math.min(100, v)) / 100);
  const R = 46, cx = 56, cy = 54;
  const px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
  return (
    <svg className={`cr-gauge l${lv}`} viewBox="0 0 112 66" role="img" aria-label={empty ? "위험지수 없음" : `위험지수 ${v} / 100`}>
      <path d={`M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}`} className="cr-gauge-bg" />
      {!empty && v > 0 && <path d={`M${cx - R} ${cy}A${R} ${R} 0 0 1 ${px.toFixed(1)} ${py.toFixed(1)}`} className="cr-gauge-fg" />}
      {[0, 25, 50, 75, 100].map((t) => {
        const b = Math.PI * (1 - t / 100);
        return <path key={t} d={`M${cx + (R - 9) * Math.cos(b)} ${cy - (R - 9) * Math.sin(b)}L${cx + (R - 5) * Math.cos(b)} ${cy - (R - 5) * Math.sin(b)}`} className="cr-gauge-tick" />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="cr-gauge-v">
        {empty ? "—" : v}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" className="cr-gauge-k">
        위험지수
      </text>
    </svg>
  );
}

/* 예측 시간 막대: 0 ~ 60 s, 30 s 아래가 경고 구간 */
function EtaBar({ eta }: { eta: number | null }) {
  const p = eta === null ? null : Math.max(0, Math.min(1, eta / 60));
  return (
    <div className="cr-etabar" aria-hidden="true">
      <span className="zone" />
      {p !== null && <i style={{ left: `${p * 100}%` }} />}
      <em>0</em>
      <em style={{ left: "50%" }}>30 s</em>
      <em style={{ left: "100%" }}>60+</em>
    </div>
  );
}

/* 브라우저 알림 권한 (허용 · 거부가 바뀌면 다시 읽음) */
const readPerm = (): Perm => (typeof window !== "undefined" && "Notification" in window ? (Notification.permission as Perm) : "na");
function subscribePerm(cb: () => void) {
  let st: PermissionStatus | null = null;
  navigator.permissions
    ?.query({ name: "notifications" as PermissionName })
    .then((s) => {
      st = s;
      s.addEventListener("change", cb);
    })
    .catch(() => {});
  return () => st?.removeEventListener("change", cb);
}

type SimData = { rows: Row[]; source: Source; ext: Ext; preset: string | null; hash: string };

export function ControlRoom({ rows }: { rows: Row[] }) {
  const realRun = useMemo(() => buildRun(rows), [rows]);
  const [mode, setMode] = useState<"real" | "sim">("real");
  const [sim, setSim] = useState<SimData | null>(null);
  const [busy, setBusy] = useState(false);
  const simRun = useMemo(() => (sim ? buildRun(sim.rows, sim.source, sim.ext) : null), [sim]);
  const run = mode === "sim" && simRun ? simRun : realRun;
  const isSim = run.source.kind === "sim";
  const span = run.span;
  const [T, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState<Speed>(10);
  const [notifOn, setNotifOn] = useState(false);
  const [say, setSay] = useState("");
  const [acked, setAcked] = useState<Set<string>>(() => new Set());
  const tRef = useRef(0);
  const speedRef = useRef<Speed>(10);

  const view = useMemo(() => viewAt(run, T, 7), [run, T]);
  const { last, cut } = view;
  const lv: Lv = last ? last.lv : 0;

  /* 재생 시계: 0.1초마다 실제 흐른 시간 × 배속만큼 T를 민다.
     (탭이 뒤로 가도 interval은 느리게나마 돌아서 시간은 계속 흐른다 → 알림 가능) */
  useEffect(() => {
    if (!playing) return;
    let prev = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const next = Math.min(span, tRef.current + ((now - prev) / 1000) * speedRef.current);
      prev = now;
      tRef.current = next;
      setT(next);
      if (next >= span) setPlaying(false);
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, span]);

  const seek = useCallback((t: number, play?: boolean) => {
    const v = Math.max(0, Math.min(span, t));
    tRef.current = v;
    setT(v);
    setStarted(true);
    if (play !== undefined) setPlaying(play);
  }, [span]);

  const toggle = () => {
    setStarted(true);
    if (!playing && tRef.current >= span - 0.05) seek(0);
    setPlaying((p) => !p);
  };

  /* 기록 출처 바꾸기: 모의 실험은 고를 때 가상 장치를 불러와 끝까지 돌린다 */
  const setHash = (h: string) => {
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + h);
    } catch {
      /* 주소를 못 바꿔도 화면은 그대로 */
    }
  };
  const restart = (play: boolean) => {
    tRef.current = 0;
    setT(0);
    setStarted(play);
    setPlaying(play);
  };
  const loadSim = useCallback(async (pick: { preset: string } | { hash: string }, play: boolean) => {
    try {
      const m = await import("./fromSim");
      const cfg = "preset" in pick ? m.presetCfg(pick.preset) : m.cfgFromHash(pick.hash);
      if (!cfg) return;
      const { rows: simRowsOut, source, ext } = m.simRows(cfg);
      const hash = m.hashOf(cfg);
      setSim({ rows: simRowsOut, source, ext, preset: m.presetOf(cfg), hash });
      setMode("sim");
      setHash(hash);
      tRef.current = 0;
      setT(0);
      setStarted(play);
      setPlaying(play);
    } finally {
      setBusy(false);
    }
  }, []);
  const useReal = () => {
    setMode("real");
    setHash("");
    restart(true);
  };
  // LAB 02에서 넘어온 주소(#c=… · #sim)면 그 설정으로 — 재생은 버튼을 눌러야 시작
  useEffect(() => {
    const h = window.location.hash;
    if (h === "#sim" || h.startsWith("#c=")) void loadSim({ hash: h }, false);
  }, [loadSim]);

  /* 알림: 허용한 사람만, 이 탭을 보고 있지 않을 때, 위험 단계 · 통신 끊김만 */
  const perm = useSyncExternalStore(subscribePerm, readPerm, () => "na" as Perm);
  const askNotify = async () => {
    if (perm === "granted") return setNotifOn((v) => !v);
    if (perm !== "default") return;
    try {
      setNotifOn((await Notification.requestPermission()) === "granted");
    } catch {
      setNotifOn(false);
    }
  };

  const prevLv = useRef<Lv>(0);
  const prevCut = useRef(false);
  useEffect(() => {
    const lvUp = lv !== prevLv.current;
    const cutChg = cut !== prevCut.current;
    const wasLv = prevLv.current;
    prevLv.current = lv;
    prevCut.current = cut;
    if (!playing || (!lvUp && !cutChg)) return;
    let msg = "";
    if (cutChg) msg = cut ? "통신 끊김. 마지막으로 받은 상태를 보여 줍니다." : "다시 연결됨. 밀린 기록이 들어옵니다.";
    if (lvUp && last) msg = `${LV[lv]} 단계. ${explain(run, last).title}.` + (msg ? ` ${msg}` : "");
    setSay(msg);
    const notify = (title: string, body: string) => {
      if (!notifOn || document.visibilityState === "visible") return;
      try {
        new Notification(title, { body, tag: "re-cell-control-room" });
      } catch {
        /* 휴대폰 브라우저는 페이지에서 바로 알림을 못 띄움 — 화면 안 경보로 충분 */
      }
    };
    if (lvUp && lv === 3 && wasLv < 3 && last) notify("관제실 · 위험 단계", `ΔT ${last.dT.toFixed(2)} °C · 히터 자동 차단`);
    if (cutChg && cut) notify("관제실 · 통신 끊김", "ESP32는 판정과 차단을 계속합니다. 기록은 다시 연결되면 들어옵니다.");
  }, [lv, cut, playing, last, notifOn, run]);

  const jumps = [
    run.marks.heatOn && { k: "heat", t: "히터 켜짐", long: "히터 켜는 순간", at: run.marks.heatOn.pc - 4, tick: run.marks.heatOn.pc },
    run.marks.trip && { k: "trip", t: "차단", long: "위험 · 차단", at: run.marks.trip.pc - 8, tick: run.marks.trip.pc },
    run.marks.fault && { k: "fault", t: "센서 고장", long: "센서 고장", at: run.marks.fault.pc - 4, tick: run.marks.fault.pc },
    run.gap && { k: "cut", t: "끊김", long: "Wi-Fi 끊김", at: run.gap.from - 2, tick: run.gap.from },
  ].filter(Boolean) as { k: string; t: string; long: string; at: number; tick: number }[];

  // ── 값 ──
  const r = last;
  const why = r ? explain(run, r) : { title: "수신 대기", detail: "아직 받은 기록이 없습니다" };
  const parts = r ? riskParts(r) : [];
  const rtt = !cut && r ? view.arrivals[view.arrivals.length - 1]?.rtt ?? r.rtt : null;
  const gapS = Math.round(view.gap);
  const burst = view.burst > 3;
  const reached = reach(run);
  const REACH_MAX = Math.max(130, Math.ceil((Math.max(0, ...reached.filter((x) => x.lv > 0).map((x) => x.ev.es - x.from.es)) + 8) / 10) * 10);
  const ring = run.source.ring;
  const log = [...view.events].sort((a, b) => a.es - b.es).slice(-5).reverse();
  const al = alarms(run, r);
  // 최근 60초 흐름: 받은 기록 중 장치 시각 기준
  const trend = (f: (p: (typeof view.seen)[number]) => number): [number, number][] => {
    if (!r) return [];
    const from = r.es - 60;
    const out: [number, number][] = [];
    for (let k = view.seen.length - 1; k >= 0 && view.seen[k].es >= from; k--) out.push([view.seen[k].es, f(view.seen[k])]);
    return out.reverse();
  };
  const site = r?.site;
  const sens = run.source.sensors;
  const siteN = (sens.includes("dht") ? 1 : 0) + (sens.includes("sonar") ? 1 : 0) + (sens.includes("accel") ? 1 : 0) + (sens.includes("reed") || sens.includes("pir") ? 1 : 0);
  const v1 = (v: number | null | undefined, d = 1) => (v === null || v === undefined || !fin(v) ? "—" : v.toFixed(d));
  const siteTiles = sens.length ? (
    <>
      {sens.includes("dht") && (
        <div className={`cr-tile cr-m${al.dht ? ` al l${al.dht}` : ""}`}>
          <p className="cr-k">
            함체 습도 · 이슬점<span>DHT11</span>
          </p>
          <p className="cr-v">
            {v1(site?.rh, 0)}
            <small>%</small>
          </p>
          <Spark pts={trend((p) => p.site?.rh ?? NaN)} />
          <p className="cr-s">
            공기 {v1(site?.airT, 0)} °C · 이슬점 {v1(site?.dew)} °C
          </p>
        </div>
      )}
      {sens.includes("sonar") && (
        <div className={`cr-tile cr-m${al.sonar ? ` al l${al.sonar}` : ""}`}>
          <p className="cr-k">
            바닥 물 높이<span>초음파 HC-SR04</span>
          </p>
          <p className="cr-v">
            {v1(site?.floor)}
            <small>mm</small>
          </p>
          <Spark pts={trend((p) => p.site?.floor ?? NaN)} lines={[5]} min={0} />
          <p className="cr-s">기준 5 mm · 물받이 바닥에서</p>
        </div>
      )}
      {sens.includes("accel") && (
        <div className={`cr-tile cr-m${al.accel ? ` al l${al.accel}` : ""}`}>
          <p className="cr-k">
            기울기 · 충격<span>ADXL335</span>
          </p>
          <p className="cr-v">
            {v1(site?.tilt, 0)}
            <small>°</small>
          </p>
          <Spark pts={trend((p) => p.site?.tilt ?? NaN)} min={0} />
          <p className="cr-s">충격 {v1(site?.shock, 1)} g</p>
        </div>
      )}
      {(sens.includes("reed") || sens.includes("pir")) && (
        <div className={`cr-tile cr-m${al.reed || al.pir ? ` al l${Math.max(al.reed ?? 0, al.pir ?? 0)}` : ""}`}>
          <p className="cr-k">
            문 · 사람<span>리드 · 인체감지</span>
          </p>
          <p className="cr-v">{sens.includes("reed") ? (site?.door ? "열림" : "닫힘") : "—"}</p>
          <p className="cr-s">{sens.includes("pir") ? (site?.person ? "사람 있음" : "사람 없음") : ""}</p>
          <p className="cr-s dim">문이 열리면 ‘정비 중’ · 충전 정지</p>
        </div>
      )}
    </>
  ) : null;

  /* 경보 확인: 새 경보는 깜빡이고, 확인하면 멈춘다 */
  const alarmKinds = ["up", "trip", "fault", "cut"];
  const evKey = (e: { kind: string; es: number }) => `${run.source.src}|${e.kind}|${e.es.toFixed(1)}`;
  const unacked = view.events.filter((e) => alarmKinds.includes(e.kind) && !acked.has(evKey(e)));
  const ack = (keys: string[]) => setAcked((a) => new Set([...a, ...keys]));
  const etaOk = !!r && r.eta > 0 && !r.fault; // 센서 고장이면 예측도 멈춘 값
  const etaWarn = etaOk && r!.eta < RULE.etaS;

  /* 좁은 화면에서 계통도 아래에 붙는 세로 신호 경로 */
  const pathEl = (
    <div className="cr-path">
      <p className="cr-path-h">SIGNAL PATH · 1 s 주기</p>
      <ol>
        <li className="cr-node">
          <b>ESP32</b>
          <span>측정 · 판정 · 차단</span>
          <code>{r ? `seq #${r.seq} · ${mmssd(r.es)}` : "—"}</code>
        </li>
        <li className={`cr-link${cut ? " bad" : burst ? " burst" : ""}`}>
          <span>{cut ? `Wi-Fi 끊김 · ${gapS} s` : burst ? `밀린 기록 한꺼번에 · 초당 ${view.burst}개` : "UDP 패킷 → ← ACK"}</span>
          <code>{ring ? `버퍼 ${cut ? `약 ${view.pending}` : 0} / ${ring} · 재전송 ${view.resent}` : `버퍼 없음 · 재전송 ${view.resent}`}</code>
        </li>
        <li className="cr-node">
          <b>PC 수신</b>
          <span>pc_receiver.py</span>
          <code className={!cut && !burst && view.missing ? "bad" : undefined}>
            {cut ? `마지막 수신 ${gapS} s 전` : !burst && view.missing ? `빠진 순번 ${view.missing}개 · 왕복 ${rtt} ms` : rtt !== null && view.n ? `왕복 ${rtt} ms · 중복 ${view.dups}` : "대기"}
          </code>
        </li>
        <li className="cr-link short">
          <span>화면 갱신</span>
          <code>0.1 s</code>
        </li>
        <li className="cr-node is-here">
          <b>관제실</b>
          <span>이 화면</span>
          <code>
            받은 기록 {view.seen.length} / {run.total}
          </code>
        </li>
      </ol>
    </div>
  );

  return (
    <section className="cr" aria-label="관제 화면">
      <div className="cr-srcbar">
        <div className="cr-srctabs" role="group" aria-label="기록 출처">
          <button type="button" aria-pressed={mode === "real"} onClick={useReal}>
            실측 기록<small>LAB 01 통신 실험</small>
          </button>
          <button type="button" aria-pressed={mode === "sim"} onClick={() => {
              setBusy(true);
              void loadSim({ preset: sim?.preset ?? "heat" }, true);
            }}>
            모의 실험<small>LAB 02 가상 장치</small>
          </button>
        </div>
        {mode === "sim" && sim && (
          <>
            <label className="cr-preset">
              <span>시나리오</span>
              <select value={sim.preset ?? "custom"} onChange={(e) => {
                  if (e.target.value === "custom") return;
                  setBusy(true);
                  void loadSim({ preset: e.target.value }, true);
                }} disabled={busy}>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {!sim.preset && <option value="custom">LAB 02에서 가져온 설정</option>}
              </select>
            </label>
            <Link className="cr-tolab" href={`/lab/virtual-esp32${sim.hash === "#sim" ? "" : sim.hash}`}>
              LAB 02에서 이 설정 바꾸기 →
            </Link>
          </>
        )}
        {busy && <span className="cr-busy">가상 장치 돌리는 중…</span>}
      </div>
      {mode === "sim" && sim && (
        <p className="cr-srcnote">
          <b>{sim.preset ? PRESETS.find((p) => p.id === sim.preset)?.note : "LAB 02에서 바꾼 설정"}</b>
          <span>{sim.source.note}</span>
        </p>
      )}
      <div className={`cr-console${started ? "" : " is-idle"}`} data-lv={lv} data-cut={cut || undefined}>
        <div className="cr-body" inert={!started}>
        <div className="cr-bar">
          <span className="cr-name">관제 화면</span>
          <span className={`cr-src${isSim ? " sim" : ""}`}>{run.source.src}</span>
          <span className="cr-clock">
            PC 수신 <b>{mmss(T)}</b>
            <i aria-hidden="true">·</i>
            장치 <b>{mmss(view.esNow)}</b>
          </span>
          {perm !== "na" && (
            <button
              type="button"
              className="cr-notify"
              onClick={askNotify}
              disabled={perm === "denied"}
              aria-pressed={perm === "granted" ? notifOn : undefined}
              title={perm === "denied" ? "브라우저 설정에서 이 사이트 알림을 허용해야 해요" : "이 탭을 보고 있지 않을 때 위험 단계 · 통신 끊김만 알려요"}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1.8a4 4 0 0 0-4 4v2.6L2.6 11h10.8L12 8.4V5.8a4 4 0 0 0-4-4zM6.4 12.6a1.6 1.6 0 0 0 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
              {perm === "denied" ? "알림 막힘" : perm === "granted" ? (notifOn ? "알림 켜짐" : "알림 꺼짐") : "알림 받기"}
            </button>
          )}
          <a href="#cr-log" className={`cr-unack${unacked.length ? " on" : ""}`}>
            미확인 경보 <b>{unacked.length}</b>
          </a>
          <span className={`cr-pill${cut ? " bad" : ""}`}>
            <i aria-hidden="true" />
            {!view.n ? "연결 대기" : cut ? `통신 끊김 ${gapS} s` : burst ? "밀린 기록 수신 중" : rtt ? `연결됨 · ${rtt} ms` : "연결됨"}
          </span>
        </div>

        {cut && (
          <div className="cr-alert" role="status">
            <b>마지막 수신 {gapS}초 전.</b> 아래 값은 마지막으로 받은 상태예요. 장치는 판정 · 차단을 계속하고, 기록은 다시 연결되면 들어옵니다.
          </div>
        )}

        <div className="cr-grid">
          <div className="cr-tile cr-plant">
            <p className="cr-k">
              설비 계통도<span>함체 · ESP32 · 관제 통신</span>
            </p>
            <CrPlant run={run} view={view} extra={pathEl} />
          </div>

          <div className={`cr-tile cr-lvl l${lv}`}>
            <p className="cr-k">
              현재 단계{cut ? " · 마지막 수신" : ""}
              <span>LV {lv}</span>
            </p>
            <p className="cr-badge">
              <LvIcon lv={lv} />
              {LV[lv]}
            </p>
            <p className="cr-reason">
              {why.title}
              <small>{why.detail}</small>
            </p>
            <ol className="cr-ladder" aria-label="단계">
              {LV.map((n, i) => (
                <li key={n} className={i <= lv ? `on l${lv}` : ""} aria-current={i === lv ? "step" : undefined}>
                  {n}
                </li>
              ))}
            </ol>
            <div className="cr-riskbox">
              <Gauge v={r ? r.risk : 0} lv={lv} empty={!r} />
              <div>
                <p className="cr-k sm">
                  위험지수 기여<span>{isSim ? "재계산" : "기록값으로 재계산"}</span>
                </p>
                <ul className="cr-contrib" aria-label="위험지수 항목별 기여">
                  {(parts.length ? parts : riskParts({ dT: 0, slope: 0, mA: 0, mV: RULE.mV.nominal })).map((p) => (
                    <li key={p.k}>
                      <span>{p.k}</span>
                      <b>
                        <i style={{ width: `${(p.v / p.max) * 100}%` }} />
                      </b>
                      <em>{Math.round(p.v)}</em>
                    </li>
                  ))}
                </ul>
                {r?.fault && <p className="cr-s bad">센서 고장 · 멈춘 온도값 기준</p>}
              </div>
            </div>
          </div>

          <div className={`cr-tile cr-m${al.cell ? ` al l${al.cell}` : ""}`}>
            <p className="cr-k">
              셀 − 주변 ΔT<span>DS18B20 − NTC</span>
            </p>
            <p className="cr-v">
              {r && fin(r.dT) && !r.fault ? r.dT.toFixed(2) : "—"}
              <small>°C</small>
            </p>
            <Spark pts={trend((p) => (p.fault ? NaN : p.dT))} lines={[...RULE.dt]} />
            <p className={`cr-s${r?.fault ? " bad" : ""}`}>{!r ? "\u00a0" : r.fault ? (fin(r.dT) ? `센서 고장 · ${r.dT.toFixed(2)}에서 멈춤` : "센서 고장 · 값 없음") : `${r.slope >= 0 ? "▲" : "▼"} ${Math.abs(r.slope).toFixed(4)} °C/s`}</p>
          </div>

          <div className={`cr-tile cr-m${etaWarn && r && r.dT >= RULE.dt[0] ? " hot" : ""}`}>
            <p className="cr-k">
              4 °C 도달 예측<span>(4 − ΔT) ÷ 기울기</span>
            </p>
            <p className="cr-v">
              {etaOk ? r!.eta : "—"}
              <small>{etaOk ? "s" : ""}</small>
            </p>
            <EtaBar eta={etaOk ? r!.eta : null} />
            <p className="cr-s">
              {!r ? "\u00a0" : r.fault ? "센서 고장 · 예측 멈춤" : r.eta > 0 ? (etaWarn ? (r.dT >= RULE.dt[0] ? "30 s 미만 · 경고 조건" : "ΔT 2 °C 미만이라 예측 경고 쉼") : "경고 기준 30 s 미만") : r.trip ? "차단 뒤 식는 중" : "오르지 않음"}
            </p>
          </div>

          <div className={`cr-tile cr-m${al.shunt ? ` al l${al.shunt}` : ""}`}>
            <p className="cr-k">
              전류 · 히터<span>션트 22 Ω</span>
            </p>
            <p className="cr-v">
              {r && fin(r.mA) ? r.mA.toFixed(1) : "—"}
              <small>mA</small>
            </p>
            <Spark pts={trend((p) => p.mA)} lines={[...RULE.mA]} min={0} />
            <p className={`cr-s${!r?.heat && (r?.trip || r?.fault) ? " bad" : ""}`}>{!r ? "\u00a0" : r.heat ? "히터 켜짐 · 정상 약 19.5 mA" : r.trip ? "히터 차단 (위험)" : r.fault ? "히터 정지 (센서 고장)" : "히터 꺼짐"}</p>
          </div>

          <div className={`cr-tile cr-m${al.bus ? ` al l${al.bus}` : ""}`}>
            <p className="cr-k">
              5 V 버스 전압<span>분압 10k + 10k</span>
            </p>
            <p className="cr-v">
              {r && fin(r.mV) ? (r.mV / 1000).toFixed(2) : "—"}
              <small>V</small>
            </p>
            <Spark pts={trend((p) => p.mV / 1000)} lines={[RULE.mV.caution / 1000]} />
            <p className="cr-s">주의 4.30 V 아래 · 경고 4.00 V 아래</p>
          </div>

          {siteTiles}

          <div className={`cr-tile cr-reach${siteN === 1 ? " w9" : siteN === 2 ? " w6" : ""}`}>
            <p className="cr-k">
              히터 켠 뒤 단계 도달<span>장치 시각 차이</span>
            </p>
            {run.marks.heatOn && run.marks.heatOn.pc <= T ? (
              <>
                <div className="cr-reach-track" aria-hidden="true">
                  <span className="cr-reach-rail" />
                  <span className="cr-reach-0">ON</span>
                  {reached
                    .filter((x) => x.lv > 0)
                    .map((x, i, arr) => {
                      const s = x.ev.es - x.from.es;
                      const on = x.ev.pc <= T;
                      // 앞 표시와 가까우면 글자를 레일 아래로
                      const low = i > 0 && (s - (arr[i - 1].ev.es - arr[i - 1].from.es)) / REACH_MAX < 0.16 && !(i > 1 && (arr[i - 1].ev.es - arr[i - 2].ev.es) / REACH_MAX < 0.16);
                      return (
                        <span key={x.k} className={`cr-reach-mk l${x.lv}${on ? " on" : ""}${low ? " low" : ""}`} style={{ left: `${(s / REACH_MAX) * 100}%` }}>
                          <i />
                          <em>{on ? `${x.ev.gapBefore ? "≤ " : ""}+${s.toFixed(1)} s` : ""}</em>
                        </span>
                      );
                    })}
                  {last && !last.trip && <span className="cr-reach-now" style={{ left: `${Math.min(100, ((last.es - run.marks.heatOn.es) / REACH_MAX) * 100)}%` }} />}
                </div>
                <dl className="cr-reach-list">
                  {reached.map((x) => {
                    const on = x.ev.pc <= T;
                    return (
                      <div key={x.k} className={on ? `on l${x.lv}` : ""}>
                        <dt>{x.k}</dt>
                        <dd title={x.ev.gapBefore ? `바로 앞 기록 ${x.ev.gapBefore}개가 사라져 실제로는 이보다 먼저 일어났어요` : undefined}>
                          {on ? `${x.lv === 0 ? "차단 뒤 " : ""}${x.ev.gapBefore ? "≤ " : ""}+${(x.ev.es - x.from.es).toFixed(1)} s` : "—"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </>
            ) : (
              <p className="cr-s cr-empty">히터가 켜지면 단계마다 걸린 시간을 잽니다.</p>
            )}
          </div>

          <div className="cr-tile cr-chart">
            <p className="cr-k">
              온도차 ΔT · 전류<span>가로축 = ESP32가 잰 시각</span>
            </p>
            <CrChart run={run} view={view} />
          </div>

          <div className="cr-side">
            <div className="cr-tile" id="cr-log">
              <p className="cr-k">
                경보 기록
                {unacked.length ? (
                  <button type="button" className="cr-ackall" onClick={() => ack(unacked.map(evKey))}>
                    모두 확인 ({unacked.length})
                  </button>
                ) : (
                  <span>최근 5건</span>
                )}
              </p>
              {log.length ? (
                <ul className="cr-log">
                  {log.map((e) => {
                    const lateE = e.pc - (e.es - run.offset) > 3 && e.kind !== "boot" && e.kind !== "back" && e.kind !== "cut";
                    const tag = e.kind === "cut" || e.kind === "back" || e.kind === "boot" ? "통신" : e.kind.startsWith("heat") ? "히터" : e.kind === "fault" ? "고장" : LV[e.lv ?? 0];
                    const cls = e.kind === "cut" || e.kind === "back" || e.kind === "boot" || e.kind.startsWith("heat") ? "tc" : `t${e.lv}`;
                    return (
                      <li key={`${e.kind}${e.es}`} className={alarmKinds.includes(e.kind) && !acked.has(evKey(e)) ? `new l${e.kind === "cut" ? 1 : e.lv ?? 1}` : undefined}>
                        <time>{mmss(e.es)}</time>
                        <span className={`cr-t ${cls}`}>{tag}</span>
                        <p>
                          {e.title}
                          {lateE && <em className="cr-late-tag">늦게 받음</em>}
                          {!!e.gapBefore && <em className="cr-late-tag bad">앞 기록 {e.gapBefore}개 빠짐</em>}
                          {e.detail && <small>{e.detail}</small>}
                        </p>
                        {alarmKinds.includes(e.kind) && !acked.has(evKey(e)) && (
                          <button type="button" className="cr-ack" onClick={() => ack([evKey(e)])} aria-label={`${e.title} 확인`}>
                            확인
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="cr-s cr-empty">아직 사건이 없습니다.</p>
              )}
            </div>
            <div className="cr-term" role="log" aria-label="수신 패킷 (최근 7개)">
              <p className="cr-term-h">
                <span>수신 패킷</span>
                <span>
                  {view.seen.length} / {run.total}
                </span>
              </p>
              {view.arrivals.map((p) => (
                <div key={p.i} className="cr-row">
                  <span className="d">{mmssd(p.es)}</span> #{String(p.seq).padStart(3, "0")} <span className="w">ΔT</span>{" "}
                  <span className={`l${p.lv}`}>{(fin(p.dT) && !p.fault ? p.dT.toFixed(2) : " ---").padStart(5, " ")}</span> <span className={p.lv ? `l${p.lv}` : "ok"}>{TERM_LV[p.lv]}</span>{" "}
                  <span className="d">
                    {p.dup ? "dup" : `${p.rtt}ms`}
                    {p.tx > 1 ? ` tx${p.tx}` : ""}
                  </span>
                </div>
              ))}
              {cut && <div className="cr-row l1">-- {gapS} s 동안 수신 없음 · 재연결 대기 --</div>}
              <div className="cr-row cr-cur" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* 재생 막대 */}
        <div className="cr-play">
          <button type="button" className="cr-btn" onClick={toggle} aria-label={playing ? "일시정지" : T >= span - 0.05 ? "처음부터 다시" : "재생"}>
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3" y="2" width="3.5" height="12" />
                <rect x="9.5" y="2" width="3.5" height="12" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 2l10 6-10 6z" />
              </svg>
            )}
          </button>
          <div className="cr-speed" role="group" aria-label="재생 배속">
            {SPEEDS.map((s) => (
              <button key={s} type="button" aria-pressed={speed === s} onClick={() => {
                speedRef.current = s;
                setSpeed(s);
              }}>
                ×{s}
              </button>
            ))}
          </div>
          <div className="cr-track">
            <div className="cr-ticks">
              {jumps.map((j) => (
                <button key={j.k} type="button" style={{ left: `${(j.tick / span) * 100}%` }} onClick={() => seek(j.at, true)} aria-label={`${j.t} 직전으로 이동`}>
                  {j.t}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={span}
              step={0.1}
              value={T}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="재생 위치 (PC 수신 시각)"
              aria-valuetext={`PC 수신 ${mmss(T)}, 장치 시각 ${mmss(view.esNow)}`}
              style={{ "--p": `${(T / span) * 100}%` } as React.CSSProperties}
            />
          </div>
          <span className="cr-time">
            {mmss(T)} / {mmss(span)}
          </span>
        </div>
        </div>

        {!started && (
          <div className="cr-start">
            <div className="cr-start-card">
              <p className="cr-start-k">기록 재생 대기</p>
              <p className="cr-start-t">
                {run.source.title} · 받은 시간 {Math.floor(span / 60) ? `${Math.floor(span / 60)}분 ` : ""}{Math.round(span % 60)}초 · 기록 {run.total}개
              </p>
              <button type="button" className="cr-start-go" onClick={() => seek(0, true)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 2l10 6-10 6z" />
                </svg>
                재생 시작
                <small>×10 · 약 {Math.round(span / 10)}초</small>
              </button>
              <div className="cr-start-jumps">
                <span>바로 보기</span>
                {jumps.map((j) => (
                  <button key={j.k} type="button" onClick={() => seek(j.at, true)}>
                    {j.long}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <ul className="cr-legend" aria-label="값의 출처">
        {isSim ? (
          <>
            <li>
              <span className="cr-ev ev-s">모의</span>모든 값은 LAB 02 가상 장치가 계산 (LAB 01 실측으로 맞춘 모형)
            </li>
            <li>
              <span className="cr-ev ev-r">재계산</span>위험지수는 가상 장치가 기록하지 않아 펌웨어 식으로 계산
            </li>
          </>
        ) : (
          <>
            <li>
              <span className="cr-ev ev-m">실측</span>단계 · ΔT · 예측 · 위험지수 · 지연은 comm_run1.csv 그대로
            </li>
            <li>
              <span className="cr-ev ev-r">재계산</span>위험지수 막대 · 버퍼 개수 · 판정 사유 문장은 펌웨어 식으로 다시 계산
            </li>
          </>
        )}
        <li>
          <span className="cr-ev ev-c">두 시계</span>그래프 가로축은 ESP32가 잰 시각, 재생은 PC가 받은 시각
        </li>
        <li>
          <span className="cr-ev ev-n">알림</span>허용하면 이 탭을 보고 있지 않을 때 위험 단계 · 통신 끊김만 알려요
        </li>
      </ul>
      <p className="sr-only" aria-live="polite">
        {say}
      </p>
    </section>
  );
}
